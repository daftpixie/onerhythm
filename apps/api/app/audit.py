from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from app.auth import utcnow
from app.db.models import AuditEvent
from app.request_context import get_request_id


def append_audit_event(
    db: Session,
    *,
    event_type: str,
    entity_type: str,
    entity_id: str,
    actor_type: str,
    actor_id: str | None,
    payload: dict[str, object] | None = None,
) -> None:
    event_payload = dict(payload or {})
    event_payload.setdefault("request_id", get_request_id())
    db.add(
        AuditEvent(
            audit_event_id=str(uuid4()),
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_type=actor_type,
            actor_id=actor_id,
            event_payload=event_payload,
            created_at=utcnow(),
        )
    )
