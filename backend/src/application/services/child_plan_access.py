"""Subscription-aware child mutation guards."""

from uuid import UUID

from src.application.dto.auth import AuthenticatedAccount
from src.application.services.access_control import coerce_account_context
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.core.exceptions import ForbiddenError
from src.domain.repositories.family_repository import FamilyRepository


async def is_non_primary_child_in_free_family(
    family_repo: FamilyRepository | None,
    current_account: AuthenticatedAccount | UUID,
    child_id: UUID,
) -> bool:
    if family_repo is None:
        return False
    account = coerce_account_context(current_account)
    family = await family_repo.get_by_id(account.family_id)
    if family is None:
        return False
    if resolve_family_plan_policy(family).premium_active:
        return False
    primary_child_id = family.free_primary_child_id
    if primary_child_id is None:
        return False
    return primary_child_id != child_id


async def ensure_child_plan_mutation_allowed(
    family_repo: FamilyRepository | None,
    current_account: AuthenticatedAccount | UUID,
    child_id: UUID,
) -> None:
    if not await is_non_primary_child_in_free_family(family_repo, current_account, child_id):
        return
    raise ForbiddenError(
        "Во Free для этого ребёнка можно только просматривать данные. "
        "Оформите Plus, чтобы продолжить изменения."
    )


async def ensure_active_illness_continuation_allowed(
    family_repo: FamilyRepository | None,
    current_account: AuthenticatedAccount | UUID,
    child_id: UUID,
    *,
    episode_is_active: bool,
) -> None:
    if not await is_non_primary_child_in_free_family(family_repo, current_account, child_id):
        return
    if episode_is_active:
        return
    raise ForbiddenError(
        "Во Free для этого ребёнка можно завершить только уже начатое наблюдение. "
        "Новый этап доступен в Plus."
    )
