"""Repository interface for persisted auth throttling attempts."""

from __future__ import annotations

from abc import abstractmethod
from contextlib import AbstractAsyncContextManager
from datetime import datetime

from src.domain.entities.auth_attempt import AuthAttempt
from src.domain.repositories.base import BaseRepository


class AuthAttemptRepository(BaseRepository[AuthAttempt]):
    @abstractmethod
    def locked(self, keys: list[str]) -> AbstractAsyncContextManager[AuthAttemptRepository]:
        """Lock logical buckets so count+record can be coordinated for the same identity."""
        ...

    @abstractmethod
    async def count_since(self, action: str, bucket_key: str, threshold: datetime) -> int:
        """Count attempts for the given action/key inside the active window."""
        ...

    @abstractmethod
    async def delete_older_than(self, threshold: datetime) -> int:
        """Drop stale attempts to keep the table bounded."""
        ...
