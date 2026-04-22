"""Роли участника внутри семьи."""

from typing import Literal

FamilyRole = Literal["admin", "member", "deleted"]


def normalize_family_role(role: str) -> FamilyRole:
    """Нормализовать старые и новые роли семьи."""

    lowered = (role or "").strip().lower()
    if lowered == "owner":
        return "admin"
    if lowered == "adult":
        return "member"
    if lowered in {"admin", "member", "deleted"}:
        return lowered
    return "member"


def is_family_admin(role: str) -> bool:
    """Проверить, что роль даёт семейное администрирование."""

    return normalize_family_role(role) == "admin"
