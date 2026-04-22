"""Семейные права доступа участника."""

from dataclasses import dataclass, field
from typing import Literal
from uuid import UUID

AccessLevel = Literal["none", "view", "act", "edit"]
ChildrenAccessLevel = Literal["view", "act", "edit"]


@dataclass
class FamilyAccessPolicy:
    """Набор прав участника внутри семьи."""

    all_children: bool = True
    child_ids: list[UUID] = field(default_factory=list)
    children_access: ChildrenAccessLevel = "edit"
    cabinet_access: AccessLevel = "edit"
    pillbox_access: AccessLevel = "edit"
    cabinet_push_enabled: bool = True


def build_default_family_access_policy() -> FamilyAccessPolicy:
    """Дефолтный полный доступ для существующих и новых участников."""

    return FamilyAccessPolicy()


def serialize_family_access_policy(policy: FamilyAccessPolicy) -> dict[str, object]:
    """Преобразовать policy в JSON-совместимый вид."""

    return {
        "all_children": policy.all_children,
        "child_ids": [str(child_id) for child_id in policy.child_ids],
        "children_access": policy.children_access,
        "cabinet_access": policy.cabinet_access,
        "pillbox_access": policy.pillbox_access,
        "cabinet_push_enabled": policy.cabinet_push_enabled,
    }


def deserialize_family_access_policy(payload: object | None) -> FamilyAccessPolicy:
    """Восстановить policy из JSONB-поля."""

    if not isinstance(payload, dict):
        return build_default_family_access_policy()
    child_ids_raw = payload.get("child_ids")
    child_ids = []
    if isinstance(child_ids_raw, list):
        for value in child_ids_raw:
            try:
                child_ids.append(UUID(str(value)))
            except (TypeError, ValueError):
                continue
    all_children = bool(payload.get("all_children", True))
    if not all_children and len(child_ids) == 0:
        all_children = True

    return FamilyAccessPolicy(
        all_children=all_children,
        child_ids=[] if all_children else child_ids,
        children_access=_normalize_children_access_level(payload.get("children_access")),
        cabinet_access=_normalize_access_level(payload.get("cabinet_access")),
        pillbox_access=_normalize_access_level(payload.get("pillbox_access")),
        cabinet_push_enabled=bool(payload.get("cabinet_push_enabled", True)),
    )


def _normalize_access_level(value: object) -> AccessLevel:
    if value in {"none", "view", "act", "edit"}:
        return value
    return "edit"


def _normalize_children_access_level(value: object) -> ChildrenAccessLevel:
    if value in {"view", "act", "edit"}:
        return value
    return "edit"
