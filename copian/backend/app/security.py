"""Security utilities: sliding-window rate limiter (Redis-backed when REDIS_URL is set) and startup checks."""

import logging
import os
import threading
import time
from collections import defaultdict, deque
from typing import Optional
from fastapi import HTTPException, Request


class InMemoryRateLimiter:
    """Thread-safe per-IP sliding-window rate limiter with optional Redis multi-worker backend."""

    def __init__(self) -> None:
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()
        self._redis_client: Optional[object] = None
        self._redis_checked = False

    def _get_redis(self):
        if self._redis_checked:
            return self._redis_client
        self._redis_checked = True
        redis_url = os.getenv("REDIS_URL", "").strip()
        if not redis_url:
            return None
        try:
            import redis  # type: ignore

            client = redis.Redis.from_url(redis_url, socket_timeout=1.5, decode_responses=True)
            client.ping()
            self._redis_client = client
        except Exception:
            self._redis_client = None
        return self._redis_client

    def check(self, key_bucket: str, client_ip: str, max_calls: int, window_seconds: int) -> None:
        redis_client = self._get_redis()
        if redis_client is not None:
            try:
                key = f"copian:rl:{key_bucket}:{client_ip}:{int(time.time() // window_seconds)}"
                count = redis_client.incr(key)
                if count == 1:
                    redis_client.expire(key, window_seconds)
                if count > max_calls:
                    raise HTTPException(
                        status_code=429,
                        detail="Too many requests. Please wait a moment before trying again.",
                    )
                return
            except HTTPException:
                raise
            except Exception:
                # Fall back safely to local sliding window if Redis glitches
                pass

        now = time.monotonic()
        cutoff = now - window_seconds
        k = (key_bucket, client_ip)
        with self._lock:
            q = self._hits[k]
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= max_calls:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please wait a moment before trying again.",
                )
            q.append(now)


rate_limiter = InMemoryRateLimiter()


def rate_limit(bucket: str, max_calls: int = 20, window_seconds: int = 60):
    """FastAPI dependency enforcing an IP-scoped sliding-window rate limit."""

    def _dependency(request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for", "")
        ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        rate_limiter.check(bucket, ip, max_calls=max_calls, window_seconds=window_seconds)

    return _dependency


def log_security_config(logger: logging.Logger) -> None:
    """Warn on startup when development/demo security defaults are active."""
    jwt_secret = os.getenv("JWT_SECRET", "copian-b2b-enterprise-secret-key-2026")
    enable_demo = os.getenv("ENABLE_DEMO_AUTH", "true").lower() in ("1", "true", "yes")
    if jwt_secret == "copian-b2b-enterprise-secret-key-2026":
        logger.warning("Using default development JWT_SECRET; override JWT_SECRET in production.")
    if enable_demo:
        logger.info("ENABLE_DEMO_AUTH is active for local/demo testing; set ENABLE_DEMO_AUTH=false in production.")
