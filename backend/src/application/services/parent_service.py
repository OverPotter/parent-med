"""Сервис родителей."""

from uuid import UUID, uuid4

from src.application.dto.parent import ParentCreateDto, ParentResponseDto, ParentUpdateDto
from src.core.exceptions import NotFoundError
from src.domain.entities.parent import Parent
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.parent_repository import ParentRepository


class ParentService:
    """Сервис CRUD для родителей внутри семьи."""

    def __init__(
        self,
        parent_repo: ParentRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._repo = parent_repo
        self._family_repo = family_repo

    def _to_response(self, entity: Parent) -> ParentResponseDto:
        return ParentResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            name=entity.name,
            role=entity.role,
        )

    async def get_by_id(self, id: UUID) -> ParentResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Родитель не найден", resource="parent")
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[ParentResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        return [self._to_response(entity) for entity in entities]

    async def create(self, dto: ParentCreateDto) -> ParentResponseDto:
        if await self._family_repo.get_by_id(dto.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entity = Parent(
            id=uuid4(),
            family_id=dto.family_id,
            name=dto.name,
            role=dto.role,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(self, id: UUID, dto: ParentUpdateDto) -> ParentResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Родитель не найден", resource="parent")
        updated = Parent(
            id=entity.id,
            family_id=entity.family_id,
            name=dto.name if dto.name is not None else entity.name,
            role=dto.role if dto.role is not None else entity.role,
        )
        saved = await self._repo.update(updated)
        return self._to_response(saved)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Родитель не найден", resource="parent")
        await self._repo.delete(id)
