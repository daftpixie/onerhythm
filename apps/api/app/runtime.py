from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


class SettingsValidationError(RuntimeError):
    pass


def _parse_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise SettingsValidationError(f"{name} must be a boolean value.")


def _parse_int(name: str, default: int, *, minimum: int | None = None) -> int:
    raw = os.getenv(name)
    value = default if raw is None else int(raw)
    if minimum is not None and value < minimum:
        raise SettingsValidationError(f"{name} must be >= {minimum}.")
    return value


def _parse_list(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    values = [item.strip() for item in raw.split(",") if item.strip()]
    if not values:
        raise SettingsValidationError(f"{name} must include at least one value.")
    return values


@dataclass(frozen=True)
class AppSettings:
    env_name: str
    log_level: str
    database_url: str
    allowed_origins: list[str]
    auth_session_duration_days: int
    auth_max_active_sessions: int
    auth_cookie_secure: bool
    auth_cookie_domain: str | None
    auth_cookie_samesite: str
    beta_mode: str
    request_id_header: str
    error_reporting_backend: str
    public_rate_limit_requests: int
    public_rate_limit_window_seconds: int
    auth_rate_limit_requests: int
    auth_rate_limit_window_seconds: int
    waitlist_rate_limit_requests: int
    waitlist_rate_limit_window_seconds: int
    upload_rate_limit_requests: int
    upload_rate_limit_window_seconds: int
    education_rate_limit_requests: int
    education_rate_limit_window_seconds: int

    def validate(self) -> None:
        if self.env_name not in {"local", "staging", "production", "test"}:
            raise SettingsValidationError(
                "ONERHYTHM_ENV must be one of: local, staging, production, test."
            )
        if not self.database_url:
            raise SettingsValidationError("DATABASE_URL must not be empty.")
        if self.auth_cookie_samesite not in {"lax", "strict", "none"}:
            raise SettingsValidationError("AUTH_COOKIE_SAMESITE must be lax, strict, or none.")
        if self.auth_cookie_domain and (
            "://" in self.auth_cookie_domain or "/" in self.auth_cookie_domain
        ):
            raise SettingsValidationError("AUTH_COOKIE_DOMAIN must be a bare domain value.")
        if self.env_name == "production" and not self.auth_cookie_secure:
            raise SettingsValidationError(
                "AUTH_COOKIE_SECURE must be true in production."
            )
        if self.auth_cookie_samesite == "none" and not self.auth_cookie_secure:
            raise SettingsValidationError(
                "AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAMESITE is none."
            )
        if self.log_level.upper() not in {"DEBUG", "INFO", "WARNING", "ERROR"}:
            raise SettingsValidationError("LOG_LEVEL must be DEBUG, INFO, WARNING, or ERROR.")
        if self.beta_mode not in {"open", "invite_only"}:
            raise SettingsValidationError("BETA_MODE must be open or invite_only.")
        if self.error_reporting_backend not in {"log"}:
            raise SettingsValidationError(
                "ERROR_REPORTING_BACKEND currently supports only 'log'."
            )


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    settings = AppSettings(
        env_name=os.getenv("ONERHYTHM_ENV", "local").strip().lower(),
        log_level=os.getenv("LOG_LEVEL", "INFO").strip().upper(),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./dev.db").strip(),
        allowed_origins=_parse_list(
            "AUTH_ALLOWED_ORIGINS",
            "http://127.0.0.1:3001,http://localhost:3001",
        ),
        auth_session_duration_days=_parse_int(
            "AUTH_SESSION_DURATION_DAYS",
            14,
            minimum=1,
        ),
        auth_max_active_sessions=_parse_int(
            "AUTH_MAX_ACTIVE_SESSIONS",
            5,
            minimum=1,
        ),
        auth_cookie_secure=_parse_bool("AUTH_COOKIE_SECURE", False),
        auth_cookie_domain=(os.getenv("AUTH_COOKIE_DOMAIN") or "").strip() or None,
        auth_cookie_samesite=os.getenv("AUTH_COOKIE_SAMESITE", "lax").strip().lower(),
        beta_mode=os.getenv("BETA_MODE", "open").strip().lower(),
        request_id_header=os.getenv("REQUEST_ID_HEADER", "X-Request-ID").strip() or "X-Request-ID",
        error_reporting_backend=os.getenv("ERROR_REPORTING_BACKEND", "log").strip().lower(),
        public_rate_limit_requests=_parse_int("PUBLIC_RATE_LIMIT_REQUESTS", 120, minimum=1),
        public_rate_limit_window_seconds=_parse_int(
            "PUBLIC_RATE_LIMIT_WINDOW_SECONDS",
            60,
            minimum=1,
        ),
        auth_rate_limit_requests=_parse_int("AUTH_RATE_LIMIT_REQUESTS", 10, minimum=1),
        auth_rate_limit_window_seconds=_parse_int(
            "AUTH_RATE_LIMIT_WINDOW_SECONDS",
            60,
            minimum=1,
        ),
        waitlist_rate_limit_requests=_parse_int(
            "WAITLIST_RATE_LIMIT_REQUESTS",
            5,
            minimum=1,
        ),
        waitlist_rate_limit_window_seconds=_parse_int(
            "WAITLIST_RATE_LIMIT_WINDOW_SECONDS",
            3600,
            minimum=1,
        ),
        upload_rate_limit_requests=_parse_int("UPLOAD_RATE_LIMIT_REQUESTS", 12, minimum=1),
        upload_rate_limit_window_seconds=_parse_int(
            "UPLOAD_RATE_LIMIT_WINDOW_SECONDS",
            300,
            minimum=1,
        ),
        education_rate_limit_requests=_parse_int(
            "EDUCATION_RATE_LIMIT_REQUESTS",
            30,
            minimum=1,
        ),
        education_rate_limit_window_seconds=_parse_int(
            "EDUCATION_RATE_LIMIT_WINDOW_SECONDS",
            300,
            minimum=1,
        ),
    )
    settings.validate()
    return settings
