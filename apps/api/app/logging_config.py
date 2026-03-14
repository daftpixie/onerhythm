from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone

from app.request_context import get_request_id
from app.runtime import AppSettings


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
        }
        if hasattr(record, "event_type"):
            payload["event_type"] = getattr(record, "event_type")
        if hasattr(record, "status_code"):
            payload["status_code"] = getattr(record, "status_code")
        if hasattr(record, "path"):
            payload["path"] = getattr(record, "path")
        if hasattr(record, "method"):
            payload["method"] = getattr(record, "method")
        if hasattr(record, "duration_ms"):
            payload["duration_ms"] = getattr(record, "duration_ms")
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, sort_keys=True)


def configure_logging(settings: AppSettings) -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.log_level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root_logger.handlers = [handler]
