"""Сервис семей."""

from uuid import UUID, uuid4

from src.application.dto.family import FamilyCreateDto, FamilyResponseDto, FamilyUpdateDto
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.family import Family
from src.domain.repositories.family_repository import FamilyRepository


class FamilyService:
    """Сервис CRUD для семей."""

    def __init__(self, family_repo: FamilyRepository) -> None:
        self._repo = family_repo

    def _to_response(self, entity: Family) -> FamilyResponseDto:
        return FamilyResponseDto(id=entity.id, name=entity.name)

    async def list_all(self) -> list[FamilyResponseDto]:
        entities = await self._repo.list_all()
        return [self._to_response(entity) for entity in entities]

    async def get_by_id(self, id: UUID) -> FamilyResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        return self._to_response(entity)

    async def create(self, dto: FamilyCreateDto) -> FamilyResponseDto:
        entity = Family(id=uuid4(), name=dto.name)
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def get_by_id_for_account(self, id: UUID, current_family_id: UUID) -> FamilyResponseDto:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.get_by_id(id)

    async def update(self, id: UUID, dto: FamilyUpdateDto) -> FamilyResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        if dto.name is not None:
            entity = Family(id=entity.id, name=dto.name)
            updated = await self._repo.update(entity)
        else:
            updated = entity
        return self._to_response(updated)

    async def update_for_account(
        self,
        id: UUID,
        dto: FamilyUpdateDto,
        current_family_id: UUID,
    ) -> FamilyResponseDto:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        await self._repo.delete(id)

    async def delete_for_account(self, id: UUID, current_family_id: UUID) -> None:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        await self.delete(id)
