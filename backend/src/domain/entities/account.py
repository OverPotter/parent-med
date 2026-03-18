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
    created_at: datetime
