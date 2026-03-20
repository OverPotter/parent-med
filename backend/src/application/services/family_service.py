"""Сервис семей."""

from uuid import UUID, uuid4

from src.application.dto.auth import AccountResponseDto
from src.application.dto.family import (
    FamilyCreateDto,
    FamilyMemberUpdateDto,
    FamilyResponseDto,
    FamilyUpdateDto,
)
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.family import Family
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.family_repository import FamilyRepository


class FamilyService:
    """Сервис CRUD для семей."""

    def __init__(
        self,
        family_repo: FamilyRepository,
        account_repo: AccountRepository,
        session_repo: AccountSessionRepository,
    ) -> None:
        self._repo = family_repo
        self._account_repo = account_repo
        self._session_repo = session_repo

    def _to_response(self, entity: Family) -> FamilyResponseDto:
        return FamilyResponseDto(id=entity.id, name=entity.name)

    def _to_member_response(self, entity: Account) -> AccountResponseDto:
        return AccountResponseDto(
            id=entity.id,
            email=entity.email,
            family_id=entity.family_id,
            display_name=entity.display_name,
            family_role=entity.family_role,
        )

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

    async def list_members_for_account(self, current_family_id: UUID) -> list[AccountResponseDto]:
        accounts = await self._account_repo.list_by_family_id(current_family_id)
        accounts = sorted(
            accounts,
            key=lambda account: (
                0 if account.family_role == "owner" else 1,
                account.created_at,
            ),
        )
        return [self._to_member_response(account) for account in accounts]

    async def update_member_for_account(
        self,
        member_account_id: UUID,
        dto: FamilyMemberUpdateDto,
        current_account_id: UUID,
        current_family_id: UUID,
        current_family_role: str,
    ) -> AccountResponseDto:
        if current_family_role != "owner":
            raise ForbiddenError("Только владелец семьи может управлять участниками")
        if dto.family_role not in {"owner", "adult"}:
            raise ValidationError("Можно установить только роли owner или adult")

        target = await self._account_repo.get_by_id(member_account_id)
        if not target or target.family_id != current_family_id:
            raise NotFoundError("Участник семьи не найден", resource="account")

        family_accounts = await self._account_repo.list_by_family_id(current_family_id)
        owner_count = sum(1 for account in family_accounts if account.family_role == "owner")
        if target.family_role == "owner" and dto.family_role != "owner" and owner_count <= 1:
            raise ValidationError(
                "В семье должен остаться хотя бы один владелец",
                code="LAST_OWNER_REQUIRED",
            )

        updated = await self._account_repo.update(
            Account(
                id=target.id,
                email=target.email,
                password_hash=target.password_hash,
                family_id=target.family_id,
                display_name=target.display_name,
                family_role=dto.family_role,
                push_before_reminder_minutes=target.push_before_reminder_minutes,
                cabinet_notify_10_days=target.cabinet_notify_10_days,
                cabinet_notify_7_days=target.cabinet_notify_7_days,
                cabinet_notify_3_days=target.cabinet_notify_3_days,
                cabinet_notify_1_day=target.cabinet_notify_1_day,
                created_at=target.created_at,
            )
        )
        return self._to_member_response(updated)

    async def delete_member_for_account(
        self,
        member_account_id: UUID,
        current_account_id: UUID,
        current_family_id: UUID,
        current_family_role: str,
    ) -> None:
        if current_family_role != "owner":
            raise ForbiddenError("Только владелец семьи может управлять участниками")
        if member_account_id == current_account_id:
            raise ValidationError(
                "Нельзя удалить свой аккаунт через управление участниками",
                code="SELF_MEMBER_DELETE_FORBIDDEN",
            )

        target = await self._account_repo.get_by_id(member_account_id)
        if not target or target.family_id != current_family_id:
            raise NotFoundError("Участник семьи не найден", resource="account")

        family_accounts = await self._account_repo.list_by_family_id(current_family_id)
        owner_count = sum(1 for account in family_accounts if account.family_role == "owner")
        if target.family_role == "owner" and owner_count <= 1:
            raise ValidationError(
                "Нельзя удалить последнего владельца семьи",
                code="LAST_OWNER_REQUIRED",
            )

        await self._session_repo.delete_by_account_id(target.id)
        await self._account_repo.delete(target.id)

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
