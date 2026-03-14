from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.contracts import APIErrorResponse, DeleteRequestCreate, DeleteRequestResponse
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import (
    AuthSessionContext,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    utcnow,
)
from app.db.models import DeleteRequest
from app.services.data_rights import delete_response, fulfill_delete_request

router = APIRouter(tags=["delete-requests"])


@router.get(
    "/profiles/{profile_id}/delete-requests",
    response_model=list[DeleteRequestResponse],
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def list_delete_requests(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[DeleteRequestResponse]:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    records = (
        db.query(DeleteRequest)
        .filter(DeleteRequest.profile_id == profile.profile_id)
        .order_by(DeleteRequest.requested_at.desc())
        .all()
    )
    return [DeleteRequestResponse.model_validate(delete_response(record)) for record in records]


@router.get(
    "/profiles/{profile_id}/delete-requests/{delete_request_id}",
    response_model=DeleteRequestResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def get_delete_request(
    profile_id: str,
    delete_request_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> DeleteRequestResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    record = (
        db.query(DeleteRequest)
        .filter(
            DeleteRequest.delete_request_id == delete_request_id,
            DeleteRequest.profile_id == profile.profile_id,
        )
        .one_or_none()
    )
    if record is None:
        raise APIContractError(
            code="delete_request_not_found",
            message="Delete request was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"delete_request_id": delete_request_id},
        )
    return DeleteRequestResponse.model_validate(delete_response(record))


@router.post(
    "/profiles/{profile_id}/delete-requests",
    response_model=DeleteRequestResponse,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def create_delete_request(
    profile_id: str,
    payload: DeleteRequestCreate,
    response: Response,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> DeleteRequestResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    record = DeleteRequest(
        delete_request_id=str(uuid4()),
        profile_id=profile.profile_id,
        status="requested",
        requested_at=payload.requested_at,
    )
    db.add(record)
    append_audit_event(
        db,
        event_type="delete_request.created",
        entity_type="delete_request",
        entity_id=record.delete_request_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"profile_id": profile.profile_id},
    )
    db.flush()
    fulfill_delete_request(db, request_record=record, actor_id=auth_session.user_id)
    db.commit()
    db.refresh(record)
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
    )
    return DeleteRequestResponse.model_validate(delete_response(record))
