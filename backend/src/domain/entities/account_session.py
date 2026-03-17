"""Сущность: refresh-сессия аккаунта."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AccountSession:
    """Refresh-сессия авторизации."""

    id: UUID
    account_id: UUID
    token_hash: str
    created_at: datetime
    expires_at: datetime
