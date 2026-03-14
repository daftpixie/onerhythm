from __future__ import annotations

from sqlalchemy.orm import Session

from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.db.models import ConsentRecord


def get_latest_consent(
    db: Session,
    *,
    profile_id: str,
    consent_type: str,
) -> ConsentRecord | None:
    return (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.profile_id == profile_id,
            ConsentRecord.consent_type == consent_type,
        )
        .order_by(ConsentRecord.effective_at.desc())
        .first()
    )


def require_granted_consent(
    db: Session,
    *,
    profile_id: str,
    consent_type: str,
    code: str,
    message: str,
) -> ConsentRecord:
    record = get_latest_consent(db, profile_id=profile_id, consent_type=consent_type)
    if record is None or record.status != "granted":
        raise APIContractError(code=code, message=message, status_code=403)
    return record


def append_consent_audit_event(
    db: Session,
    *,
    event_type: str,
    consent_record_id: str,
    actor_id: str | None,
    payload: dict[str, str | bool | int | None] | None,
) -> None:
    append_audit_event(
        db,
        event_type=event_type,
        entity_type="consent_record",
        entity_id=consent_record_id,
        actor_type="user" if actor_id else "system",
        actor_id=actor_id,
        payload=payload,
    )
