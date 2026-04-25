"""SQLAlchemy repository for persisted auth throttling attempts."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.domain.entities.auth_attempt import AuthAttempt
from src.domain.repositories.auth_attempt_repository import AuthAttemptRepository
from src.infrastructure.database.models.auth_attempt import AuthAttemptModel


class SqlAuthAttemptRepository(AuthAttemptRepository):
    def __init__(
        self,
        session_factory: async_sessionmaker[AsyncSession],
        session: AsyncSession | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._session = session

    def _to_entity(self, model: AuthAttemptModel) -> AuthAttempt:
        return AuthAttempt(
            id=model.id,
            action=model.action,
            bucket_key=model.bucket_key,
            created_at=model.created_at,
        )

    def _to_model(self, entity: AuthAttempt) -> AuthAttemptModel:
        return AuthAttemptModel(
            id=entity.id,
            action=entity.action,
            bucket_key=entity.bucket_key,
            created_at=entity.created_at,
        )

    @asynccontextmanager
    async def _session_scope(self, *, write: bool) -> AsyncIterator[AsyncSession]:
        if self._session is not None:
            yield self._session
            return
        async with self._session_factory() as session:
            try:
                yield session
                if write:
                    await session.commit()
            except Exception:
                await session.rollback()
                raise

    @asynccontextmanager
    async def locked(self, keys: list[str]) -> AsyncIterator[AuthAttemptRepository]:
        unique_keys = sorted({key for key in keys if key})
        async with self._session_factory() as session:
            async with session.begin():
                for key in unique_keys:
                    await session.execute(
                        text("SELECT pg_advisory_xact_lock(hashtext(:key))"),
                        {"key": key},
                    )
                yield SqlAuthAttemptRepository(self._session_factory, session=session)

    async def get_by_id(self, id: UUID) -> AuthAttempt | None:
        async with self._session_scope(write=False) as session:
            result = await session.execute(
                select(AuthAttemptModel).where(AuthAttemptModel.id == id)
            )
            row = result.scalars().one_or_none()
            return self._to_entity(row) if row else None

    async def add(self, entity: AuthAttempt) -> AuthAttempt:
        model = self._to_model(entity)
        async with self._session_scope(write=True) as session:
            session.add(model)
            await session.flush()
            await session.refresh(model)
            return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        async with self._session_scope(write=True) as session:
            result = await session.execute(
                select(AuthAttemptModel).where(AuthAttemptModel.id == id)
            )
            row = result.scalars().one_or_none()
            if row is None:
                return False
            await session.delete(row)
            await session.flush()
            return True

    async def count_since(self, action: str, bucket_key: str, threshold: datetime) -> int:
        async with self._session_scope(write=False) as session:
            result = await session.execute(
                select(func.count())
                .select_from(AuthAttemptModel)
                .where(
                    AuthAttemptModel.action == action,
                    AuthAttemptModel.bucket_key == bucket_key,
                    AuthAttemptModel.created_at > threshold,
                )
            )
            return int(result.scalar() or 0)

    async def delete_older_than(self, threshold: datetime) -> int:
        async with self._session_scope(write=True) as session:
            result = await session.execute(
                delete(AuthAttemptModel).where(AuthAttemptModel.created_at <= threshold)
            )
            await session.flush()
            return result.rowcount or 0
