"""Реализация репозитория записей температуры."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository
from src.infrastructure.database.models.temperature_entry import TemperatureEntryModel


class SqlTemperatureEntryRepository(TemperatureEntryRepository):
    """Репозиторий записей температуры на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: TemperatureEntryModel) -> TemperatureEntry:
        return TemperatureEntry(
            id=m.id,
            episode_id=m.episode_id,
            value_celsius=m.value_celsius,
            measured_at=m.measured_at,
            method=m.method,
            comment=m.comment,
        )

    def _to_model(self, e: TemperatureEntry) -> TemperatureEntryModel:
        return TemperatureEntryModel(
            id=e.id,
            episode_id=e.episode_id,
            value_celsius=e.value_celsius,
            measured_at=e.measured_at,
            method=e.method,
            comment=e.comment,
        )

    async def get_by_id(self, id: UUID) -> TemperatureEntry | None:
        result = await self._session.execute(
            select(TemperatureEntryModel).where(TemperatureEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[TemperatureEntry]:
        result = await self._session.execute(
            select(TemperatureEntryModel)
            .where(TemperatureEntryModel.episode_id == episode_id)
            .order_by(TemperatureEntryModel.measured_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def add(self, entity: TemperatureEntry) -> TemperatureEntry:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(TemperatureEntryModel).where(TemperatureEntryModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
