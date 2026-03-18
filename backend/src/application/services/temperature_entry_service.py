"""Сервис записей температуры."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.temperature_entry import (
    TemperatureEntryCreateDto,
    TemperatureEntryResponseDto,
)
from src.core.exceptions import NotFoundError
from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository


class TemperatureEntryService:
    """Сервис журнала температуры в эпизоде болезни."""

    def __init__(
        self,
        temperature_repo: TemperatureEntryRepository,
        episode_repo: IllnessEpisodeRepository,
    ) -> None:
        self._repo = temperature_repo
        self._episode_repo = episode_repo

    def _to_response(self, entity: TemperatureEntry) -> TemperatureEntryResponseDto:
        return TemperatureEntryResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            value_celsius=entity.value_celsius,
            measured_at=entity.measured_at,
            method=entity.method,
            comment=entity.comment,
        )

    async def get_by_id(self, id: UUID) -> TemperatureEntryResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись температуры не найдена", resource="temperature_entry")
        return self._to_response(entity)

    async def get_by_episode_id(self, episode_id: UUID) -> list[TemperatureEntryResponseDto]:
        if await self._episode_repo.get_by_id(episode_id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(e) for e in entities]

    async def create(self, dto: TemperatureEntryCreateDto) -> TemperatureEntryResponseDto:
        if await self._episode_repo.get_by_id(dto.episode_id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        measured_at = dto.measured_at or datetime.now(UTC)
        entity = TemperatureEntry(
            id=uuid4(),
            episode_id=dto.episode_id,
            value_celsius=dto.value_celsius,
            measured_at=measured_at,
            method=dto.method,
            comment=dto.comment,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Запись температуры не найдена", resource="temperature_entry")
        await self._repo.delete(id)
