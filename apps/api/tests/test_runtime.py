from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from app.rate_limit import InMemoryRateLimiter
from app.runtime import SettingsValidationError, get_settings


class RuntimeSettingsTests(unittest.TestCase):
    def test_production_requires_secure_cookie(self) -> None:
        with patch.dict(
            os.environ,
            {
                "ONERHYTHM_ENV": "production",
                "DATABASE_URL": "sqlite:///./apps/api/dev.db",
                "AUTH_ALLOWED_ORIGINS": "https://onerhythm.dev",
                "AUTH_COOKIE_SECURE": "false",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            with self.assertRaises(SettingsValidationError):
                get_settings()
        get_settings.cache_clear()

    def test_invalid_cookie_domain_is_rejected(self) -> None:
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "sqlite:///./apps/api/dev.db",
                "AUTH_ALLOWED_ORIGINS": "https://onerhythm.dev",
                "AUTH_COOKIE_DOMAIN": "https://onerhythm.org",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            with self.assertRaises(SettingsValidationError):
                get_settings()
        get_settings.cache_clear()

    def test_database_url_strips_surrounding_quotes(self) -> None:
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": '"sqlite:///./apps/api/dev.db"',
                "AUTH_ALLOWED_ORIGINS": "https://onerhythm.dev",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            settings = get_settings()
            self.assertEqual(settings.database_url, "sqlite:///./apps/api/dev.db")
        get_settings.cache_clear()

    def test_invalid_database_url_raises_clear_error(self) -> None:
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": '"postgresql+psycopg://postgres:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"',
                "AUTH_ALLOWED_ORIGINS": "https://onerhythm.dev",
            },
            clear=False,
        ):
            get_settings.cache_clear()
            with self.assertRaisesRegex(SettingsValidationError, "DATABASE_URL still contains placeholder markers"):
                get_settings()
        get_settings.cache_clear()


class RateLimiterTests(unittest.TestCase):
    def test_rate_limiter_blocks_after_limit(self) -> None:
        limiter = InMemoryRateLimiter()
        limiter.check(key="test", max_requests=1, window_seconds=60)
        with self.assertRaises(Exception):
            limiter.check(key="test", max_requests=1, window_seconds=60)
