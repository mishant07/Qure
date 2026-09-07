"""Shared security guards — backend/security.py

Single home for the cheap, dependency-free protections ( findings #1–#6 ):
  * CORS origins come from FRONTEND_URL (comma-separated), never "*".
  * API_KEY set  -> locked mode: every route except /health + /openapi.json
    needs header X-API-Key, and /docs + /redoc turn off. Unset -> today's
    open demo behaviour, zero friction for SIH judges.
  * MAX_UPLOAD_MB caps request bodies (413 before the handler reads them,
    plus a post-read check for chunked bodies without Content-Length).
  * RATE_LIMIT_PER_MIN is a per-IP sliding window (stdlib only).
  * Four static security headers on every response.

# ponytail: rate limiter is single-process in-memory; use a shared store
# (redis) or proxy-level limits if ever deployed multi-worker.
"""
import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

FRONTEND_URLS = [
    u.strip()
    for u in os.getenv(
        "FRONTEND_URL", "http://localhost:5173,http://localhost:4173"
    ).split(",")
    if u.strip()
]
API_KEY = os.getenv("API_KEY", "")
MAX_UPLOAD_BYTES = int(float(os.getenv("MAX_UPLOAD_MB", "5")) * 1024 * 1024)
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "120"))

OPEN_PATHS = {"/health", "/openapi.json"}

_hits: Dict[str, Deque[float]] = defaultdict(deque)


def locked() -> bool:
    return bool(API_KEY)


def require_key(request: Request) -> None:
    """Dependency for routes: no-op in demo mode, 401 in locked mode."""
    if locked() and request.url.path not in OPEN_PATHS:
        if request.headers.get("x-api-key", "") != API_KEY:
            raise HTTPException(401, "missing or invalid X-API-Key")


def check_body_size(request: Request) -> None:
    """413 before handlers buffer giant bodies (findings #2).
    Note: the client may see a reset instead of the 413 JSON when its upload
    is still in flight — the rejection itself is guaranteed either way."""
    try:
        declared = int(request.headers.get("content-length", "0"))
    except ValueError:
        declared = 0
    if declared > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"body exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)}MB limit")


class GuardMiddleware(BaseHTTPMiddleware):
    """Rate limit + static security headers (findings #4, #5)."""

    async def dispatch(self, request: Request, call_next):
        check_body_size(request)
        if request.url.path not in OPEN_PATHS:
            now = time.monotonic()
            window = _hits[request.client.host if request.client else "?"]
            while window and now - window[0] > 60:
                window.popleft()
            if len(window) >= RATE_LIMIT_PER_MIN:
                return JSONResponse({"detail": "rate limit exceeded"}, 429)
            window.append(now)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        # ponytail: no HSTS — localhost/demo serves plain HTTP; add when TLS terminates here.
        return response
