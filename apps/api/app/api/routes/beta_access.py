from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.contracts import (
    APIErrorResponse,
    BetaWaitlistSignupRequest,
    BetaWaitlistSignupResponse,
)
from app.api.db import get_db
from app.api.errors import APIContractError
from app.auth import normalize_email, utcnow
from app.db.models import BetaAllowlist, BetaWaitlistSignup
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings

router = APIRouter(prefix="/beta", tags=["beta-access"])


@router.post(
    "/waitlist",
    response_model=BetaWaitlistSignupResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": APIErrorResponse}, 429: {"model": APIErrorResponse}},
)
def join_waitlist(
    payload: BetaWaitlistSignupRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> BetaWaitlistSignupResponse:
    settings = get_settings()
    rate_limiter.check(
        key=f"waitlist:{request_client_id(request)}",
        max_requests=settings.waitlist_rate_limit_requests,
        window_seconds=settings.waitlist_rate_limit_window_seconds,
    )

    try:
        email = normalize_email(payload.email)
    except ValueError as exc:
        raise APIContractError(
            code="invalid_waitlist_email",
            message=str(exc),
            status_code=status.HTTP_400_BAD_REQUEST,
        ) from exc

    if payload.website and payload.website.strip():
        return BetaWaitlistSignupResponse(
            status="joined",
            message="Thanks. You're on the beta waitlist.",
        )

    existing_signup = (
        db.query(BetaWaitlistSignup)
        .filter(BetaWaitlistSignup.email == email)
        .one_or_none()
    )
    allowlisted_email = (
        db.query(BetaAllowlist.email)
        .filter(BetaAllowlist.email == email)
        .one_or_none()
    )
    if existing_signup is not None or allowlisted_email is not None:
        response.status_code = status.HTTP_200_OK
        return BetaWaitlistSignupResponse(
            status="already_joined",
            message="This email is already on the beta list.",
        )

    db.add(
        BetaWaitlistSignup(
            id=str(uuid4()),
            email=email,
            source=payload.source,
            status="pending",
            created_at=utcnow(),
            metadata_json={},
        )
    )
    db.commit()

    return BetaWaitlistSignupResponse(
        status="joined",
        message="Thanks. You're on the beta waitlist.",
    )
