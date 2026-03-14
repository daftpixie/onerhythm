from __future__ import annotations

from uuid import uuid4

from sqlalchemy.orm import Session

from app.db.models import AnalyticsEvent
from app.db.models import utcnow
from app.request_context import get_request_id


def append_analytics_event(
    db: Session,
    *,
    event_name: str,
    path: str,
    actor_scope: str,
    visitor_id: str | None = None,
    session_id: str | None = None,
    properties: dict[str, str | int | float | bool | None] | None = None,
) -> AnalyticsEvent:
    event = AnalyticsEvent(
        analytics_event_id=str(uuid4()),
        event_name=event_name,
        path=path,
        actor_scope=actor_scope,
        visitor_id=visitor_id,
        session_id=session_id,
        request_id=get_request_id(),
        event_properties=properties or None,
        created_at=utcnow(),
    )
    db.add(event)
    return event
