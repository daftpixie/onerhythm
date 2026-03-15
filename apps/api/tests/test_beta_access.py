from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.requests import Request
from starlette.responses import Response

from app.api.contracts import BetaWaitlistSignupRequest
from app.api.routes.beta_access import join_waitlist
from app.db.base import Base
from app.db.models import BetaAllowlist, BetaWaitlistSignup, utcnow
from app.runtime import AppSettings
from app.services.beta_access import resolve_beta_access_state


def build_settings(*, beta_mode: str = "invite_only") -> AppSettings:
    return AppSettings(
        env_name="test",
        log_level="INFO",
        database_url="sqlite:///:memory:",
        allowed_origins=["http://127.0.0.1:3001"],
        auth_session_duration_days=14,
        auth_max_active_sessions=5,
        auth_cookie_secure=False,
        auth_cookie_domain=None,
        auth_cookie_samesite="lax",
        beta_mode=beta_mode,
        request_id_header="X-Request-ID",
        error_reporting_backend="log",
        public_rate_limit_requests=120,
        public_rate_limit_window_seconds=60,
        auth_rate_limit_requests=10,
        auth_rate_limit_window_seconds=60,
        waitlist_rate_limit_requests=5,
        waitlist_rate_limit_window_seconds=3600,
        upload_rate_limit_requests=12,
        upload_rate_limit_window_seconds=300,
        education_rate_limit_requests=30,
        education_rate_limit_window_seconds=300,
    )


class BetaAccessTests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite:///:memory:", future=True)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(bind=self.engine, autoflush=False, autocommit=False, future=True)
        self.db = self.SessionLocal()

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    def test_resolve_beta_access_state_requires_allowlist_in_invite_mode(self) -> None:
        email = "person@example.com"
        settings = build_settings(beta_mode="invite_only")

        self.assertEqual(
            resolve_beta_access_state(db=self.db, email=email, settings=settings),
            "pending",
        )

        self.db.add(BetaAllowlist(email=email, created_at=utcnow(), note=None))
        self.db.commit()

        self.assertEqual(
            resolve_beta_access_state(db=self.db, email=email, settings=settings),
            "granted",
        )

    def test_resolve_beta_access_state_is_not_required_when_beta_is_open(self) -> None:
        self.assertEqual(
            resolve_beta_access_state(
                db=self.db,
                email="person@example.com",
                settings=build_settings(beta_mode="open"),
            ),
            "not_required",
        )

    def test_join_waitlist_stores_email_once_and_returns_duplicate_state(self) -> None:
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/v1/beta/waitlist",
                "headers": [(b"origin", b"http://127.0.0.1:3001")],
                "query_string": b"",
                "client": ("127.0.0.1", 12345),
            }
        )

        created = join_waitlist(
            payload=BetaWaitlistSignupRequest(email="person@example.com", source="landing-page", website=""),
            request=request,
            response=Response(),
            db=self.db,
        )
        duplicate_response = Response()
        duplicate = join_waitlist(
            payload=BetaWaitlistSignupRequest(email="person@example.com", source="landing-page", website=""),
            request=request,
            response=duplicate_response,
            db=self.db,
        )

        self.assertEqual(created.status, "joined")
        self.assertEqual(duplicate.status, "already_joined")
        self.assertEqual(duplicate_response.status_code, 200)
        self.assertEqual(
            self.db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.email == "person@example.com")
            .count(),
            1,
        )

    def test_join_waitlist_honeypot_does_not_persist(self) -> None:
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/v1/beta/waitlist",
                "headers": [(b"origin", b"http://127.0.0.1:3001")],
                "query_string": b"",
                "client": ("127.0.0.1", 12345),
            }
        )

        joined = join_waitlist(
            payload=BetaWaitlistSignupRequest(
                email="robot@example.com",
                source="landing-page",
                website="https://spam.example",
            ),
            request=request,
            response=Response(),
            db=self.db,
        )

        self.assertEqual(joined.status, "joined")
        self.assertEqual(
            self.db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.email == "robot@example.com")
            .count(),
            0,
        )
