"""Реализация репозитория записей роста."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.height_entry import HeightEntry
from src.domain.repositories.height_entry_repository import HeightEntryRepository
from src.infrastructure.database.models.height_entry import HeightEntryModel


class SqlHeightEntryRepository(HeightEntryRepository):
    """Репозиторий записей роста на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: HeightEntryModel) -> HeightEntry:
        return HeightEntry(
            id=m.id,
            child_id=m.child_id,
            value_cm=m.value_cm,
            measured_at=m.measured_at,
        )

    def _to_model(self, e: HeightEntry) -> HeightEntryModel:
        return HeightEntryModel(
            id=e.id,
            child_id=e.child_id,
            value_cm=e.value_cm,
            measured_at=e.measured_at,
        )

    async def get_by_id(self, id: UUID) -> HeightEntry | None:
        result = await self._session.execute(
            select(HeightEntryModel).where(HeightEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_latest_by_child_id(self, child_id: UUID) -> HeightEntry | None:
        result = await self._session.execute(
            select(HeightEntryModel)
            .where(HeightEntryModel.child_id == child_id)
            .order_by(HeightEntryModel.measured_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_child_id(self, child_id: UUID) -> list[HeightEntry]:
        result = await self._session.execute(
            select(HeightEntryModel)
            .where(HeightEntryModel.child_id == child_id)
            .order_by(HeightEntryModel.measured_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: HeightEntry) -> HeightEntry:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(HeightEntryModel).where(HeightEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
