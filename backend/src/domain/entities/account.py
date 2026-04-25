"""Сущность: аккаунт пользователя."""

from dataclasses import dataclass, field, replace
from datetime import datetime
from typing import Literal
from uuid import UUID

from src.domain.entities.family_access import (
    FamilyAccessPolicy,
    build_default_family_access_policy,
)

AccountLanguage = Literal["ru", "en"]


@dataclass
class Account:
    """Аккаунт с email, хешем пароля и привязкой к семье."""

    id: UUID
    email: str | None
    password_hash: str
    family_id: UUID
    display_name: str | None
    family_role: str
    push_before_reminder_minutes: int
    cabinet_notify_10_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_3_days: bool
    cabinet_notify_1_day: bool
    created_at: datetime
    recovery_code_hash: str | None = None
    children_push_enabled: bool = True
    pillbox_push_enabled: bool = True
    pillbox_push_before_reminder_minutes: int = 10
    relationship_label: str | None = None
    phone: str | None = None
    preferred_language: AccountLanguage = "ru"
    live_activity_sleep_enabled: bool = True
    live_activity_feeding_enabled: bool = True
    live_activity_illness_enabled: bool = True
    access_policy: FamilyAccessPolicy = field(default_factory=build_default_family_access_policy)


def copy_account(account: Account, **changes: object) -> Account:
    """Создать копию аккаунта с точечными изменениями."""

    return replace(account, **changes)
