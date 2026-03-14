from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.contracts import (
    APIErrorResponse,
    ConsentCreateRequest,
    ConsentRecordResponse,
    ConsentRevokeRequest,
    ConsentUpdateRequest,
)
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import AuthSessionContext, utcnow
from app.db.models import ConsentRecord

router = APIRouter(tags=["consent"])


def _to_response(record: ConsentRecord) -> ConsentRecordResponse:
    return ConsentRecordResponse(
        consent_record_id=record.consent_record_id,
        profile_id=record.profile_id,
        consent_type=record.consent_type,
        status=record.status,
        policy_version=record.policy_version,
        locale=record.locale,
        source="web",
        effective_at=record.effective_at,
        granted_at=record.granted_at,
        revoked_at=record.revoked_at,
        revocation_reason=record.revocation_reason,
    )


@router.get(
    "/profiles/{profile_id}/consents",
    response_model=list[ConsentRecordResponse],
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def list_consents(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[ConsentRecordResponse]:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    records = (
        db.query(ConsentRecord)
        .filter(ConsentRecord.profile_id == profile.profile_id)
        .order_by(ConsentRecord.effective_at.desc())
        .all()
    )
    return [_to_response(record) for record in records]


@router.post(
    "/consents",
    response_model=ConsentRecordResponse,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def create_consent(
    payload: ConsentCreateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ConsentRecordResponse:
    profile = require_owned_profile(payload.profile_id, db=db, auth_session=auth_session)
    record = ConsentRecord(
        consent_record_id=str(uuid4()),
        profile_id=profile.profile_id,
        consent_type=payload.consent_type,
        status=payload.status,
        policy_version=payload.policy_version,
        locale=payload.locale,
        source=payload.source,
        effective_at=payload.effective_at,
        granted_at=payload.effective_at if payload.status == "granted" else None,
        revoked_at=payload.effective_at if payload.status == "revoked" else None,
        revocation_reason=payload.revocation_reason,
    )
    db.add(record)
    append_audit_event(
        db,
        event_type="consent.created",
        entity_type="consent_record",
        entity_id=record.consent_record_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"status": record.status, "consent_type": record.consent_type},
    )
    db.commit()
    db.refresh(record)
    return _to_response(record)


@router.put(
    "/consents/{consent_record_id}",
    response_model=ConsentRecordResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def update_consent(
    consent_record_id: str,
    payload: ConsentUpdateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ConsentRecordResponse:
    record = db.query(ConsentRecord).filter(ConsentRecord.consent_record_id == consent_record_id).one_or_none()
    if record is None:
        raise APIContractError(
            code="consent_not_found",
            message="Consent record was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"consent_record_id": consent_record_id},
        )

    require_owned_profile(record.profile_id, db=db, auth_session=auth_session)
    record.consent_type = payload.consent_type
    record.status = payload.status
    record.policy_version = payload.policy_version
    record.locale = payload.locale
    record.effective_at = payload.effective_at
    record.granted_at = payload.effective_at if payload.status == "granted" else record.granted_at
    record.revoked_at = payload.effective_at if payload.status == "revoked" else None
    append_audit_event(
        db,
        event_type="consent.updated",
        entity_type="consent_record",
        entity_id=record.consent_record_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"status": record.status},
    )
    db.commit()
    db.refresh(record)
    return _to_response(record)


@router.post(
    "/consents/{consent_record_id}/revoke",
    response_model=ConsentRecordResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def revoke_consent(
    consent_record_id: str,
    payload: ConsentRevokeRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ConsentRecordResponse:
    record = db.query(ConsentRecord).filter(ConsentRecord.consent_record_id == consent_record_id).one_or_none()
    if record is None:
        raise APIContractError(
            code="consent_not_found",
            message="Consent record was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"consent_record_id": consent_record_id},
        )

    require_owned_profile(record.profile_id, db=db, auth_session=auth_session)
    record.status = "revoked"
    record.revoked_at = payload.revoked_at
    record.revocation_reason = payload.revocation_reason
    append_audit_event(
        db,
        event_type="consent.revoked",
        entity_type="consent_record",
        entity_id=record.consent_record_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"revocation_reason": payload.revocation_reason},
    )
    db.commit()
    db.refresh(record)
    return _to_response(record)
