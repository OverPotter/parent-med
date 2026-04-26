"""Effective subscription access for the current family/account."""

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.subscription_access import SubscriptionAccessResponseDto
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.domain.entities.family_roles import is_family_admin
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.pillbox_repository import PillboxRepository


class SubscriptionAccessService:
    """Computes effective family access from family subscription snapshot fields."""

    def __init__(
        self,
        family_repo: FamilyRepository,
        account_repo: AccountRepository,
        child_repo: ChildRepository,
        pillbox_repo: PillboxRepository,
    ) -> None:
        self._family_repo = family_repo
        self._account_repo = account_repo
        self._child_repo = child_repo
        self._pillbox_repo = pillbox_repo

    @staticmethod
    def _active_member_count(accounts: list[object]) -> int:
        return sum(1 for account in accounts if getattr(account, "family_role", "") != "deleted")

    async def get_for_account(self, account: AuthenticatedAccount) -> SubscriptionAccessResponseDto:
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            return SubscriptionAccessResponseDto()

        family_accounts = await self._account_repo.list_by_family_id(account.family_id)
        children = await self._child_repo.get_by_family_id(account.family_id)
        pillbox_plans = await self._pillbox_repo.list_by_family_id(account.family_id)

        policy = resolve_family_plan_policy(family)
        is_billing_owner = family.owner_account_id == account.id
        is_family_owner = family.owner_account_id == account.id
        can_manage_subscription = family.owner_account_id == account.id
        can_manage_member_roles = policy.can_manage_member_roles and (
            is_family_owner or is_family_admin(account.family_role)
        )
        can_invite_members = policy.can_invite_members and is_family_owner

        return SubscriptionAccessResponseDto(
            plan_code=family.plan_code,  # type: ignore[arg-type]
            subscription_status=family.subscription_status,  # type: ignore[arg-type]
            premium_active=policy.premium_active,
            has_plus_access=policy.premium_active,
            is_billing_owner=is_billing_owner,
            can_manage_subscription=can_manage_subscription,
            can_invite_members=can_invite_members,
            can_manage_member_roles=can_manage_member_roles,
            can_use_live_activities=policy.can_use_live_activities,
            can_export_csv=policy.can_export_csv,
            max_children=policy.max_children,
            max_adults=policy.max_adults,
            max_pillbox_plans=policy.max_pillbox_plans,
            free_primary_child_id=family.free_primary_child_id,
            free_primary_pillbox_plan_id=family.free_primary_pillbox_plan_id,
            current_children_count=len(children),
            current_adults_count=self._active_member_count(family_accounts),
            current_pillbox_plan_count=len(pillbox_plans),
        )
