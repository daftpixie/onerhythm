from __future__ import annotations

from fastapi import Request, status

from app.api.errors import APIContractError
from app.runtime import AppSettings, get_settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def should_enforce_trusted_origin(*, method: str, path: str) -> bool:
    return method.upper() not in SAFE_METHODS and path.startswith("/v1/")


def validate_trusted_origin(
    *,
    origin: str | None,
    settings: AppSettings,
) -> None:
    if settings.env_name in {"local", "test"} and not origin:
        return

    if not origin:
        raise APIContractError(
            code="trusted_origin_required",
            message="This request must come from an allowed browser origin.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    normalized_origin = origin.rstrip("/")
    allowed_origins = {allowed_origin.rstrip("/") for allowed_origin in settings.allowed_origins}
    if normalized_origin not in allowed_origins:
        raise APIContractError(
            code="origin_not_allowed",
            message="This request origin is not allowed.",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"origin": normalized_origin},
        )


def enforce_trusted_browser_origin(
    request: Request,
    settings: AppSettings | None = None,
) -> None:
    resolved_settings = settings or get_settings()
    if not should_enforce_trusted_origin(method=request.method, path=request.url.path):
        return
    validate_trusted_origin(origin=request.headers.get("origin"), settings=resolved_settings)
