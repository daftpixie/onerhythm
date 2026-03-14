from fastapi import APIRouter, Depends, Query, Request, status

from sqlalchemy.orm import Session

from app.api.contracts import (
    APIErrorResponse,
    ResearchPulseDetailResponseModel,
    ResearchPulseFeedResponseModel,
)
from app.api.db import get_db
from app.api.deps import require_authenticated_subject
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.db.models import Profile
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings
from app.services.consent_state import require_granted_consent
from app.services.research_pulse import (
    get_research_pulse_publication,
    list_research_pulse_publications,
    list_personalized_research_pulse_publications,
)

router = APIRouter(tags=["research-pulse"])
settings = get_settings()


@router.get(
    "/research-pulse/latest",
    response_model=ResearchPulseFeedResponseModel,
    responses={400: {"model": APIErrorResponse}},
)
def list_latest_feed(
    request: Request,
    locale: str = Query(default="en-US", min_length=2),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ResearchPulseFeedResponseModel:
    rate_limiter.check(
        key=f"research-pulse-latest:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    return list_research_pulse_publications(
        db,
        locale=locale,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/research-pulse/topics/{theme_key}",
    response_model=ResearchPulseFeedResponseModel,
    responses={400: {"model": APIErrorResponse}},
)
def list_topic_feed(
    request: Request,
    theme_key: str,
    locale: str = Query(default="en-US", min_length=2),
    diagnosis_code: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ResearchPulseFeedResponseModel:
    rate_limiter.check(
        key=f"research-pulse-topic:{theme_key}:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    return list_research_pulse_publications(
        db,
        locale=locale,
        diagnosis_code=diagnosis_code,
        theme_key=theme_key,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/research-pulse/for-you",
    response_model=ResearchPulseFeedResponseModel,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}},
)
def list_personalized_feed(
    request: Request,
    locale: str | None = Query(default=None, min_length=2),
    theme_key: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    auth_session=Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ResearchPulseFeedResponseModel:
    rate_limiter.check(
        key=f"research-pulse-personalized:{auth_session.user_id}",
        max_requests=settings.education_rate_limit_requests,
        window_seconds=settings.education_rate_limit_window_seconds,
    )
    profile = (
        db.query(Profile)
        .filter(
            Profile.user_id == auth_session.user_id,
            Profile.deleted_at.is_(None),
        )
        .one_or_none()
    )
    if profile is None:
        raise APIContractError(
            code="profile_not_found",
            message="Create your self-reported profile before opening a personalized research feed.",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    # Personalized Research Pulse remains profile-driven educational output.
    # It must never consume ECG-derived inputs.
    require_granted_consent(
        db,
        profile_id=profile.profile_id,
        consent_type="educational_profile",
        code="educational_consent_required",
        message="Grant educational-profile consent before opening a personalized research feed.",
    )
    response = list_personalized_research_pulse_publications(
        db,
        user_id=auth_session.user_id,
        locale=locale,
        theme_key=theme_key,
        page=page,
        page_size=page_size,
    )
    append_audit_event(
        db,
        event_type="research_pulse.personalized_feed_viewed",
        entity_type="user",
        entity_id=auth_session.user_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"page": page, "page_size": page_size, "theme_key": theme_key},
    )
    db.commit()
    return response


@router.get(
    "/research-pulse",
    response_model=ResearchPulseFeedResponseModel,
    responses={400: {"model": APIErrorResponse}},
)
def list_feed(
    request: Request,
    locale: str = Query(default="en-US", min_length=2),
    diagnosis_code: str | None = Query(default=None),
    theme_key: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
) -> ResearchPulseFeedResponseModel:
    rate_limiter.check(
        key=f"research-pulse:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    return list_research_pulse_publications(
        db,
        locale=locale,
        diagnosis_code=diagnosis_code,
        theme_key=theme_key,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/research-pulse/{slug}",
    response_model=ResearchPulseDetailResponseModel,
    responses={404: {"model": APIErrorResponse}},
)
def get_feed_item(
    request: Request,
    slug: str,
    locale: str = Query(default="en-US", min_length=2),
    db: Session = Depends(get_db),
) -> ResearchPulseDetailResponseModel:
    rate_limiter.check(
        key=f"research-pulse-detail:{slug}:{request_client_id(request)}",
        max_requests=settings.public_rate_limit_requests,
        window_seconds=settings.public_rate_limit_window_seconds,
    )
    record = get_research_pulse_publication(db, slug=slug, locale=locale)
    if record is None:
        raise APIContractError(
            code="research_pulse_not_found",
            message="Research Pulse article was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"slug": slug},
        )
    return record
