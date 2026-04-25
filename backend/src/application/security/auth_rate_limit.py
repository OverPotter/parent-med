"""Storage-backed throttling for sensitive auth endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from src.core.exceptions import RateLimitedError
from src.domain.entities.auth_attempt import AuthAttempt
from src.domain.repositories.auth_attempt_repository import AuthAttemptRepository


@dataclass(frozen=True)
class _RateLimitWindow:
    max_attempts: int
    per: timedelta
    message: str
    code: str


class AuthAttemptThrottle:
    """Persists failed attempts so limits survive restarts and scale-out."""

    _last_pruned_at: datetime | None = None
    _prune_interval = timedelta(minutes=5)

    def __init__(self, repo: AuthAttemptRepository) -> None:
        self._repo = repo
        self._windows: dict[str, tuple[_RateLimitWindow, _RateLimitWindow]] = {
            "signin": (
                _RateLimitWindow(
                    max_attempts=10,
                    per=timedelta(minutes=10),
                    message="Слишком много попыток входа. Попробуйте позже.",
                    code="SIGNIN_RATE_LIMITED",
                ),
                _RateLimitWindow(
                    max_attempts=5,
                    per=timedelta(minutes=10),
                    message="Слишком много попыток входа для этого email. Попробуйте позже.",
                    code="SIGNIN_IDENTITY_RATE_LIMITED",
                ),
            ),
            "recovery_reset": (
                _RateLimitWindow(
                    max_attempts=8,
                    per=timedelta(minutes=15),
                    message="Слишком много попыток сброса пароля. Попробуйте позже.",
                    code="RECOVERY_RATE_LIMITED",
                ),
                _RateLimitWindow(
                    max_attempts=4,
                    per=timedelta(minutes=15),
                    message="Слишком много попыток для этого email. Попробуйте позже.",
                    code="RECOVERY_IDENTITY_RATE_LIMITED",
                ),
            ),
        }

    async def _prune_stale(self) -> None:
        now = datetime.now(UTC)
        if self._last_pruned_at and now - self._last_pruned_at < self._prune_interval:
            return
        max_window = max(window.per for windows in self._windows.values() for window in windows)
        await self._repo.delete_older_than(now - max_window)
        type(self)._last_pruned_at = now

    async def assert_allowed(
        self, action: str, ip_address: str | None, identifier: str | None
    ) -> None:
        await self._prune_stale()
        now = datetime.now(UTC)
        ip_window, identifier_window = self._windows[action]
        ip_key = f"ip:{(ip_address or 'unknown').strip().lower()}"
        identifier_key = f"id:{(identifier or '').strip().lower()}"

        ip_attempts = await self._repo.count_since(action, ip_key, now - ip_window.per)
        if ip_attempts >= ip_window.max_attempts:
            raise RateLimitedError(ip_window.message, code=ip_window.code)

        if identifier:
            identity_attempts = await self._repo.count_since(
                action,
                identifier_key,
                now - identifier_window.per,
            )
            if identity_attempts >= identifier_window.max_attempts:
                raise RateLimitedError(identifier_window.message, code=identifier_window.code)

    async def record_failure(
        self, action: str, ip_address: str | None, identifier: str | None
    ) -> None:
        now = datetime.now(UTC)
        attempts = [
            AuthAttempt(
                id=uuid4(),
                action=action,
                bucket_key=f"ip:{(ip_address or 'unknown').strip().lower()}",
                created_at=now,
            )
        ]
        normalized_identifier = (identifier or "").strip().lower()
        if normalized_identifier:
            attempts.append(
                AuthAttempt(
                    id=uuid4(),
                    action=action,
                    bucket_key=f"id:{normalized_identifier}",
                    created_at=now,
                )
            )
        for attempt in attempts:
            await self._repo.add(attempt)

    async def record_success(self) -> None:
        """Reserved for future decay/reset logic. Success does not need persistence cleanup."""


def build_auth_attempt_throttle(repo: AuthAttemptRepository) -> AuthAttemptThrottle:
    return AuthAttemptThrottle(repo)


def build_auth_attempt_bucket_keys(ip_address: str | None, identifier: str | None) -> list[str]:
    normalized_ip = (ip_address or "unknown").strip().lower()
    normalized_identifier = (identifier or "").strip().lower()
    keys = [f"ip:{normalized_ip}"]
    if normalized_identifier:
        keys.append(f"id:{normalized_identifier}")
    return keys
