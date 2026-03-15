from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable

from app.runtime import get_settings


SESSION_COOKIE_NAME = "onerhythm_session"
SETTINGS = get_settings()
SESSION_DURATION_DAYS = SETTINGS.auth_session_duration_days
MAX_ACTIVE_SESSIONS = SETTINGS.auth_max_active_sessions
SESSION_COOKIE_SECURE = SETTINGS.auth_cookie_secure
SESSION_COOKIE_DOMAIN = SETTINGS.auth_cookie_domain or None
SESSION_COOKIE_SAMESITE = SETTINGS.auth_cookie_samesite
MAX_PASSWORD_LENGTH = 128
PASSWORD_POLICY_MESSAGE = (
    "Use 12 to 128 characters and include letters plus at least one number or symbol."
)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=64,
    )
    return f"scrypt${salt.hex()}${derived.hex()}"


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if not normalized or len(normalized) > 320 or not EMAIL_PATTERN.match(normalized):
        raise ValueError("Enter a valid email address.")
    return normalized


def validate_password_strength(password: str) -> None:
    if len(password) < 12 or len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if password != password.strip():
        raise ValueError("Password must not start or end with spaces.")
    has_letter = any(character.isalpha() for character in password)
    has_non_letter = any(
        not character.isalpha() and not character.isspace() for character in password
    )
    if not has_letter or not has_non_letter:
        raise ValueError(PASSWORD_POLICY_MESSAGE)


def verify_password(password: str, encoded_hash: str) -> bool:
    algorithm, salt_hex, expected_hex = encoded_hash.split("$", 2)
    if algorithm != "scrypt":
        return False
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=bytes.fromhex(salt_hex),
        n=2**14,
        r=8,
        p=1,
        dklen=64,
    )
    return hmac.compare_digest(derived.hex(), expected_hex)


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_session_expiry() -> datetime:
    return utcnow() + timedelta(days=SESSION_DURATION_DAYS)


def format_ip_hint(ip_address: str | None) -> str | None:
    if not ip_address:
        return None
    if ":" in ip_address:
        segments = ip_address.split(":")
        if len(segments) > 2:
            return ":".join(segments[:2]) + ":*"
        return ip_address
    segments = ip_address.split(".")
    if len(segments) == 4:
        return ".".join((*segments[:3], "*"))
    return ip_address


def revoke_session_records(records: Iterable, *, revoked_at: datetime) -> None:
    for record in records:
        if record.revoked_at is None:
            record.revoked_at = revoked_at


@dataclass(frozen=True)
class AuthSessionContext:
    user_id: str
    email: str
    role: str
    session_id: str
