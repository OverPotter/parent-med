"""Сущность временного токена восстановления пароля."""

from dataclasses import dataclass, replace
from datetime import datetime
from uuid import UUID


@dataclass
class PasswordRecoveryToken:
    """Одноразовый временный токен восстановления пароля."""

    id: UUID
    account_id: UUID
    token_hash: str
    expires_at: datetime
    created_at: datetime
    used_at: datetime | None = None


def copy_password_recovery_token(
    token: PasswordRecoveryToken, **changes: object
) -> PasswordRecoveryToken:
    """Создать копию токена с точечными изменениями."""

    return replace(token, **changes)
