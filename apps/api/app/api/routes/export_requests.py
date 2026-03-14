from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.contracts import APIErrorResponse, ExportRequestCreate, ExportRequestResponse
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import AuthSessionContext, utcnow
from app.db.models import ExportRequest
from app.services.data_rights import export_response, fulfill_export_request

router = APIRouter(tags=["export-requests"])


@router.get(
    "/profiles/{profile_id}/export-requests",
    response_model=list[ExportRequestResponse],
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def list_export_requests(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[ExportRequestResponse]:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    records = (
        db.query(ExportRequest)
        .filter(ExportRequest.profile_id == profile.profile_id)
        .order_by(ExportRequest.requested_at.desc())
        .all()
    )
    return [ExportRequestResponse.model_validate(export_response(record)) for record in records]


@router.get(
    "/profiles/{profile_id}/export-requests/{export_request_id}",
    response_model=ExportRequestResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def get_export_request(
    profile_id: str,
    export_request_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ExportRequestResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    record = (
        db.query(ExportRequest)
        .filter(
            ExportRequest.export_request_id == export_request_id,
            ExportRequest.profile_id == profile.profile_id,
        )
        .one_or_none()
    )
    if record is None:
        raise APIContractError(
            code="export_request_not_found",
            message="Export request was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"export_request_id": export_request_id},
        )
    return ExportRequestResponse.model_validate(export_response(record))


@router.get(
    "/profiles/{profile_id}/export-requests/{export_request_id}/download",
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def download_export_request(
    profile_id: str,
    export_request_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> FileResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    record = (
        db.query(ExportRequest)
        .filter(
            ExportRequest.export_request_id == export_request_id,
            ExportRequest.profile_id == profile.profile_id,
        )
        .one_or_none()
    )
    if record is None or not record.artifact_path:
        raise APIContractError(
            code="export_artifact_not_found",
            message="No export artifact is available for this request.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"export_request_id": export_request_id},
        )

    artifact_path = Path(record.artifact_path)
    if not artifact_path.exists():
        raise APIContractError(
            code="export_artifact_not_found",
            message="No export artifact is available for this request.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"export_request_id": export_request_id},
        )

    return FileResponse(
        artifact_path,
        filename=f"onerhythm-export-{profile.profile_id}.json",
        media_type="application/json",
    )


@router.post(
    "/profiles/{profile_id}/export-requests",
    response_model=ExportRequestResponse,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def create_export_request(
    profile_id: str,
    payload: ExportRequestCreate,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ExportRequestResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    record = ExportRequest(
        export_request_id=str(uuid4()),
        profile_id=profile.profile_id,
        status="requested",
        requested_at=payload.requested_at,
    )
    db.add(record)
    append_audit_event(
        db,
        event_type="export_request.created",
        entity_type="export_request",
        entity_id=record.export_request_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"profile_id": profile.profile_id},
    )
    db.flush()
    fulfill_export_request(db, request_record=record, actor_id=auth_session.user_id)
    db.commit()
    db.refresh(record)
    return ExportRequestResponse.model_validate(export_response(record))
