from __future__ import annotations

from app.runtime import get_settings


def get_database_url() -> str:
    return get_settings().database_url
