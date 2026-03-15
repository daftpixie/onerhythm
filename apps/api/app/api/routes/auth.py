from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.contracts import (
    APIErrorResponse,
    AuthSessionListResponse,
    AuthSessionRecordResponse,
    SessionResponse,
    SessionUserResponse,
    SignInRequest,
    SignUpRequest,
)
from app.api.db import get_db
from app.api.deps import get_optional_auth_session, require_authenticated_subject
from app.api.errors import APIContractError
from app.audit import append_audit_event
from app.auth import (
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_DOMAIN,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    MAX_ACTIVE_SESSIONS,
    PASSWORD_POLICY_MESSAGE,
    format_ip_hint,
    get_session_expiry,
    hash_password,
    hash_session_token,
    normalize_email,
    new_session_token,
    revoke_session_records,
    utcnow,
    validate_password_strength,
    verify_password,
)
from app.db.models import User, UserSession
from app.rate_limit import rate_limiter, request_client_id
from app.runtime import get_settings
from app.services.beta_access import resolve_beta_access_state

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _session_response(user: User, *, db: Session) -> SessionResponse:
    return SessionResponse(
        authenticated=True,
        user=SessionUserResponse(
            user_id=user.user_id,
            email=user.email,
            role=user.role,
            preferred_language=user.preferred_language,
            profile_id=user.profile.profile_id if user.profile else None,
        ),
        beta_access=resolve_beta_access_state(
            db=db,
            email=user.email,
            settings=get_settings(),
        ),
    )


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        domain=SESSION_COOKIE_DOMAIN,
        samesite=SESSION_COOKIE_SAMESITE,
        path="/",
        max_age=settings.auth_session_duration_days * 24 * 60 * 60,
        expires=get_session_expiry(),
    )


def _active_sessions_query(db: Session, *, user_id: str):
    return (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
        .order_by(UserSession.created_at.desc())
    )


def _prune_expired_sessions(db: Session, *, user_id: str) -> None:
    expired_records = (
        _active_sessions_query(db, user_id=user_id)
        .filter(UserSession.expires_at <= utcnow())
        .all()
    )
    revoke_session_records(expired_records, revoked_at=utcnow())


def _enforce_active_session_limit(db: Session, *, user_id: str) -> None:
    active_records = (
        _active_sessions_query(db, user_id=user_id)
        .filter(UserSession.expires_at > utcnow())
        .all()
    )
    if len(active_records) <= MAX_ACTIVE_SESSIONS:
        return
    revoke_session_records(active_records[MAX_ACTIVE_SESSIONS:], revoked_at=utcnow())


def _build_session_record_response(
    record: UserSession,
    *,
    current_session_id: str,
) -> AuthSessionRecordResponse:
    return AuthSessionRecordResponse(
        session_id=record.session_id,
        created_at=record.created_at,
        last_seen_at=record.last_seen_at,
        expires_at=record.expires_at,
        current=record.session_id == current_session_id,
        user_agent=record.user_agent,
        ip_address_hint=format_ip_hint(record.ip_address),
    )


def _list_active_sessions(
    db: Session,
    *,
    user_id: str,
    current_session_id: str,
) -> AuthSessionListResponse:
    _prune_expired_sessions(db, user_id=user_id)
    records = (
        _active_sessions_query(db, user_id=user_id)
        .filter(UserSession.expires_at > utcnow())
        .all()
    )
    return AuthSessionListResponse(
        sessions=[
            _build_session_record_response(record, current_session_id=current_session_id)
            for record in records
        ]
    )


def _new_session(
    *,
    user_id: str,
    request: Request,
) -> tuple[str, UserSession]:
    session_token = new_session_token()
    return session_token, UserSession(
        session_id=str(uuid4()),
        user_id=user_id,
        token_hash=hash_session_token(session_token),
        expires_at=get_session_expiry(),
        last_seen_at=utcnow(),
        created_at=utcnow(),
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )


@router.post(
    "/sign-up",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": APIErrorResponse}},
)
def sign_up(
    payload: SignUpRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> SessionResponse:
    rate_limiter.check(
        key=f"auth:sign-up:{request_client_id(request)}",
        max_requests=settings.auth_rate_limit_requests,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )
    try:
        email = normalize_email(payload.email)
        validate_password_strength(payload.password)
    except ValueError as exc:
        raise APIContractError(
            code="invalid_auth_payload",
            message=str(exc),
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"password_policy": PASSWORD_POLICY_MESSAGE},
        ) from exc
    if resolve_beta_access_state(db=db, email=email, settings=get_settings()) == "pending":
        raise APIContractError(
            code="beta_invite_required",
            message=(
                "Beta access is currently invite-only. Join the waitlist and we'll email you "
                "when space opens."
            ),
            status_code=status.HTTP_403_FORBIDDEN,
        )
    existing_user = db.query(User).filter(User.email == email).one_or_none()
    if existing_user is not None:
        raise APIContractError(
            code="email_in_use",
            message="An account with this email already exists.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    user = User(
        user_id=str(uuid4()),
        email=email,
        password_hash=hash_password(payload.password),
        role="user",
        preferred_language=payload.preferred_language,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    db.add(user)

    session_token, session = _new_session(user_id=user.user_id, request=request)
    db.add(session)
    append_audit_event(
        db,
        event_type="auth.sign_up",
        entity_type="user",
        entity_id=user.user_id,
        actor_type="user",
        actor_id=user.user_id,
        payload={"role": user.role},
    )
    _enforce_active_session_limit(db, user_id=user.user_id)
    db.commit()
    db.refresh(user)
    _set_session_cookie(response, session_token)
    return _session_response(user, db=db)


@router.post(
    "/sign-in",
    response_model=SessionResponse,
    responses={400: {"model": APIErrorResponse}, 401: {"model": APIErrorResponse}},
)
def sign_in(
    payload: SignInRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> SessionResponse:
    rate_limiter.check(
        key=f"auth:sign-in:{request_client_id(request)}",
        max_requests=settings.auth_rate_limit_requests,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )
    try:
        email = normalize_email(payload.email)
    except ValueError:
        raise APIContractError(
            code="invalid_credentials",
            message="The email or password was not recognized.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        ) from None
    user = db.query(User).filter(User.email == email).one_or_none()
    if user is None or user.deleted_at is not None or not verify_password(payload.password, user.password_hash):
        raise APIContractError(
            code="invalid_credentials",
            message="The email or password was not recognized.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    _prune_expired_sessions(db, user_id=user.user_id)
    session_token, session = _new_session(user_id=user.user_id, request=request)
    db.add(session)
    append_audit_event(
        db,
        event_type="auth.sign_in",
        entity_type="user",
        entity_id=user.user_id,
        actor_type="user",
        actor_id=user.user_id,
    )
    _enforce_active_session_limit(db, user_id=user.user_id)
    db.commit()
    db.refresh(user)
    _set_session_cookie(response, session_token)
    return _session_response(user, db=db)


@router.post(
    "/sign-out",
    response_model=SessionResponse,
    responses={401: {"model": APIErrorResponse}},
)
def sign_out(
    response: Response,
    auth_session=Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> SessionResponse:
    record = (
        db.query(UserSession)
        .filter(UserSession.session_id == auth_session.session_id)
        .one()
    )
    record.revoked_at = utcnow()
    append_audit_event(
        db,
        event_type="auth.sign_out",
        entity_type="user",
        entity_id=auth_session.user_id,
        actor_type="user",
        actor_id=auth_session.user_id,
    )
    db.commit()
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        domain=SESSION_COOKIE_DOMAIN,
        path="/",
        samesite=SESSION_COOKIE_SAMESITE,
        secure=SESSION_COOKIE_SECURE,
    )
    return SessionResponse(authenticated=False, user=None, beta_access="not_required")


@router.get(
    "/session",
    response_model=SessionResponse,
)
def get_session(
    auth_session=Depends(get_optional_auth_session),
    db: Session = Depends(get_db),
) -> SessionResponse:
    if auth_session is None:
        return SessionResponse(authenticated=False, user=None, beta_access="not_required")

    user = db.query(User).filter(User.user_id == auth_session.user_id).one()
    return _session_response(user, db=db)


@router.get(
    "/sessions",
    response_model=AuthSessionListResponse,
    responses={401: {"model": APIErrorResponse}},
)
def list_sessions(
    auth_session=Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> AuthSessionListResponse:
    return _list_active_sessions(
        db,
        user_id=auth_session.user_id,
        current_session_id=auth_session.session_id,
    )


@router.post(
    "/sessions/revoke-others",
    response_model=AuthSessionListResponse,
    responses={401: {"model": APIErrorResponse}},
)
def revoke_other_sessions(
    auth_session=Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> AuthSessionListResponse:
    now = utcnow()
    records = (
        _active_sessions_query(db, user_id=auth_session.user_id)
        .filter(
            UserSession.session_id != auth_session.session_id,
            UserSession.expires_at > now,
        )
        .all()
    )
    revoke_session_records(records, revoked_at=now)
    if records:
        append_audit_event(
            db,
            event_type="auth.revoke_other_sessions",
            entity_type="user",
            entity_id=auth_session.user_id,
            actor_type="user",
            actor_id=auth_session.user_id,
            payload={"revoked_session_count": len(records)},
        )
    db.commit()
    return _list_active_sessions(
        db,
        user_id=auth_session.user_id,
        current_session_id=auth_session.session_id,
    )


@router.post(
    "/sessions/{session_id}/revoke",
    response_model=AuthSessionListResponse,
    responses={400: {"model": APIErrorResponse}, 401: {"model": APIErrorResponse}},
)
def revoke_session(
    session_id: str,
    auth_session=Depends(require_authenticated_subject),
    db: Session = Depends(get_db),
) -> AuthSessionListResponse:
    if session_id == auth_session.session_id:
        raise APIContractError(
            code="use_sign_out_for_current_session",
            message="Use sign out to end the current session.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    record = (
        _active_sessions_query(db, user_id=auth_session.user_id)
        .filter(UserSession.session_id == session_id)
        .one_or_none()
    )
    if record is None or record.expires_at <= utcnow():
        raise APIContractError(
            code="session_not_found",
            message="That session is no longer active.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    record.revoked_at = utcnow()
    append_audit_event(
        db,
        event_type="auth.revoke_session",
        entity_type="user",
        entity_id=auth_session.user_id,
        actor_type="user",
        actor_id=auth_session.user_id,
        payload={"revoked_session_id": session_id},
    )
    db.commit()
    return _list_active_sessions(
        db,
        user_id=auth_session.user_id,
        current_session_id=auth_session.session_id,
    )
