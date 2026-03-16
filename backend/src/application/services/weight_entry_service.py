"""Сервис записей веса."""

from datetime import datetime
from uuid import UUID, uuid4

from src.application.dto.weight_entry import WeightEntryCreateDto, WeightEntryResponseDto
from src.core.exceptions import NotFoundError
from src.domain.entities.weight_entry import WeightEntry
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository


class WeightEntryService:
    """Сервис записей веса ребёнка."""

    def __init__(
        self,
        weight_repo: WeightEntryRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = weight_repo
        self._child_repo = child_repo

    def _to_response(self, entity: WeightEntry) -> WeightEntryResponseDto:
        return WeightEntryResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            value_kg=entity.value_kg,
            measured_at=entity.measured_at,
        )

    async def get_by_id(self, id: UUID) -> WeightEntryResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись веса не найдена", resource="weight_entry")
        return self._to_response(entity)

    async def get_by_child_id(self, child_id: UUID) -> list[WeightEntryResponseDto]:
        if await self._child_repo.get_by_id(child_id) is None:
            raise NotFoundError("Ребёнок не найден", resource="child")
        entities = await self._repo.get_by_child_id(child_id)
        return [self._to_response(e) for e in entities]

    async def get_latest_for_child(self, child_id: UUID) -> WeightEntryResponseDto | None:
        entity = await self._repo.get_latest_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def create(self, dto: WeightEntryCreateDto) -> WeightEntryResponseDto:
        if await self._child_repo.get_by_id(dto.child_id) is None:
            raise NotFoundError("Ребёнок не найден", resource="child")
        measured_at = dto.measured_at or datetime.now(datetime.UTC)
        entity = WeightEntry(
            id=uuid4(),
            child_id=dto.child_id,
            value_kg=dto.value_kg,
            measured_at=measured_at,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Запись веса не найдена", resource="weight_entry")
        await self._repo.delete(id)
