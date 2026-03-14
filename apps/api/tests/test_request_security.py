from __future__ import annotations

import unittest

from app.api.errors import APIContractError
from app.request_security import should_enforce_trusted_origin, validate_trusted_origin
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


class RequestSecurityTests(unittest.TestCase):
    def test_safe_method_does_not_require_origin(self) -> None:
        self.assertFalse(should_enforce_trusted_origin(method="GET", path="/v1/auth/session"))

    def test_mutating_api_method_requires_origin(self) -> None:
        self.assertTrue(should_enforce_trusted_origin(method="POST", path="/v1/auth/sign-in"))

    def test_allowed_origin_passes(self) -> None:
        validate_trusted_origin(
            origin="http://127.0.0.1:3001",
            settings=build_settings(),
        )

    def test_missing_origin_fails_in_production(self) -> None:
        with self.assertRaises(APIContractError) as context:
            validate_trusted_origin(origin=None, settings=build_settings())

        self.assertEqual(context.exception.code, "trusted_origin_required")

    def test_missing_origin_is_allowed_in_local(self) -> None:
        validate_trusted_origin(origin=None, settings=build_settings(env_name="local"))

    def test_disallowed_origin_fails(self) -> None:
        with self.assertRaises(APIContractError) as context:
            validate_trusted_origin(
                origin="https://evil.example",
                settings=build_settings(),
            )

        self.assertEqual(context.exception.code, "origin_not_allowed")


if __name__ == "__main__":
    unittest.main()
