from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.analytics import append_analytics_event
from app.api.contracts import (
    APIErrorResponse,
    AnalyticsEventCreateRequest,
    AnalyticsEventResponse,
)
from app.api.db import get_db
from app.api.deps import get_optional_auth_session
from app.api.errors import APIContractError
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings

router = APIRouter(prefix="/analytics", tags=["analytics"])
settings = get_settings()


@router.post(
    "/events",
    response_model=AnalyticsEventResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        400: {"model": APIErrorResponse},
        429: {"model": APIErrorResponse},
    },
)
def create_analytics_event(
    payload: AnalyticsEventCreateRequest,
    request: Request,
    auth_session=Depends(get_optional_auth_session),
    db: Session = Depends(get_db),
) -> AnalyticsEventResponse:
    rate_limiter.check(
        key=f"analytics:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    if not payload.path.startswith("/"):
        raise APIContractError(
            code="invalid_analytics_path",
            message="Analytics path must be a rooted application path.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"path": payload.path},
        )

    actor_scope = "authenticated" if auth_session is not None else "anonymous"
    event = append_analytics_event(
        db,
        event_name=payload.event_name,
        path=payload.path,
        actor_scope=actor_scope,
        visitor_id=payload.visitor_id,
        session_id=payload.session_id,
        properties=payload.properties,
    )
    db.commit()
    return AnalyticsEventResponse(
        analytics_event_id=event.analytics_event_id,
        event_name=event.event_name,
        path=event.path,
        actor_scope=event.actor_scope,  # type: ignore[arg-type]
        visitor_id=event.visitor_id,
        session_id=event.session_id,
        request_id=event.request_id,
        properties=event.event_properties or {},
        created_at=event.created_at,
    )
