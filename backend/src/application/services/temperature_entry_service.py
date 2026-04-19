"""Сервис записей температуры."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.temperature_entry import (
    TemperatureEntryCreateDto,
    TemperatureEntryResponseDto,
)
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.child import Child
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository


class TemperatureEntryService:
    """Сервис журнала температуры в эпизоде болезни."""

    def __init__(
        self,
        temperature_repo: TemperatureEntryRepository,
        episode_repo: IllnessEpisodeRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = temperature_repo
        self._episode_repo = episode_repo
        self._child_repo = child_repo

    def _to_response(self, entity: TemperatureEntry) -> TemperatureEntryResponseDto:
        return TemperatureEntryResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            value_celsius=entity.value_celsius,
            measured_at=entity.measured_at,
            method=entity.method,
            comment=entity.comment,
            created_by_account_id=entity.created_by_account_id,
            created_by_name_snapshot=entity.created_by_name_snapshot,
        )

    async def _require_child_access(self, child_id: UUID, current_family_id: UUID) -> Child:
        child = await self._child_repo.get_by_id(child_id)
        if not child:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if child.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return child

    async def _get_episode_for_account(
        self,
        episode_id: UUID,
        current_family_id: UUID,
    ) -> IllnessEpisode:
        episode = await self._episode_repo.get_by_id(episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._require_child_access(episode.child_id, current_family_id)
        return episode

    async def _get_entry_for_account(
        self,
        id: UUID,
        current_family_id: UUID,
    ) -> TemperatureEntry:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись температуры не найдена", resource="temperature_entry")
        await self._get_episode_for_account(entity.episode_id, current_family_id)
        return entity

    async def get_by_id(self, id: UUID, current_family_id: UUID) -> TemperatureEntryResponseDto:
        return self._to_response(await self._get_entry_for_account(id, current_family_id))

    async def get_by_episode_id(
        self,
        episode_id: UUID,
        current_family_id: UUID,
    ) -> list[TemperatureEntryResponseDto]:
        await self._get_episode_for_account(episode_id, current_family_id)
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(e) for e in entities]

    async def create(
        self,
        dto: TemperatureEntryCreateDto,
        current_family_id: UUID,
        created_by_account_id: UUID,
        created_by_name_snapshot: str,
    ) -> TemperatureEntryResponseDto:
        await self._get_episode_for_account(dto.episode_id, current_family_id)
        measured_at = dto.measured_at or datetime.now(UTC)
        entity = TemperatureEntry(
            id=uuid4(),
            episode_id=dto.episode_id,
            value_celsius=dto.value_celsius,
            measured_at=measured_at,
            method=dto.method,
            comment=dto.comment,
            created_by_account_id=created_by_account_id,
            created_by_name_snapshot=created_by_name_snapshot.strip() or None,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID, current_family_id: UUID) -> None:
        await self._get_entry_for_account(id, current_family_id)
        await self._repo.delete(id)
