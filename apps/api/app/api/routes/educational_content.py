from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.api.contracts import APIErrorResponse, EducationalContentResponseModel
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.audit import append_audit_event
from app.rate_limit import rate_limiter
from app.runtime import get_settings
from app.services.consent_state import require_granted_consent
from app.services.educational_guidance import generate_educational_content

router = APIRouter(tags=["educational-content"])
settings = get_settings()


@router.get(
    "/profiles/{profile_id}/educational-content",
    response_model=EducationalContentResponseModel,
    responses={401: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def get_educational_content(
    profile_id: str,
    auth_session = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> EducationalContentResponseModel:
    rate_limiter.check(
        key=f"education:{auth_session.user_id}",
        max_requests=settings.education_rate_limit_requests,
        window_seconds=settings.education_rate_limit_window_seconds,
    )
    # Guardrail: this endpoint is reserved for profile-driven educational output only.
    # It must never consume upload-session, OCR, or ECG-derived data when implemented.
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    require_granted_consent(
        db,
        profile_id=profile_id,
        consent_type="educational_profile",
        code="educational_consent_required",
        message="Grant educational-profile consent before requesting educational guidance.",
    )
    response = generate_educational_content(db, profile_id=profile_id)
    append_audit_event(
        db,
        event_type="educational_content.viewed",
        entity_type="profile",
        entity_id=profile.profile_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"response_version": response.response_version},
    )
    db.commit()
    return response
