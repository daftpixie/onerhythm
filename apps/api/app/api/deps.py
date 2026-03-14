from __future__ import annotations

from datetime import timezone

from fastapi import Cookie, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.db import get_db
from app.api.errors import APIContractError
from app.auth import AuthSessionContext, SESSION_COOKIE_NAME, hash_session_token, utcnow
from app.db.models import Profile, UserSession


def _as_utc(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_optional_auth_session(
    request: Request,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> AuthSessionContext | None:
    if not session_token:
        return None

    record = (
        db.query(UserSession)
        .filter(UserSession.token_hash == hash_session_token(session_token))
        .one_or_none()
    )
    if record is None or record.revoked_at is not None or _as_utc(record.expires_at) <= utcnow():
        return None

    if record.user.deleted_at is not None:
        record.revoked_at = utcnow()
        db.flush()
        return None

    record.last_seen_at = utcnow()
    db.flush()
    return AuthSessionContext(
        user_id=record.user.user_id,
        email=record.user.email,
        role=record.user.role,
        session_id=record.session_id,
    )


def require_authenticated_subject(
    auth_session: AuthSessionContext | None = Depends(get_optional_auth_session),
) -> AuthSessionContext:
    if auth_session is None:
        raise APIContractError(
            code="authentication_required",
            message="Authentication is required for this endpoint.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    return auth_session


def require_owned_profile(
    profile_id: str,
    *,
    db: Session,
    auth_session: AuthSessionContext,
) -> Profile:
    profile = db.query(Profile).filter(Profile.profile_id == profile_id).one_or_none()
    if profile is None:
        raise APIContractError(
            code="profile_not_found",
            message="Profile was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"profile_id": profile_id},
        )

    if profile.deleted_at is not None:
        raise APIContractError(
            code="profile_not_found",
            message="Profile was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"profile_id": profile_id},
        )

    if profile.user_id != auth_session.user_id:
        raise APIContractError(
            code="ownership_required",
            message="You do not have access to this profile.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"profile_id": profile_id},
        )

    return profile


def require_roles(
    *,
    auth_session: AuthSessionContext,
    allowed_roles: tuple[str, ...],
) -> AuthSessionContext:
    if auth_session.role not in allowed_roles:
        raise APIContractError(
            code="role_required",
            message="You do not have access to this endpoint.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"allowed_roles": ",".join(allowed_roles)},
        )

    return auth_session
