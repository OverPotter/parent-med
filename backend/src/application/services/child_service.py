"""Сервис детей."""

from uuid import UUID, uuid4

from src.application.dto.child import ChildCreateDto, ChildResponseDto, ChildUpdateDto
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.child import Child
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository


class ChildService:
    """Сервис CRUD для детей."""

    def __init__(
        self,
        child_repo: ChildRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._repo = child_repo
        self._family_repo = family_repo

    def _to_response(self, entity: Child) -> ChildResponseDto:
        return ChildResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            name=entity.name,
            birth_date=entity.birth_date,
        )

    async def get_by_id(self, id: UUID) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        return self._to_response(entity)

    async def get_by_id_for_account(self, id: UUID, current_family_id: UUID) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[ChildResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        return [self._to_response(e) for e in entities]

    async def get_by_family_id_for_account(
        self,
        family_id: UUID,
        current_family_id: UUID,
    ) -> list[ChildResponseDto]:
        if family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.get_by_family_id(family_id)

    async def create(self, dto: ChildCreateDto) -> ChildResponseDto:
        if await self._family_repo.get_by_id(dto.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entity = Child(
            id=uuid4(),
            family_id=dto.family_id,
            name=dto.name,
            birth_date=dto.birth_date,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def create_for_account(
        self,
        dto: ChildCreateDto,
        current_family_id: UUID,
    ) -> ChildResponseDto:
        if dto.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.create(dto)

    async def update(self, id: UUID, dto: ChildUpdateDto) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        name = dto.name if dto.name is not None else entity.name
        birth_date = dto.birth_date if dto.birth_date is not None else entity.birth_date
        entity = Child(id=entity.id, family_id=entity.family_id, name=name, birth_date=birth_date)
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def update_for_account(
        self,
        id: UUID,
        dto: ChildUpdateDto,
        current_family_id: UUID,
    ) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        await self._repo.delete(id)

    async def delete_for_account(self, id: UUID, current_family_id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        await self._repo.delete(id)
