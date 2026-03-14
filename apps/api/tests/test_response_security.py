from __future__ import annotations

import unittest

from app.response_security import build_response_security_headers, is_experimental_api_path
from app.runtime import AppSettings


def build_settings(*, env_name: str = "production") -> AppSettings:
    return AppSettings(
        env_name=env_name,
        log_level="INFO",
        database_url="sqlite:///./dev.db",
        allowed_origins=["http://127.0.0.1:3001", "http://localhost:3001"],
        auth_session_duration_days=14,
        auth_max_active_sessions=5,
        auth_cookie_secure=(env_name == "production"),
        auth_cookie_samesite="lax",
        request_id_header="X-Request-ID",
        error_reporting_backend="log",
        public_rate_limit_requests=120,
        public_rate_limit_window_seconds=60,
        auth_rate_limit_requests=10,
        auth_rate_limit_window_seconds=60,
        upload_rate_limit_requests=12,
        upload_rate_limit_window_seconds=300,
        education_rate_limit_requests=30,
        education_rate_limit_window_seconds=300,
    )


class ResponseSecurityTests(unittest.TestCase):
    def test_public_routes_receive_baseline_headers(self) -> None:
        headers = build_response_security_headers(
            path="/v1/mosaic/tiles",
            settings=build_settings(),
        )

        self.assertEqual(headers["Referrer-Policy"], "strict-origin-when-cross-origin")
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(headers["X-Frame-Options"], "DENY")
        self.assertIn("Strict-Transport-Security", headers)
        self.assertNotIn("X-OneRhythm-Release-Stage", headers)

    def test_local_environment_omits_hsts(self) -> None:
        headers = build_response_security_headers(
            path="/health",
            settings=build_settings(env_name="local"),
        )

        self.assertNotIn("Strict-Transport-Security", headers)

    def test_private_routes_are_marked_experimental_and_no_store(self) -> None:
        headers = build_response_security_headers(
            path="/v1/auth/session",
            settings=build_settings(),
        )

        self.assertEqual(headers["Cache-Control"], "private, no-store, max-age=0")
        self.assertEqual(headers["X-OneRhythm-Release-Stage"], "experimental")

    def test_for_you_feed_is_treated_as_experimental(self) -> None:
        self.assertTrue(is_experimental_api_path("/v1/research-pulse/for-you"))

    def test_public_research_pulse_feed_is_not_marked_experimental(self) -> None:
        self.assertFalse(is_experimental_api_path("/v1/research-pulse"))


if __name__ == "__main__":
    unittest.main()

