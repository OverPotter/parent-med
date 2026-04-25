from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from contextlib import AbstractAsyncContextManager
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from src.application.security.auth_rate_limit import (
    AuthAttemptThrottle,
    build_auth_attempt_bucket_keys,
)
from src.domain.entities.auth_attempt import AuthAttempt
from src.infrastructure.database.repositories.auth_attempt_repository import (
    SqlAuthAttemptRepository,
)


class _SessionContext(AbstractAsyncContextManager):
    def __init__(self, session: AsyncMock) -> None:
        self._session = session

    async def __aenter__(self) -> AsyncMock:
        return self._session

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None


class _RepositoryContext(AbstractAsyncContextManager):
    def __init__(self, repo: "StubAuthAttemptRepository") -> None:
        self._repo = repo

    async def __aenter__(self) -> "StubAuthAttemptRepository":
        return self._repo

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None


class StubAuthAttemptRepository:
    def __init__(self) -> None:
        self.attempts: list[AuthAttempt] = []
        self.prune_calls = 0

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.attempts if item.id == id), None)

    async def add(self, entity: AuthAttempt) -> AuthAttempt:
        self.attempts.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        before = len(self.attempts)
        self.attempts = [item for item in self.attempts if item.id != id]
        return len(self.attempts) != before

    def locked(self, keys: list[str]) -> AbstractAsyncContextManager["StubAuthAttemptRepository"]:
        return _RepositoryContext(self)

    async def count_since(self, action: str, bucket_key: str, threshold: datetime) -> int:
        return sum(
            1
            for item in self.attempts
            if item.action == action
            and item.bucket_key == bucket_key
            and item.created_at > threshold
        )

    async def delete_older_than(self, threshold: datetime) -> int:
        self.prune_calls += 1
        before = len(self.attempts)
        self.attempts = [item for item in self.attempts if item.created_at > threshold]
        return before - len(self.attempts)


@pytest.mark.asyncio
async def test_sql_auth_attempt_repository_commits_writes_independently() -> None:
    session = Mock()
    session.add = Mock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session_factory = Mock(return_value=_SessionContext(session))
    repo = SqlAuthAttemptRepository(session_factory)

    await repo.add(
        AuthAttempt(
            id=uuid4(),
            action="signin",
            bucket_key="id:test@example.com",
            created_at=datetime.now(UTC),
        )
    )

    session.add.assert_called_once()
    session.flush.assert_awaited()
    session.refresh.assert_awaited()
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_sql_auth_attempt_repository_does_not_commit_reads() -> None:
    session = Mock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    execute_result = Mock()
    execute_result.scalar.return_value = 2
    session.execute.return_value = execute_result
    session_factory = Mock(return_value=_SessionContext(session))
    repo = SqlAuthAttemptRepository(session_factory)

    count = await repo.count_since("signin", "id:test@example.com", datetime.now(UTC))

    assert count == 2
    session.commit.assert_not_called()


@pytest.mark.asyncio
async def test_auth_attempt_throttle_prunes_once_within_interval() -> None:
    repo = StubAuthAttemptRepository()
    throttle = AuthAttemptThrottle(repo)
    AuthAttemptThrottle._last_pruned_at = None

    await throttle.assert_allowed("signin", "127.0.0.1", "test@example.com")
    await throttle.assert_allowed("signin", "127.0.0.1", "test@example.com")

    assert repo.prune_calls == 1


def test_build_auth_attempt_bucket_keys_normalizes_ip_and_email() -> None:
    assert build_auth_attempt_bucket_keys(" 127.0.0.1 ", " Test@Example.com ") == [
        "ip:127.0.0.1",
        "id:test@example.com",
    ]
