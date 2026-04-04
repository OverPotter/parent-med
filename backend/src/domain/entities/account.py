"""Сущность: аккаунт пользователя."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

AccountLanguage = Literal["ru", "en"]


@dataclass
class Account:
    """Аккаунт с логином, хешем пароля и привязкой к семье."""

    id: UUID
    login: str
    email: str | None
    password_hash: str
    family_id: UUID
    display_name: str
    family_role: str
    push_before_reminder_minutes: int
    pillbox_push_before_reminder_minutes: int
    cabinet_notify_10_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_3_days: bool
    cabinet_notify_1_day: bool
    created_at: datetime
    relationship_label: str | None = None
    phone: str | None = None
    preferred_language: AccountLanguage = "ru"
