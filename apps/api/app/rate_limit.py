from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock
from time import time
from typing import Deque

from fastapi import Request, status

from app.api.errors import APIContractError


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._entries: dict[str, Deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, *, key: str, max_requests: int, window_seconds: int) -> int:
        now = time()
        with self._lock:
            bucket = self._entries[key]
            while bucket and now - bucket[0] >= window_seconds:
                bucket.popleft()
            if len(bucket) >= max_requests:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                raise APIContractError(
                    code="rate_limited",
                    message="Too many requests for this endpoint. Try again soon.",
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    details={"retry_after_seconds": retry_after},
                )
            bucket.append(now)
            return len(bucket)


rate_limiter = InMemoryRateLimiter()


def request_client_id(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    if request.client and request.client.host:
        return request.client.host
    return "unknown"
