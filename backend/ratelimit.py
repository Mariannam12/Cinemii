"""Tiny in-memory rate limiter (per client IP, per route).

Good enough for a single-instance deployment (Render free tier). For multiple
instances you'd move the buckets to Redis, but the dependency interface stays
the same.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

# "path:ip" -> deque[timestamps]
_buckets: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Behind Render/Vercel the real IP is in X-Forwarded-For (first hop).
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limiter(max_requests: int, window_seconds: int):
    """Dependency factory: allow `max_requests` per `window_seconds` per IP."""

    def dependency(request: Request):
        key = f"{request.url.path}:{_client_ip(request)}"
        now = time.time()
        bucket = _buckets[key]
        cutoff = now - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= max_requests:
            retry = int(bucket[0] + window_seconds - now) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a moment and try again.",
                headers={"Retry-After": str(max(retry, 1))},
            )
        bucket.append(now)

    return dependency
