"""Сервис записей роста."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.height_entry import HeightEntryCreateDto, HeightEntryResponseDto
from src.application.services.child_plan_access import ensure_child_plan_mutation_allowed
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.child import Child
from src.domain.entities.height_entry import HeightEntry
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.height_entry_repository import HeightEntryRepository


class HeightEntryService:
    """Сервис записей роста ребёнка."""

    def __init__(
        self,
        height_repo: HeightEntryRepository,
        child_repo: ChildRepository,
        family_repo: FamilyRepository | None = None,
    ) -> None:
        self._repo = height_repo
        self._child_repo = child_repo
        self._family_repo = family_repo

    def _to_response(self, entity: HeightEntry) -> HeightEntryResponseDto:
        return HeightEntryResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            value_cm=entity.value_cm,
            measured_at=entity.measured_at,
        )

    async def _require_child_access(self, child_id: UUID, current_family_id: UUID) -> Child:
        child = await self._child_repo.get_by_id(child_id)
        if not child:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if child.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return child

    async def _get_entry_for_account(self, id: UUID, current_family_id: UUID) -> HeightEntry:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись роста не найдена", resource="height_entry")
        await self._require_child_access(entity.child_id, current_family_id)
        return entity

    async def get_by_child_id(
        self,
        child_id: UUID,
        current_family_id: UUID,
    ) -> list[HeightEntryResponseDto]:
        await self._require_child_access(child_id, current_family_id)
        entities = await self._repo.get_by_child_id(child_id)
        return [self._to_response(e) for e in entities]

    async def get_latest_for_child(
        self,
        child_id: UUID,
        current_family_id: UUID,
    ) -> HeightEntryResponseDto | None:
        await self._require_child_access(child_id, current_family_id)
        entity = await self._repo.get_latest_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def create(
        self,
        dto: HeightEntryCreateDto,
        current_family_id: UUID,
    ) -> HeightEntryResponseDto:
        await self._require_child_access(dto.child_id, current_family_id)
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_family_id,
            dto.child_id,
        )
        measured_at = dto.measured_at or datetime.now(UTC)
        entity = HeightEntry(
            id=uuid4(),
            child_id=dto.child_id,
            value_cm=dto.value_cm,
            measured_at=measured_at,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID, current_family_id: UUID) -> None:
        entity = await self._get_entry_for_account(id, current_family_id)
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_family_id,
            entity.child_id,
        )
        await self._repo.delete(id)
