from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.contracts import (
    APIErrorResponse,
    BetaWaitlistReferralStatusResponse,
    BetaWaitlistSignupRequest,
    BetaWaitlistSignupResponse,
    BetaWaitlistStatsResponse,
)
from app.api.db import get_db
from app.api.errors import APIContractError
from app.auth import normalize_email, utcnow
from app.db.models import BetaAllowlist, BetaWaitlistSignup
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings

router = APIRouter(prefix="/beta", tags=["beta-access"])


def build_referral_code(db: Session) -> str:
    for _ in range(8):
        candidate = uuid4().hex[:12]
        existing = (
            db.query(BetaWaitlistSignup.id)
            .filter(BetaWaitlistSignup.referral_code == candidate)
            .one_or_none()
        )
        if existing is None:
            return candidate

    raise APIContractError(
        code="waitlist_referral_generation_failed",
        message="The waitlist could not generate a referral code right now.",
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


def count_referrals(db: Session, *, signup_id: str) -> int:
    return (
        db.query(BetaWaitlistSignup)
        .filter(BetaWaitlistSignup.referred_by_signup_id == signup_id)
        .count()
    )


def build_waitlist_signup_response(
    db: Session,
    *,
    status_value: str,
    message: str,
    signup: BetaWaitlistSignup | None,
) -> BetaWaitlistSignupResponse:
    referral_count = count_referrals(db, signup_id=signup.id) if signup is not None else 0
    return BetaWaitlistSignupResponse(
        status=status_value,
        message=message,
        referral_code=signup.referral_code if signup is not None else None,
        referral_count=referral_count,
    )


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
        return build_waitlist_signup_response(
            db,
            status_value="joined",
            message="Thanks. You're on the beta waitlist.",
            signup=None,
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
        return build_waitlist_signup_response(
            db,
            status_value="already_joined",
            message="This email is already on the beta list.",
            signup=existing_signup,
        )

    referring_signup = None
    referral_code = (payload.referral_code or "").strip().lower()
    if referral_code:
        referring_signup = (
            db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.referral_code == referral_code)
            .one_or_none()
        )
        if referring_signup is not None and referring_signup.email == email:
            referring_signup = None

    signup = BetaWaitlistSignup(
        id=str(uuid4()),
        email=email,
        referral_code=build_referral_code(db),
        referred_by_signup_id=referring_signup.id if referring_signup is not None else None,
        source=payload.source,
        status="pending",
        created_at=utcnow(),
        metadata_json={},
    )
    db.add(
        signup
    )
    db.commit()

    return build_waitlist_signup_response(
        db,
        status_value="joined",
        message="Thanks. You're on the beta waitlist.",
        signup=signup,
    )


@router.get(
    "/waitlist/stats",
    response_model=BetaWaitlistStatsResponse,
)
def get_waitlist_stats(
    request: Request, db: Session = Depends(get_db)
) -> BetaWaitlistStatsResponse:
    settings = get_settings()
    rate_limiter.check(
        key=f"public:beta:waitlist:stats:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )

    total_signups = db.query(BetaWaitlistSignup).count()
    latest_signup = (
        db.query(BetaWaitlistSignup.created_at)
        .order_by(BetaWaitlistSignup.created_at.desc())
        .limit(1)
        .scalar()
    )

    return BetaWaitlistStatsResponse(
        total_signups=total_signups,
        last_signup_at=latest_signup,
    )


@router.get(
    "/waitlist/referrals/{referral_code}",
    response_model=BetaWaitlistReferralStatusResponse,
)
def get_waitlist_referral_status(
    referral_code: str,
    request: Request,
    db: Session = Depends(get_db),
) -> BetaWaitlistReferralStatusResponse:
    settings = get_settings()
    rate_limiter.check(
        key=f"public:beta:waitlist:referrals:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )

    normalized_code = referral_code.strip().lower()
    signup = (
        db.query(BetaWaitlistSignup)
        .filter(BetaWaitlistSignup.referral_code == normalized_code)
        .one_or_none()
    )
    if signup is None:
        raise APIContractError(
            code="waitlist_referral_not_found",
            message="That referral code was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    return BetaWaitlistReferralStatusResponse(
        referral_code=signup.referral_code,
        referral_count=count_referrals(db, signup_id=signup.id),
    )
