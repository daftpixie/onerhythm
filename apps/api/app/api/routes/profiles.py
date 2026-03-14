from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.analytics import append_analytics_event
from app.api.contracts import APIErrorResponse, ProfileCreateRequest, ProfileResponse, ProfileUpdateRequest
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import AuthSessionContext, utcnow
from app.db.models import Profile, User

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _to_profile_response(profile: Profile, user: User) -> ProfileResponse:
    return ProfileResponse(
        profile_id=profile.profile_id,
        display_name=profile.display_name,
        preferred_language=user.preferred_language,
        diagnosis_selection={
            "diagnosis_code": profile.diagnosis_code,
            "diagnosis_source": profile.diagnosis_source,
            "free_text_condition": profile.free_text_condition,
        },
        physical_symptoms=profile.physical_symptoms,
        emotional_context=profile.emotional_context,
        treatment_history={
            "ablation_count": profile.ablation_count,
            "has_implantable_device": profile.has_implantable_device,
            "current_medications": profile.current_medications,
            "prior_procedures": profile.prior_procedures,
        },
        personal_narrative=profile.personal_narrative,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        deleted_at=profile.deleted_at,
    )


@router.post(
    "",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": APIErrorResponse}, 401: {"model": APIErrorResponse}},
)
def create_profile(
    payload: ProfileCreateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    user = db.query(User).filter(User.user_id == auth_session.user_id).one()
    if user.profile is not None:
        raise APIContractError(
            code="profile_exists",
            message="This account already has a profile.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user.preferred_language = payload.preferred_language
    user.updated_at = utcnow()
    profile = Profile(
        profile_id=str(uuid4()),
        user_id=user.user_id,
        display_name=payload.display_name,
        diagnosis_code=payload.diagnosis_selection.diagnosis_code,
        diagnosis_source=payload.diagnosis_selection.diagnosis_source,
        free_text_condition=payload.diagnosis_selection.free_text_condition,
        physical_symptoms=payload.physical_symptoms,
        emotional_context=payload.emotional_context,
        ablation_count=payload.treatment_history.ablation_count,
        has_implantable_device=payload.treatment_history.has_implantable_device,
        current_medications=payload.treatment_history.current_medications,
        prior_procedures=payload.treatment_history.prior_procedures,
        personal_narrative=payload.personal_narrative,
        profile_version=1,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    db.add(profile)
    append_audit_event(
        db,
        event_type="profile.created",
        entity_type="profile",
        entity_id=profile.profile_id,
        actor_type="user",
        actor_id=user.user_id,
    )
    append_analytics_event(
        db,
        event_name="profile_completed",
        path=f"/profiles/{profile.profile_id}",
        actor_scope="authenticated",
        session_id=auth_session.session_id,
        properties={"profile_present": True, "status": "completed"},
    )
    db.commit()
    db.refresh(profile)
    return _to_profile_response(profile, user)


@router.get(
    "/{profile_id}",
    response_model=ProfileResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def get_profile(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    user = db.query(User).filter(User.user_id == auth_session.user_id).one()
    return _to_profile_response(profile, user)


@router.patch(
    "/{profile_id}",
    response_model=ProfileResponse,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def update_profile(
    profile_id: str,
    payload: ProfileUpdateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    user = db.query(User).filter(User.user_id == auth_session.user_id).one()

    if payload.display_name is not None:
        profile.display_name = payload.display_name
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language
    if payload.diagnosis_selection is not None:
        profile.diagnosis_code = payload.diagnosis_selection.diagnosis_code
        profile.diagnosis_source = payload.diagnosis_selection.diagnosis_source
        profile.free_text_condition = payload.diagnosis_selection.free_text_condition
    if payload.physical_symptoms is not None:
        profile.physical_symptoms = payload.physical_symptoms
    if payload.emotional_context is not None:
        profile.emotional_context = payload.emotional_context
    if payload.treatment_history is not None:
        profile.ablation_count = payload.treatment_history.ablation_count
        profile.has_implantable_device = payload.treatment_history.has_implantable_device
        profile.current_medications = payload.treatment_history.current_medications
        profile.prior_procedures = payload.treatment_history.prior_procedures
    if payload.personal_narrative is not None:
        profile.personal_narrative = payload.personal_narrative

    profile.profile_version += 1
    profile.updated_at = utcnow()
    user.updated_at = utcnow()
    append_audit_event(
        db,
        event_type="profile.updated",
        entity_type="profile",
        entity_id=profile.profile_id,
        actor_type="user",
        actor_id=user.user_id,
        payload={"profile_version": profile.profile_version},
    )
    db.commit()
    db.refresh(profile)
    return _to_profile_response(profile, user)


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def delete_profile(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> Response:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    profile.deleted_at = utcnow()
    profile.updated_at = utcnow()
    append_audit_event(
        db,
        event_type="profile.deleted",
        entity_type="profile",
        entity_id=profile.profile_id,
        actor_type="user",
        actor_id=auth_session.user_id,
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
