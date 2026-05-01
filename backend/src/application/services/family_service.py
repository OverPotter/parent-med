"""Сервис семей."""

from uuid import UUID, uuid4

from src.application.dto.auth import AccountResponseDto
from src.application.dto.family import (
    FamilyCreateDto,
    FamilyMemberProfileUpdateDto,
    FamilyMemberUpdateDto,
    FamilyResponseDto,
    FamilyUpdateDto,
)
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.application.services.subscription_policy import has_billing_ownership_context
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.account import Account, copy_account
from src.domain.entities.account_identity import (
    needs_profile_completion,
    normalize_optional_display_name,
    resolve_display_name,
)
from src.domain.entities.family import Family, build_personal_family
from src.domain.entities.family_access import (
    FamilyAccessPolicy,
    deserialize_family_access_policy,
    serialize_family_access_policy,
)
from src.domain.entities.family_roles import is_family_admin, normalize_family_role
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.family_repository import FamilyRepository


class FamilyService:
    """Сервис CRUD для семей."""

    PREMIUM_PLAN_CODES = {"plus", "pro"}
    ACTIVE_SUBSCRIPTION_STATUSES = {"trialing", "active", "grace"}

    def __init__(
        self,
        family_repo: FamilyRepository,
        account_repo: AccountRepository,
        session_repo: AccountSessionRepository,
    ) -> None:
        self._repo = family_repo
        self._account_repo = account_repo
        self._session_repo = session_repo

    def _is_premium_active(self, entity: Family) -> bool:
        return (
            entity.plan_code in self.PREMIUM_PLAN_CODES
            and entity.subscription_status in self.ACTIVE_SUBSCRIPTION_STATUSES
        )

    def _to_response(self, entity: Family) -> FamilyResponseDto:
        return FamilyResponseDto(
            id=entity.id,
            name=entity.name,
            cabinet_member_account_ids=list(entity.cabinet_member_account_ids),
            owner_account_id=entity.owner_account_id,
            billing_account_id=entity.billing_account_id,
            free_primary_child_id=entity.free_primary_child_id,
            free_primary_pillbox_plan_id=entity.free_primary_pillbox_plan_id,
            plan_code=entity.plan_code,  # type: ignore[arg-type]
            subscription_status=entity.subscription_status,  # type: ignore[arg-type]
            subscription_provider=entity.subscription_provider,
            subscription_product_id=entity.subscription_product_id,
            subscription_expires_at=entity.subscription_expires_at,
            premium_active=self._is_premium_active(entity),
        )

    def _to_access_policy_response(self, policy: FamilyAccessPolicy) -> FamilyAccessPolicyDto:
        return FamilyAccessPolicyDto.model_validate(serialize_family_access_policy(policy))

    async def _resolve_cabinet_member_account_ids(
        self,
        current_family_id: UUID,
        requested_member_ids: list[UUID] | None,
    ) -> list[UUID]:
        if requested_member_ids is None:
            return []
        family_accounts = await self._account_repo.list_by_family_id(current_family_id)
        family_account_ids = {
            account.id for account in family_accounts if account.family_role != "deleted"
        }
        normalized_ids = list(dict.fromkeys(requested_member_ids))
        invalid_ids = [
            account_id for account_id in normalized_ids if account_id not in family_account_ids
        ]
        if invalid_ids:
            raise ForbiddenError("Нельзя выбрать получателей из другой семьи")
        eligible_account_ids = {
            account.id
            for account in family_accounts
            if account.family_role != "deleted"
            and getattr(account.access_policy, "cabinet_access", "none") != "none"
        }
        ineligible_ids = [
            account_id for account_id in normalized_ids if account_id not in eligible_account_ids
        ]
        if ineligible_ids:
            raise ForbiddenError("Нельзя выбрать получателей без доступа к аптечке")
        return normalized_ids

    def _to_member_response(self, entity: Account) -> AccountResponseDto:
        return AccountResponseDto(
            id=entity.id,
            email=entity.email,
            family_id=entity.family_id,
            display_name=resolve_display_name(entity.display_name),
            needs_profile_completion=needs_profile_completion(entity.display_name),
            relationship_label=entity.relationship_label,
            phone=entity.phone,
            preferred_language=entity.preferred_language,
            family_role=normalize_family_role(entity.family_role),
            access_policy=self._to_access_policy_response(entity.access_policy),
        )

    def _ensure_family_admin(self, current_family_role: str) -> None:
        if not is_family_admin(current_family_role):
            raise ForbiddenError("Только администратор семьи может управлять участниками")

    def _count_admins(self, family_accounts: list[Account]) -> int:
        return sum(1 for account in family_accounts if is_family_admin(account.family_role))

    def _is_family_owner(self, family: Family | None, account_id: UUID) -> bool:
        return bool(family and family.owner_account_id == account_id)

    def _ensure_family_owner(self, family: Family | None, account_id: UUID) -> None:
        if not self._is_family_owner(family, account_id):
            raise ForbiddenError("Только владелец семьи может выполнять это действие")

    def _ensure_can_manage_target_member(
        self,
        family: Family | None,
        current_account_id: UUID,
        current_family_role: str,
        target: Account,
    ) -> None:
        if self._is_family_owner(family, current_account_id):
            return
        self._ensure_family_admin(current_family_role)
        if target.id == current_account_id:
            raise ValidationError(
                "Администратор не может менять свои семейные права",
                code="ADMIN_SELF_MEMBER_MANAGEMENT_FORBIDDEN",
            )
        if is_family_admin(target.family_role):
            raise ForbiddenError("Администратор может управлять только участниками member")

    def _merge_access_policy(
        self,
        current_policy: FamilyAccessPolicy,
        update_dto,
    ) -> FamilyAccessPolicy:
        if update_dto is None:
            return current_policy
        data = serialize_family_access_policy(current_policy)
        for field_name in update_dto.model_fields_set:
            data[field_name] = getattr(update_dto, field_name)
        merged = deserialize_family_access_policy(data)
        if merged.children_access not in {"view", "act", "edit"}:
            raise ValidationError("Права на детей могут быть только view, act или edit")
        if merged.cabinet_access not in {"none", "view", "edit"}:
            raise ValidationError("Права на аптечку могут быть только none, view или edit")
        if merged.pillbox_access not in {"none", "view", "act", "edit"}:
            raise ValidationError("Права на приёмы могут быть только none, view, act или edit")
        if merged.children_access != "edit" and merged.pillbox_access == "edit":
            raise ValidationError(
                "Полный доступ к приёмам требует права на изменение детей",
                code="PILLBOX_EDIT_REQUIRES_CHILD_EDIT_ACCESS",
            )
        if merged.all_children:
            merged.child_ids = []
        if merged.cabinet_access == "none":
            merged.cabinet_push_enabled = False
        return merged

    async def _create_solo_family_for_member(self, account: Account) -> Family:
        return await self._repo.add(build_personal_family(account.id))

    async def list_all(self) -> list[FamilyResponseDto]:
        entities = await self._repo.list_all()
        return [self._to_response(entity) for entity in entities]

    async def get_by_id(self, id: UUID) -> FamilyResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        return self._to_response(entity)

    async def create(self, dto: FamilyCreateDto) -> FamilyResponseDto:
        entity = Family(id=uuid4(), name=dto.name, cabinet_member_account_ids=[])
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def get_by_id_for_account(self, id: UUID, current_family_id: UUID) -> FamilyResponseDto:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.get_by_id(id)

    async def list_members_for_account(self, current_family_id: UUID) -> list[AccountResponseDto]:
        accounts = await self._account_repo.list_by_family_id(current_family_id)
        accounts = [account for account in accounts if account.family_role != "deleted"]
        accounts = sorted(
            accounts,
            key=lambda account: (
                0 if is_family_admin(account.family_role) else 1,
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
        target = await self._account_repo.get_by_id(member_account_id)
        if not target or target.family_id != current_family_id or target.family_role == "deleted":
            raise NotFoundError("Участник семьи не найден", resource="account")

        family = await self._repo.get_by_id(current_family_id)
        self._ensure_can_manage_target_member(
            family,
            current_account_id=current_account_id,
            current_family_role=current_family_role,
            target=target,
        )
        next_role = (
            normalize_family_role(dto.family_role)
            if dto.family_role is not None
            else normalize_family_role(target.family_role)
        )
        if next_role not in {"admin", "member"}:
            raise ValidationError("Можно установить только роли admin или member")
        if family and family.owner_account_id == target.id and next_role != "admin":
            raise ValidationError(
                "Владелец семьи должен сохранять права администратора",
                code="FAMILY_OWNER_MUST_REMAIN_ADMIN",
            )
        current_is_owner = self._is_family_owner(family, current_account_id)
        if dto.family_role is not None and not current_is_owner:
            raise ForbiddenError("Только владелец семьи может менять семейные роли")
        if dto.family_role is None:
            next_role = normalize_family_role(target.family_role)

        updated = await self._account_repo.update(
            copy_account(
                target,
                family_role=next_role,
                access_policy=self._merge_access_policy(target.access_policy, dto.access_policy),
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
        target = await self._account_repo.get_by_id(member_account_id)
        if not target or target.family_id != current_family_id or target.family_role == "deleted":
            raise NotFoundError("Участник семьи не найден", resource="account")

        if member_account_id == current_account_id:
            raise ValidationError(
                "Нельзя удалить свой аккаунт через управление участниками",
                code="SELF_MEMBER_DELETE_FORBIDDEN",
            )
        family = await self._repo.get_by_id(current_family_id)
        self._ensure_can_manage_target_member(
            family,
            current_account_id=current_account_id,
            current_family_role=current_family_role,
            target=target,
        )
        if family and family.owner_account_id == target.id:
            raise ValidationError(
                "Нельзя удалить владельца семьи без явной передачи владения",
                code="FAMILY_OWNER_TRANSFER_REQUIRED",
            )
        if (
            family
            and family.billing_account_id == target.id
            and has_billing_ownership_context(family)
        ):
            raise ValidationError(
                "Нельзя удалить участника, пока на нём привязана семейная подписка",
                code="BILLING_OWNER_TRANSFER_REQUIRED",
            )

        next_family = await self._create_solo_family_for_member(target)
        await self._account_repo.update(
            copy_account(
                target,
                family_id=next_family.id,
                family_role="admin",
                session_version=target.session_version + 1,
                access_policy=FamilyAccessPolicy(),
            )
        )
        await self._session_repo.delete_by_account_id(target.id)

    async def update_member_profile_for_account(
        self,
        member_account_id: UUID,
        dto: FamilyMemberProfileUpdateDto,
        current_account_id: UUID,
        current_family_id: UUID,
        current_family_role: str,
    ) -> AccountResponseDto:
        target = await self._account_repo.get_by_id(member_account_id)
        if not target or target.family_id != current_family_id or target.family_role == "deleted":
            raise NotFoundError("Участник семьи не найден", resource="account")
        if current_account_id != member_account_id:
            raise ForbiddenError("Личный профиль участника можно редактировать только самому")

        updated = await self._account_repo.update(
            copy_account(
                target,
                display_name=(
                    normalize_optional_display_name(dto.display_name)
                    if "display_name" in dto.model_fields_set
                    else target.display_name
                ),
                relationship_label=(
                    (dto.relationship_label or "").strip() or None
                    if "relationship_label" in dto.model_fields_set
                    else target.relationship_label
                ),
                phone=(
                    (dto.phone or "").strip() or None
                    if "phone" in dto.model_fields_set
                    else target.phone
                ),
            )
        )
        return self._to_member_response(updated)

    async def update(self, id: UUID, dto: FamilyUpdateDto) -> FamilyResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        fields_set = dto.model_fields_set
        if not fields_set:
            updated = entity
        else:
            cabinet_member_account_ids = (
                await self._resolve_cabinet_member_account_ids(id, dto.cabinet_member_account_ids)
                if "cabinet_member_account_ids" in fields_set
                else list(entity.cabinet_member_account_ids)
            )
            updated = await self._repo.update(
                Family(
                    id=entity.id,
                    name=dto.name if dto.name is not None else entity.name,
                    cabinet_member_account_ids=cabinet_member_account_ids,
                    owner_account_id=entity.owner_account_id,
                    billing_account_id=entity.billing_account_id,
                    plan_code=entity.plan_code,
                    subscription_status=entity.subscription_status,
                    subscription_provider=entity.subscription_provider,
                    subscription_product_id=entity.subscription_product_id,
                    subscription_expires_at=entity.subscription_expires_at,
                )
            )
        return self._to_response(updated)

    async def update_for_account(
        self,
        id: UUID,
        dto: FamilyUpdateDto,
        current_family_id: UUID,
        current_account_id: UUID,
    ) -> FamilyResponseDto:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        family = await self._repo.get_by_id(id)
        self._ensure_family_owner(family, current_account_id)
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Семья не найдена", resource="family")
        await self._repo.delete(id)

    async def delete_for_account(
        self, id: UUID, current_family_id: UUID, current_account_id: UUID
    ) -> None:
        if id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        family = await self._repo.get_by_id(id)
        self._ensure_family_owner(family, current_account_id)
        await self.delete(id)
