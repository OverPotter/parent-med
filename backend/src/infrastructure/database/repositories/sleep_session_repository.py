"""Реализация репозитория сессий сна."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.sleep_session import SleepSession
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.infrastructure.database.models.sleep_session import SleepSessionModel


class SqlSleepSessionRepository(SleepSessionRepository):
    """Репозиторий сна ребёнка на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: SleepSessionModel) -> SleepSession:
        return SleepSession(
            id=m.id,
            child_id=m.child_id,
            started_at=m.started_at,
            ended_at=m.ended_at,
            status=m.status,
            created_by_account_id=m.created_by_account_id,
        )

    def _to_model(self, e: SleepSession) -> SleepSessionModel:
        return SleepSessionModel(
            id=e.id,
            child_id=e.child_id,
            started_at=e.started_at,
            ended_at=e.ended_at,
            status=e.status,
            created_by_account_id=e.created_by_account_id,
        )

    async def get_by_id(self, id: UUID) -> SleepSession | None:
        result = await self._session.execute(
            select(SleepSessionModel).where(SleepSessionModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_child_id(self, child_id: UUID) -> list[SleepSession]:
        result = await self._session.execute(
            select(SleepSessionModel)
            .where(SleepSessionModel.child_id == child_id)
            .order_by(SleepSessionModel.started_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_active_by_child_id(self, child_id: UUID) -> SleepSession | None:
        result = await self._session.execute(
            select(SleepSessionModel)
            .where(
                SleepSessionModel.child_id == child_id,
                SleepSessionModel.status == "active",
            )
            .order_by(SleepSessionModel.started_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: SleepSession) -> SleepSession:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: SleepSession) -> SleepSession:
        result = await self._session.execute(
            select(SleepSessionModel).where(SleepSessionModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"SleepSession {entity.id} not found")
        row.started_at = entity.started_at
        row.ended_at = entity.ended_at
        row.status = entity.status
        row.created_by_account_id = entity.created_by_account_id
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(SleepSessionModel).where(SleepSessionModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
