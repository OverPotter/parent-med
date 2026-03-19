"""Сущность: аккаунт пользователя."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Account:
    """Аккаунт с логином, хешем пароля и привязкой к семье."""

    id: UUID
    email: str
    password_hash: str
    family_id: UUID
    push_before_reminder_minutes: int
    cabinet_notify_30_days: bool
    cabinet_notify_15_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_1_day: bool
    created_at: datetime
