from __future__ import annotations

import logging

from fastapi import Request

from app.request_context import get_request_id

logger = logging.getLogger("onerhythm.error_reporting")


def report_exception(exc: Exception, *, request: Request | None = None) -> None:
    logger.error(
        "Unhandled exception captured",
        extra={
            "event_type": "error.reported",
            "method": request.method if request else None,
            "path": request.url.path if request else None,
            "request_id": get_request_id(),
        },
        exc_info=exc,
    )
