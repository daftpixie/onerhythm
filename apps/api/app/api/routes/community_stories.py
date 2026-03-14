from __future__ import annotations

import re
from uuid import uuid4

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.analytics import append_analytics_event
from app.api.contracts import (
    APIErrorResponse,
    CommunityStoryCreateRequest,
    CommunityStoryModerationRequest,
    CommunityStoryResponse,
    CommunityStorySubmitRequest,
    CommunityStoryUpdateRequest,
    ConsentRecordResponse,
    PublicCommunityStoryResponse,
)
from app.api.db import get_db
from app.api.deps import require_authenticated_subject, require_owned_profile, require_roles
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import AuthSessionContext, utcnow
from app.db.models import CommunityStory, ConsentRecord, Profile

router = APIRouter(tags=["community-stories"])


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized[:80] or "story"


def _author_name(story: CommunityStory, profile: Profile) -> str:
    if story.author_display_mode == "pseudonym" and story.pseudonym:
        return story.pseudonym

    if profile.display_name:
        return profile.display_name.split()[0]

    return "OneRhythm member"


def _to_story_response(story: CommunityStory) -> CommunityStoryResponse:
    return CommunityStoryResponse(
        story_id=story.story_id,
        profile_id=story.profile_id,
        slug=story.slug,
        title=story.title,
        summary=story.summary,
        body=story.body,
        visibility_status=story.visibility_status,
        review_status=story.review_status,
        author_display_mode=story.author_display_mode,
        pseudonym=story.pseudonym,
        consent_record_id=story.consent_record_id,
        moderator_note=story.moderator_note,
        submitted_at=story.submitted_at,
        reviewed_at=story.reviewed_at,
        published_at=story.published_at,
        created_at=story.created_at,
        updated_at=story.updated_at,
    )


def _to_public_story_response(story: CommunityStory, profile: Profile) -> PublicCommunityStoryResponse:
    if story.published_at is None:
        raise APIContractError(
            code="story_not_published",
            message="Story is not published.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    return PublicCommunityStoryResponse(
        story_id=story.story_id,
        slug=story.slug,
        title=story.title,
        summary=story.summary,
        body=story.body,
        author_name=_author_name(story, profile),
        published_at=story.published_at,
    )


def _append_audit(
    db: Session,
    *,
    event_type: str,
    story: CommunityStory,
    actor: AuthSessionContext,
    payload: dict[str, str] | None = None,
) -> None:
    append_audit_event(
        db,
        event_type=event_type,
        entity_type="community_story",
        entity_id=story.story_id,
        actor_type="user",
        actor_id=actor.user_id,
        payload=payload,
    )


def _latest_story_consent(profile_id: str, db: Session) -> ConsentRecord | None:
    return (
        db.query(ConsentRecord)
        .filter(
            ConsentRecord.profile_id == profile_id,
            ConsentRecord.consent_type == "public_story_sharing",
        )
        .order_by(ConsentRecord.effective_at.desc())
        .first()
    )


def _require_granted_story_consent(
    *,
    profile_id: str,
    consent_record_id: str,
    auth_session: AuthSessionContext,
    db: Session,
) -> ConsentRecord:
    record = (
        db.query(ConsentRecord)
        .filter(ConsentRecord.consent_record_id == consent_record_id)
        .one_or_none()
    )
    if record is None:
        raise APIContractError(
            code="consent_not_found",
            message="Consent record was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"consent_record_id": consent_record_id},
        )

    require_owned_profile(profile_id, db=db, auth_session=auth_session)
    if record.profile_id != profile_id or record.consent_type != "public_story_sharing":
        raise APIContractError(
            code="story_consent_required",
            message="Explicit public-story-sharing consent is required before review or publication.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    if record.status != "granted" or record.revoked_at is not None:
        raise APIContractError(
            code="story_consent_required",
            message="Explicit public-story-sharing consent is required before review or publication.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return record


@router.get(
    "/profiles/{profile_id}/stories",
    response_model=list[CommunityStoryResponse],
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def list_owned_stories(
    profile_id: str,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[CommunityStoryResponse]:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    stories = (
        db.query(CommunityStory)
        .filter(CommunityStory.profile_id == profile.profile_id)
        .order_by(CommunityStory.updated_at.desc())
        .all()
    )
    return [_to_story_response(story) for story in stories]


@router.post(
    "/profiles/{profile_id}/stories",
    response_model=CommunityStoryResponse,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": APIErrorResponse}, 403: {"model": APIErrorResponse}, 404: {"model": APIErrorResponse}},
)
def create_story(
    profile_id: str,
    payload: CommunityStoryCreateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> CommunityStoryResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    story = CommunityStory(
        story_id=str(uuid4()),
        user_id=auth_session.user_id,
        profile_id=profile.profile_id,
        slug=f"{_slugify(payload.title)}-{uuid4().hex[:8]}",
        title=payload.title,
        summary=payload.summary,
        body=payload.body,
        author_display_mode=payload.author_display_mode,
        pseudonym=payload.pseudonym if payload.author_display_mode == "pseudonym" else None,
        visibility_status="private",
        review_status="draft",
        updated_at=utcnow(),
    )
    db.add(story)
    _append_audit(db, event_type="community_story.created", story=story, actor=auth_session)
    db.commit()
    db.refresh(story)
    return _to_story_response(story)


@router.put(
    "/profiles/{profile_id}/stories/{story_id}",
    response_model=CommunityStoryResponse,
)
def update_story(
    profile_id: str,
    story_id: str,
    payload: CommunityStoryUpdateRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> CommunityStoryResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    story = (
        db.query(CommunityStory)
        .filter(CommunityStory.story_id == story_id, CommunityStory.profile_id == profile.profile_id)
        .one_or_none()
    )
    if story is None:
        raise APIContractError(
            code="story_not_found",
            message="Story was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"story_id": story_id},
        )

    if payload.title is not None:
        story.title = payload.title
    if payload.summary is not None:
        story.summary = payload.summary
    if payload.body is not None:
        story.body = payload.body
    if payload.author_display_mode is not None:
        story.author_display_mode = payload.author_display_mode
    if payload.pseudonym is not None:
        story.pseudonym = payload.pseudonym if story.author_display_mode == "pseudonym" else None
    if payload.visibility_status is not None and payload.visibility_status == "private":
        story.visibility_status = "private"
    story.updated_at = utcnow()
    _append_audit(db, event_type="community_story.updated", story=story, actor=auth_session)
    db.commit()
    db.refresh(story)
    return _to_story_response(story)


@router.post(
    "/profiles/{profile_id}/stories/{story_id}/submit",
    response_model=CommunityStoryResponse,
)
def submit_story_for_review(
    profile_id: str,
    story_id: str,
    payload: CommunityStorySubmitRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> CommunityStoryResponse:
    profile = require_owned_profile(profile_id, db=db, auth_session=auth_session)
    story = (
        db.query(CommunityStory)
        .filter(CommunityStory.story_id == story_id, CommunityStory.profile_id == profile.profile_id)
        .one_or_none()
    )
    if story is None:
        raise APIContractError(
            code="story_not_found",
            message="Story was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"story_id": story_id},
        )

    consent_record = _require_granted_story_consent(
        profile_id=profile.profile_id,
        consent_record_id=payload.consent_record_id,
        auth_session=auth_session,
        db=db,
    )
    story.consent_record_id = consent_record.consent_record_id
    story.visibility_status = "review"
    story.review_status = "pending_review"
    story.submitted_at = utcnow()
    story.updated_at = utcnow()
    _append_audit(
        db,
        event_type="community_story.submitted_for_review",
        story=story,
        actor=auth_session,
        payload={"consent_record_id": consent_record.consent_record_id},
    )
    append_analytics_event(
        db,
        event_name="community_story_submitted",
        path=f"/profiles/{profile.profile_id}/stories/{story.story_id}/submit",
        actor_scope="authenticated",
        session_id=auth_session.session_id,
        properties={"status": story.review_status},
    )
    db.commit()
    db.refresh(story)
    return _to_story_response(story)


@router.get("/stories/public", response_model=list[PublicCommunityStoryResponse])
def list_public_stories(db: Session = Depends(get_db)) -> list[PublicCommunityStoryResponse]:
    stories = (
        db.query(CommunityStory, Profile)
        .join(Profile, Profile.profile_id == CommunityStory.profile_id)
        .filter(CommunityStory.visibility_status == "published", CommunityStory.published_at.is_not(None))
        .order_by(CommunityStory.published_at.desc())
        .all()
    )
    return [_to_public_story_response(story, profile) for story, profile in stories]


@router.get(
    "/stories/public/{slug}",
    response_model=PublicCommunityStoryResponse,
    responses={404: {"model": APIErrorResponse}},
)
def get_public_story(slug: str, db: Session = Depends(get_db)) -> PublicCommunityStoryResponse:
    result = (
        db.query(CommunityStory, Profile)
        .join(Profile, Profile.profile_id == CommunityStory.profile_id)
        .filter(
            CommunityStory.slug == slug,
            CommunityStory.visibility_status == "published",
            CommunityStory.published_at.is_not(None),
        )
        .one_or_none()
    )
    if result is None:
        raise APIContractError(
            code="story_not_found",
            message="Story was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"slug": slug},
        )

    story, profile = result
    return _to_public_story_response(story, profile)


@router.get(
    "/moderation/stories",
    response_model=list[CommunityStoryResponse],
)
def list_stories_for_moderation(
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> list[CommunityStoryResponse]:
    require_roles(auth_session=auth_session, allowed_roles=("support", "admin"))
    stories = (
        db.query(CommunityStory)
        .filter(CommunityStory.visibility_status == "review")
        .order_by(CommunityStory.submitted_at.asc(), CommunityStory.updated_at.asc())
        .all()
    )
    return [_to_story_response(story) for story in stories]


@router.post(
    "/moderation/stories/{story_id}/publish",
    response_model=CommunityStoryResponse,
)
def publish_story(
    story_id: str,
    payload: CommunityStoryModerationRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> CommunityStoryResponse:
    require_roles(auth_session=auth_session, allowed_roles=("support", "admin"))
    story = db.query(CommunityStory).filter(CommunityStory.story_id == story_id).one_or_none()
    if story is None:
        raise APIContractError(
            code="story_not_found",
            message="Story was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"story_id": story_id},
        )

    if story.consent_record_id is None:
        raise APIContractError(
            code="story_consent_required",
            message="Explicit public-story-sharing consent is required before publication.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    consent_record = (
        db.query(ConsentRecord)
        .filter(ConsentRecord.consent_record_id == story.consent_record_id)
        .one_or_none()
    )
    if consent_record is None or consent_record.status != "granted" or consent_record.revoked_at is not None:
        raise APIContractError(
            code="story_consent_required",
            message="Explicit public-story-sharing consent is required before publication.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    story.visibility_status = "published"
    story.review_status = "approved"
    story.moderator_note = payload.moderator_note
    story.reviewed_at = utcnow()
    story.published_at = utcnow()
    story.updated_at = utcnow()
    _append_audit(db, event_type="community_story.published", story=story, actor=auth_session)
    db.commit()
    db.refresh(story)
    return _to_story_response(story)


@router.post(
    "/moderation/stories/{story_id}/request-changes",
    response_model=CommunityStoryResponse,
)
def request_story_changes(
    story_id: str,
    payload: CommunityStoryModerationRequest,
    auth_session: AuthSessionContext = Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> CommunityStoryResponse:
    require_roles(auth_session=auth_session, allowed_roles=("support", "admin"))
    story = db.query(CommunityStory).filter(CommunityStory.story_id == story_id).one_or_none()
    if story is None:
        raise APIContractError(
            code="story_not_found",
            message="Story was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"story_id": story_id},
        )

    story.visibility_status = "private"
    story.review_status = "changes_requested"
    story.moderator_note = payload.moderator_note
    story.reviewed_at = utcnow()
    story.updated_at = utcnow()
    _append_audit(
        db,
        event_type="community_story.changes_requested",
        story=story,
        actor=auth_session,
    )
    db.commit()
    db.refresh(story)
    return _to_story_response(story)
