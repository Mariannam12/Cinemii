"""TMDB proxy.

Forwards whitelisted TMDB read endpoints from the frontend, injecting the API
key server-side so it never ships in the JS bundle. Adds a small in-memory TTL
cache to cut latency and stay well under TMDB rate limits.
"""

import time
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request

from config import TMDB_API_KEY, TMDB_BASE

router = APIRouter(prefix="/api/tmdb", tags=["tmdb"])

# Only these path prefixes may be proxied (read-only metadata).
_ALLOWED_PREFIXES = (
    "/trending/", "/movie/", "/tv/", "/person/",
    "/discover/", "/search/", "/genre/",
)

# path+query -> (expires_at, json)
_cache: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 300  # 5 minutes
_CACHE_MAX = 500

_client = httpx.AsyncClient(timeout=10.0)


def _is_allowed(path: str) -> bool:
    return any(path.startswith(p) for p in _ALLOWED_PREFIXES)


@router.get("/{tmdb_path:path}")
async def proxy(tmdb_path: str, request: Request):
    path = "/" + tmdb_path.lstrip("/")
    if not _is_allowed(path):
        raise HTTPException(status_code=403, detail="Endpoint not allowed.")

    # Pass through query params (except any api_key the client tried to send)
    params = {k: v for k, v in request.query_params.items() if k != "api_key"}
    params["api_key"] = TMDB_API_KEY

    cache_key = path + "?" + "&".join(f"{k}={v}" for k, v in sorted(params.items()) if k != "api_key")
    now = time.time()

    cached = _cache.get(cache_key)
    if cached and cached[0] > now:
        return cached[1]

    try:
        resp = await _client.get(f"{TMDB_BASE}{path}", params=params)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="TMDB upstream error.")

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail="TMDB error.")

    data = resp.json()

    # Evict oldest if cache is full
    if len(_cache) >= _CACHE_MAX:
        oldest = min(_cache, key=lambda k: _cache[k][0])
        _cache.pop(oldest, None)
    _cache[cache_key] = (now + _CACHE_TTL, data)

    return data
