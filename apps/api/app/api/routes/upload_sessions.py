"""Legacy v1/v1.5 upload-session routes.

These routes remain mounted during the PRD v3 migration. They are not part of
the mission v3 synthetic-only truth layer and must not receive new canonical
product investment.
"""

from __future__ import annotations

from datetime import datetime, timezone
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.analytics import append_analytics_event
from app.api.contracts import (
    APIErrorResponse,
    TileAttributionModel,
    UploadSessionProcessRequest,
    UploadSessionResponse,
    UploadSessionStartRequest,
)
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.db.models import ProcessingJob, UploadSession
from app.rate_limit import rate_limiter
from app.runtime import get_settings
from app.services.consent_state import require_granted_consent
from app.services.upload_pipeline import (
    build_upload_session_response,
    process_upload_session_file,
)

router = APIRouter(prefix="/upload-sessions", tags=["upload-sessions"])
settings = get_settings()
FIRST_NAME_SANITIZE_PATTERN = re.compile(r"[^A-Za-z'-]")
LOCATION_SANITIZE_PATTERN = re.compile(r"[^A-Za-z0-9,.' -]")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_text(value: str | None) -> str | None:
    collapsed = " ".join((value or "").strip().split())
    return collapsed or None


def _build_tile_attribution(
    *,
    share_first_name: bool,
    first_name: str | None,
    share_location: bool,
    location_label: str | None,
) -> TileAttributionModel | None:
    contributor_name: str | None = None
    contributor_location: str | None = None

    if share_first_name:
        normalized_name = _normalize_text(first_name)
        if normalized_name is None:
            raise APIContractError(
                code="tile_first_name_required",
                message="Add a first name or turn off name sharing for this tile.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        first_token = normalized_name.split(" ")[0]
        contributor_name = FIRST_NAME_SANITIZE_PATTERN.sub("", first_token)[:32] or None
        if contributor_name is None:
            raise APIContractError(
                code="tile_first_name_invalid",
                message="Use letters, apostrophes, or hyphens for the tile first name.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    if share_location:
        normalized_location = _normalize_text(location_label)
        if normalized_location is None:
            raise APIContractError(
                code="tile_location_required",
                message="Add a location label or turn off location sharing for this tile.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        contributor_location = (
            LOCATION_SANITIZE_PATTERN.sub("", normalized_location)[:64] or None
        )
        if contributor_location is None:
            raise APIContractError(
                code="tile_location_invalid",
                message="Use a short city, state, or country label for the tile location.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    if contributor_name is None and contributor_location is None:
        return None

    return TileAttributionModel(
        contributor_name=contributor_name,
        contributor_location=contributor_location,
    )


def _require_owned_upload_session(
    upload_session_id: str,
    *,
    db: Session,
    auth_session,
) -> UploadSession:
    upload_session = (
        db.query(UploadSession)
        .filter(UploadSession.upload_session_id == upload_session_id)
        .one_or_none()
    )
    if upload_session is None:
        raise APIContractError(
            code="upload_session_not_found",
            message="Upload session was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"upload_session_id": upload_session_id},
        )
    if upload_session.user_id != auth_session.user_id:
        raise APIContractError(
            code="ownership_required",
            message="You do not have access to this upload session.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"upload_session_id": upload_session_id},
        )
    return upload_session


@router.post(
    "",
    response_model=UploadSessionResponse,
    responses={
        400: {"model": APIErrorResponse},
        401: {"model": APIErrorResponse},
        500: {"model": APIErrorResponse},
    },
)
def start_upload_session(
    payload: UploadSessionStartRequest,
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> UploadSessionResponse:
    rate_limiter.check(
        key=f"upload:start:{auth_session.user_id}",
        max_requests=settings.upload_rate_limit_requests,
        window_seconds=settings.upload_rate_limit_window_seconds,
    )
    if payload.profile_id is not None:
        require_owned_profile(payload.profile_id, db=db, auth_session=auth_session)
        require_granted_consent(
            db,
            profile_id=payload.profile_id,
            consent_type="mosaic_contribution",
            code="mosaic_consent_required",
            message="Grant mosaic-contribution consent before starting an upload session.",
        )
    upload_session = UploadSession(
        upload_session_id=str(uuid4()),
        user_id=auth_session.user_id,
        profile_id=payload.profile_id,
        upload_format=payload.upload_format,
        processing_status="initiated",
        consent_record_ids=payload.consent_record_ids,
        phi_redaction_applied=False,
        raw_upload_retained=False,
        processing_pipeline_version="pending",
        started_at=utcnow(),
    )
    db.add(upload_session)
    db.add(
        ProcessingJob(
            processing_job_id=str(uuid4()),
            upload_session_id=upload_session.upload_session_id,
            job_kind="session_created",
            status="completed",
            attempt_count=1,
            queued_at=utcnow(),
            started_at=utcnow(),
            completed_at=utcnow(),
            job_payload={"consent_record_ids": payload.consent_record_ids},
        )
    )
    append_audit_event(
        db,
        event_type="upload_session.created",
        entity_type="upload_session",
        entity_id=upload_session.upload_session_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"upload_format": payload.upload_format},
    )
    append_analytics_event(
        db,
        event_name="ecg_contribution_started",
        path="/upload-sessions",
        actor_scope="authenticated",
        session_id=auth_session.session_id,
        properties={
            "upload_format": payload.upload_format,
            "profile_present": payload.profile_id is not None,
            "status": "initiated",
        },
    )
    db.commit()
    db.refresh(upload_session)
    return UploadSessionResponse.model_validate(build_upload_session_response(upload_session))


@router.get(
    "",
    response_model=list[UploadSessionResponse],
    responses={
        401: {"model": APIErrorResponse},
        500: {"model": APIErrorResponse},
    },
)
def list_upload_sessions(
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[UploadSessionResponse]:
    rate_limiter.check(
        key=f"upload:list:{auth_session.user_id}",
        max_requests=settings.upload_rate_limit_requests * 3,
        window_seconds=settings.upload_rate_limit_window_seconds,
    )
    upload_sessions = (
        db.query(UploadSession)
        .filter(UploadSession.user_id == auth_session.user_id)
        .order_by(UploadSession.started_at.desc(), UploadSession.upload_session_id.desc())
        .all()
    )
    return [
        UploadSessionResponse.model_validate(build_upload_session_response(upload_session))
        for upload_session in upload_sessions
    ]


@router.post(
    "/{upload_session_id}/process",
    response_model=UploadSessionResponse,
    responses={
        400: {"model": APIErrorResponse},
        401: {"model": APIErrorResponse},
        404: {"model": APIErrorResponse},
        500: {"model": APIErrorResponse},
    },
)
def process_upload_session(
    upload_session_id: str,
    processing_pipeline_version: str = Form(...),
    share_first_name: bool = Form(False),
    first_name: str | None = Form(default=None),
    share_location: bool = Form(False),
    location_label: str | None = Form(default=None),
    file: UploadFile = File(...),
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> UploadSessionResponse:
    rate_limiter.check(
        key=f"upload:process:{auth_session.user_id}",
        max_requests=settings.upload_rate_limit_requests,
        window_seconds=settings.upload_rate_limit_window_seconds,
    )
    tile_attribution = _build_tile_attribution(
        share_first_name=share_first_name,
        first_name=first_name,
        share_location=share_location,
        location_label=location_label,
    )
    payload = UploadSessionProcessRequest(
        processing_pipeline_version=processing_pipeline_version,
        tile_attribution=tile_attribution,
    )
    upload_session = _require_owned_upload_session(
        upload_session_id,
        db=db,
        auth_session=auth_session,
    )

    try:
        process_upload_session_file(
            db,
            actor_id=auth_session.user_id,
            processing_pipeline_version=payload.processing_pipeline_version,
            session=upload_session,
            uploaded_file=file,
            tile_attribution=(
                payload.tile_attribution.model_dump(exclude_none=True)
                if payload.tile_attribution is not None
                else None
            ),
        )
        append_analytics_event(
            db,
            event_name="ecg_contribution_completed",
            path=f"/upload-sessions/{upload_session_id}/process",
            actor_scope="authenticated",
            session_id=auth_session.session_id,
            properties={
                "upload_format": upload_session.upload_format,
                "profile_present": upload_session.profile_id is not None,
                "status": upload_session.processing_status,
            },
        )
        db.commit()
    except APIContractError:
        db.commit()
        raise
    except Exception as exc:
        db.rollback()
        raise APIContractError(
            code="unexpected_upload_session_failure",
            message="The upload session could not be processed.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"upload_session_id": upload_session_id},
        ) from exc

    db.refresh(upload_session)
    return UploadSessionResponse.model_validate(build_upload_session_response(upload_session))


@router.delete(
    "/{upload_session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": APIErrorResponse},
        404: {"model": APIErrorResponse},
        500: {"model": APIErrorResponse},
    },
)
def delete_upload_session(
    upload_session_id: str,
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> Response:
    rate_limiter.check(
        key=f"upload:delete:{auth_session.user_id}",
        max_requests=settings.upload_rate_limit_requests,
        window_seconds=settings.upload_rate_limit_window_seconds,
    )
    upload_session = _require_owned_upload_session(
        upload_session_id,
        db=db,
        auth_session=auth_session,
    )
    resulting_tile_id = upload_session.resulting_tile_id
    had_derived_tile = upload_session.mosaic_tile is not None
    had_contribution = upload_session.rhythm_contribution is not None

    db.query(ProcessingJob).filter(
        ProcessingJob.upload_session_id == upload_session.upload_session_id
    ).delete(synchronize_session=False)
    if upload_session.mosaic_tile is not None:
        db.delete(upload_session.mosaic_tile)
        db.flush()
    if upload_session.rhythm_contribution is not None:
        db.delete(upload_session.rhythm_contribution)
        db.flush()
    db.delete(upload_session)
    db.flush()

    append_audit_event(
        db,
        event_type="upload_session.deleted",
        entity_type="upload_session",
        entity_id=upload_session_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={
            "had_derived_tile": had_derived_tile,
            "had_contribution": had_contribution,
            "resulting_tile_id": resulting_tile_id,
            "raw_upload_retained": False,
        },
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{upload_session_id}",
    response_model=UploadSessionResponse,
    responses={
        401: {"model": APIErrorResponse},
        404: {"model": APIErrorResponse},
        500: {"model": APIErrorResponse},
    },
)
def get_upload_session(
    upload_session_id: str,
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> UploadSessionResponse:
    rate_limiter.check(
        key=f"upload:status:{auth_session.user_id}",
        max_requests=settings.upload_rate_limit_requests * 3,
        window_seconds=settings.upload_rate_limit_window_seconds,
    )
    upload_session = _require_owned_upload_session(
        upload_session_id,
        db=db,
        auth_session=auth_session,
    )
    return UploadSessionResponse.model_validate(build_upload_session_response(upload_session))
