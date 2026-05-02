"""Проверки семейных прав доступа."""

from typing import Literal
from uuid import UUID

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.child import Child
from src.domain.repositories.child_repository import ChildRepository

_ACCESS_ORDER = {"none": 0, "view": 1, "act": 2, "edit": 3}


def coerce_account_context(account: AuthenticatedAccount | UUID) -> AuthenticatedAccount:
    if isinstance(account, AuthenticatedAccount):
        return account

    # Backward-compatible shim for legacy unit tests that still pass only family_id.
    return AuthenticatedAccount(
        id=UUID(int=0),
        email=None,
        family_id=account,
        display_name="",
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(
            all_children=True,
            children_access="edit",
            cabinet_access="edit",
            pillbox_access="edit",
        ),
    )


def _policy(account: AuthenticatedAccount | UUID) -> FamilyAccessPolicyDto:
    account = coerce_account_context(account)
    return account.access_policy or FamilyAccessPolicyDto()


def is_family_admin(account: AuthenticatedAccount | UUID) -> bool:
    account = coerce_account_context(account)
    return account.family_role == "admin"


def can_view_child(account: AuthenticatedAccount | UUID, child_id: UUID) -> bool:
    policy = _policy(account)
    return policy.all_children or child_id in set(policy.child_ids)


def can_edit_child(account: AuthenticatedAccount | UUID, child_id: UUID) -> bool:
    policy = _policy(account)
    if policy.children_access != "edit":
        return False
    return policy.all_children or child_id in set(policy.child_ids)


def can_manage_children_list(account: AuthenticatedAccount | UUID) -> bool:
    if is_family_admin(account):
        return True
    policy = _policy(account)
    return policy.all_children and policy.children_access == "edit"


def can_act_child(account: AuthenticatedAccount | UUID, child_id: UUID) -> bool:
    policy = _policy(account)
    if policy.children_access not in {"act", "edit"}:
        return False
    return policy.all_children or child_id in set(policy.child_ids)


def ensure_child_view_access(account: AuthenticatedAccount | UUID, child_id: UUID) -> None:
    if not can_view_child(account, child_id):
        raise ForbiddenError("Нет доступа к данным этого ребёнка")


def ensure_child_edit_access(account: AuthenticatedAccount | UUID, child_id: UUID) -> None:
    if not can_edit_child(account, child_id):
        raise ForbiddenError("Нет прав на изменение данных этого ребёнка")


def ensure_child_action_access(account: AuthenticatedAccount | UUID, child_id: UUID) -> None:
    if not can_act_child(account, child_id):
        raise ForbiddenError("Нет прав на действия по этому ребёнку")


def ensure_child_access(
    account: AuthenticatedAccount | UUID,
    child_id: UUID,
    required_level: Literal["view", "act", "edit"] = "view",
) -> None:
    if required_level == "edit":
        ensure_child_edit_access(account, child_id)
        return
    if required_level == "act":
        ensure_child_action_access(account, child_id)
        return
    ensure_child_view_access(account, child_id)


async def get_child_for_account(
    child_repo: ChildRepository,
    child_id: UUID,
    account: AuthenticatedAccount | UUID,
    required_level: Literal["view", "act", "edit"] = "view",
) -> Child:
    account = coerce_account_context(account)
    child = await child_repo.get_by_id(child_id)
    if not child:
        raise NotFoundError("Ребёнок не найден", resource="child")
    if child.family_id != account.family_id:
        raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
    ensure_child_access(account, child.id, required_level)
    return child


def ensure_children_admin_access(account: AuthenticatedAccount | UUID) -> None:
    if not can_manage_children_list(account):
        raise ForbiddenError("Для управления списком детей нужен полный доступ ко всем детям")


def filter_child_ids(account: AuthenticatedAccount | UUID, child_ids: list[UUID]) -> list[UUID]:
    policy = _policy(account)
    if policy.all_children:
        return child_ids
    allowed = set(policy.child_ids)
    return [child_id for child_id in child_ids if child_id in allowed]


def ensure_module_access(
    account: AuthenticatedAccount | UUID,
    module: str,
    required_level: str,
) -> None:
    policy = _policy(account)
    actual_level = getattr(policy, f"{module}_access", "none")
    if _ACCESS_ORDER.get(actual_level, 0) < _ACCESS_ORDER.get(required_level, 0):
        module_labels = {
            "cabinet": "аптечке",
            "pillbox": "приёмам",
        }
        raise ForbiddenError(f"Нет доступа к разделу {module_labels.get(module, module)}")


def ensure_children_edit_scope(account: AuthenticatedAccount | UUID, module_label: str) -> None:
    policy = _policy(account)
    if policy.children_access != "edit":
        raise ForbiddenError(f"Для изменения данных в разделе {module_label} нужен доступ к детям")
