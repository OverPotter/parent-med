"""Совместимый сервис legacy-родителей."""

from uuid import UUID

from src.application.dto.parent import ParentCreateDto, ParentResponseDto, ParentUpdateDto
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.account_identity import resolve_display_name
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.family_repository import FamilyRepository


class ParentService:
    """Совместимый слой для старого /parents API поверх аккаунтов семьи."""

    def __init__(
        self,
        account_repo: AccountRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._account_repo = account_repo
        self._family_repo = family_repo

    def _to_response(self, entity: Account) -> ParentResponseDto:
        return ParentResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            name=resolve_display_name(entity.display_name),
            role=entity.family_role,
        )

    async def get_by_id(self, id: UUID) -> ParentResponseDto:
        entity = await self._account_repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Родитель не найден", resource="parent")
        return self._to_response(entity)

    async def get_by_id_for_account(self, id: UUID, current_family_id: UUID) -> ParentResponseDto:
        entity = await self._account_repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Родитель не найден", resource="parent")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[ParentResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._account_repo.list_by_family_id(family_id)
        return [self._to_response(entity) for entity in entities]

    async def get_by_family_id_for_account(
        self,
        family_id: UUID,
        current_family_id: UUID,
    ) -> list[ParentResponseDto]:
        if family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.get_by_family_id(family_id)

    async def create(self, dto: ParentCreateDto) -> ParentResponseDto:
        raise ValidationError(
            "Legacy /parents API больше не используется. "
            "Создавайте участников через приглашения в семью.",
            code="PARENTS_API_DEPRECATED",
            status_code=409,
        )

    async def create_for_account(
        self,
        dto: ParentCreateDto,
        current_family_id: UUID,
    ) -> ParentResponseDto:
        return await self.create(dto)

    async def update(self, id: UUID, dto: ParentUpdateDto) -> ParentResponseDto:
        raise ValidationError(
            "Legacy /parents API больше не используется. "
            "Обновляйте семейные аккаунты через /families/me/members.",
            code="PARENTS_API_DEPRECATED",
            status_code=409,
        )

    async def update_for_account(
        self,
        id: UUID,
        dto: ParentUpdateDto,
        current_family_id: UUID,
    ) -> ParentResponseDto:
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        raise ValidationError(
            "Legacy /parents API больше не используется. "
            "Удаляйте участников через /families/me/members.",
            code="PARENTS_API_DEPRECATED",
            status_code=409,
        )

    async def delete_for_account(self, id: UUID, current_family_id: UUID) -> None:
        await self.delete(id)
