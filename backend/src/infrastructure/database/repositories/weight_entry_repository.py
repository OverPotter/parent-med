"""Реализация репозитория записей веса."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.weight_entry import WeightEntry
from src.domain.repositories.weight_entry_repository import WeightEntryRepository
from src.infrastructure.database.models.weight_entry import WeightEntryModel


class SqlWeightEntryRepository(WeightEntryRepository):
    """Репозиторий записей веса на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: WeightEntryModel) -> WeightEntry:
        return WeightEntry(
            id=m.id,
            child_id=m.child_id,
            value_kg=m.value_kg,
            measured_at=m.measured_at,
        )

    def _to_model(self, e: WeightEntry) -> WeightEntryModel:
        return WeightEntryModel(
            id=e.id,
            child_id=e.child_id,
            value_kg=e.value_kg,
            measured_at=e.measured_at,
        )

    async def get_by_id(self, id: UUID) -> WeightEntry | None:
        result = await self._session.execute(
            select(WeightEntryModel).where(WeightEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_latest_by_child_id(self, child_id: UUID) -> WeightEntry | None:
        result = await self._session.execute(
            select(WeightEntryModel)
            .where(WeightEntryModel.child_id == child_id)
            .order_by(WeightEntryModel.measured_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_child_id(self, child_id: UUID) -> list[WeightEntry]:
        result = await self._session.execute(
            select(WeightEntryModel)
            .where(WeightEntryModel.child_id == child_id)
            .order_by(WeightEntryModel.measured_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: WeightEntry) -> WeightEntry:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(WeightEntryModel).where(WeightEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
