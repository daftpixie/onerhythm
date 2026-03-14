from __future__ import annotations

from app.runtime import AppSettings

BASELINE_RESPONSE_HEADERS = {
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=()",
}
STRICT_TRANSPORT_SECURITY_VALUE = "max-age=63072000; includeSubDomains; preload"
EXPERIMENTAL_API_PREFIXES = (
    "/v1/auth",
    "/v1/profiles",
    "/v1/consents",
    "/v1/upload-sessions",
)
EXPERIMENTAL_API_PATHS = {
    "/v1/research-pulse/for-you",
}


def is_experimental_api_path(path: str) -> bool:
    normalized_path = path.rstrip("/") or "/"
    if normalized_path in EXPERIMENTAL_API_PATHS:
        return True
    return any(normalized_path.startswith(prefix) for prefix in EXPERIMENTAL_API_PREFIXES)


def build_response_security_headers(*, path: str, settings: AppSettings) -> dict[str, str]:
    headers = dict(BASELINE_RESPONSE_HEADERS)

    if settings.env_name in {"staging", "production"}:
        headers["Strict-Transport-Security"] = STRICT_TRANSPORT_SECURITY_VALUE

    if is_experimental_api_path(path):
        headers["Cache-Control"] = "private, no-store, max-age=0"
        headers["X-OneRhythm-Release-Stage"] = "experimental"

    return headers
