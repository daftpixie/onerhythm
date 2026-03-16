from __future__ import annotations

import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.requests import Request
from starlette.responses import Response

from app.api.contracts import BetaWaitlistSignupRequest
from app.api.routes.beta_access import (
    get_waitlist_referral_status,
    get_waitlist_stats,
    join_waitlist,
)
from app.db.base import Base
from app.db.models import BetaAllowlist, BetaWaitlistSignup, utcnow
from app.rate_limit import rate_limiter
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
        rate_limiter._entries.clear()

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
        self.assertIsNotNone(created.referral_code)
        self.assertEqual(created.referral_count, 0)
        self.assertEqual(duplicate.status, "already_joined")
        self.assertEqual(duplicate.referral_code, created.referral_code)
        self.assertEqual(duplicate.referral_count, 0)
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
        self.assertIsNone(joined.referral_code)
        self.assertEqual(
            self.db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.email == "robot@example.com")
            .count(),
            0,
        )

    def test_join_waitlist_records_referrals_and_returns_count(self) -> None:
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

        inviter = join_waitlist(
            payload=BetaWaitlistSignupRequest(email="inviter@example.com", source="landing-page", website=""),
            request=request,
            response=Response(),
            db=self.db,
        )
        invited = join_waitlist(
            payload=BetaWaitlistSignupRequest(
                email="friend@example.com",
                source="landing-page",
                website="",
                referral_code=inviter.referral_code,
            ),
            request=request,
            response=Response(),
            db=self.db,
        )
        refreshed_inviter = join_waitlist(
            payload=BetaWaitlistSignupRequest(email="inviter@example.com", source="landing-page", website=""),
            request=request,
            response=Response(),
            db=self.db,
        )

        self.assertEqual(invited.status, "joined")
        self.assertEqual(refreshed_inviter.referral_count, 1)

        stored_invited = (
            self.db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.email == "friend@example.com")
            .one()
        )
        stored_inviter = (
            self.db.query(BetaWaitlistSignup)
            .filter(BetaWaitlistSignup.email == "inviter@example.com")
            .one()
        )
        self.assertEqual(stored_invited.referred_by_signup_id, stored_inviter.id)

    def test_get_waitlist_stats_returns_aggregate_counts(self) -> None:
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/v1/beta/waitlist/stats",
                "headers": [(b"origin", b"http://127.0.0.1:3001")],
                "query_string": b"",
                "client": ("127.0.0.1", 12345),
            }
        )

        join_waitlist(
            payload=BetaWaitlistSignupRequest(email="one@example.com", source="landing-page", website=""),
            request=Request(
                {
                    "type": "http",
                    "method": "POST",
                    "path": "/v1/beta/waitlist",
                    "headers": [(b"origin", b"http://127.0.0.1:3001")],
                    "query_string": b"",
                    "client": ("127.0.0.1", 12345),
                }
            ),
            response=Response(),
            db=self.db,
        )
        join_waitlist(
            payload=BetaWaitlistSignupRequest(email="two@example.com", source="landing-page", website=""),
            request=Request(
                {
                    "type": "http",
                    "method": "POST",
                    "path": "/v1/beta/waitlist",
                    "headers": [(b"origin", b"http://127.0.0.1:3001")],
                    "query_string": b"",
                    "client": ("127.0.0.1", 12345),
                }
            ),
            response=Response(),
            db=self.db,
        )

        stats = get_waitlist_stats(request=request, db=self.db)

        self.assertEqual(stats.total_signups, 2)
        self.assertIsNotNone(stats.last_signup_at)

    def test_get_waitlist_referral_status_returns_confirmed_count(self) -> None:
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

        inviter = join_waitlist(
            payload=BetaWaitlistSignupRequest(email="inviter@example.com", source="landing-page", website=""),
            request=request,
            response=Response(),
            db=self.db,
        )
        join_waitlist(
            payload=BetaWaitlistSignupRequest(
                email="friend@example.com",
                source="landing-page",
                website="",
                referral_code=inviter.referral_code,
            ),
            request=request,
            response=Response(),
            db=self.db,
        )

        referral_status = get_waitlist_referral_status(
            referral_code=inviter.referral_code or "",
            request=Request(
                {
                    "type": "http",
                    "method": "GET",
                    "path": f"/v1/beta/waitlist/referrals/{inviter.referral_code}",
                    "headers": [(b"origin", b"http://127.0.0.1:3001")],
                    "query_string": b"",
                    "client": ("127.0.0.1", 12345),
                }
            ),
            db=self.db,
        )

        self.assertEqual(referral_status.referral_code, inviter.referral_code)
        self.assertEqual(referral_status.referral_count, 1)
