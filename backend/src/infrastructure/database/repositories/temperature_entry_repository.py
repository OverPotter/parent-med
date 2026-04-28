"""Реализация репозитория записей температуры."""

from collections import defaultdict
from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository
from src.infrastructure.database.models.illness_episode_event import IllnessEpisodeEventModel


class SqlTemperatureEntryRepository(TemperatureEntryRepository):
    """Репозиторий записей температуры на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: IllnessEpisodeEventModel) -> TemperatureEntry:
        return TemperatureEntry(
            id=m.id,
            episode_id=m.episode_id,
            value_celsius=m.value_celsius or 0,
            measured_at=m.occurred_at,
            method=m.method,
            comment=m.comment,
            created_by_account_id=m.created_by_account_id,
            created_by_name_snapshot=m.created_by_name_snapshot,
        )

    def _to_model(self, e: TemperatureEntry) -> IllnessEpisodeEventModel:
        return IllnessEpisodeEventModel(
            id=e.id,
            episode_id=e.episode_id,
            event_type="temperature",
            occurred_at=e.measured_at,
            value_celsius=e.value_celsius,
            method=e.method,
            comment=e.comment,
            created_by_account_id=e.created_by_account_id,
            created_by_name_snapshot=e.created_by_name_snapshot,
        )

    async def get_by_id(self, id: UUID) -> TemperatureEntry | None:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "temperature",
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[TemperatureEntry]:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel)
            .where(
                IllnessEpisodeEventModel.episode_id == episode_id,
                IllnessEpisodeEventModel.event_type == "temperature",
            )
            .order_by(IllnessEpisodeEventModel.occurred_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def get_by_episode_ids(
        self, episode_ids: Sequence[UUID]
    ) -> dict[UUID, list[TemperatureEntry]]:
        if not episode_ids:
            return {}
        result = await self._session.execute(
            select(IllnessEpisodeEventModel)
            .where(
                IllnessEpisodeEventModel.episode_id.in_(episode_ids),
                IllnessEpisodeEventModel.event_type == "temperature",
            )
            .order_by(
                IllnessEpisodeEventModel.episode_id,
                IllnessEpisodeEventModel.occurred_at.desc(),
            )
        )
        grouped: dict[UUID, list[TemperatureEntry]] = defaultdict(list)
        for row in result.scalars().all():
            grouped[row.episode_id].append(self._to_entity(row))
        return dict(grouped)

    async def add(self, entity: TemperatureEntry) -> TemperatureEntry:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "temperature",
            )
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
