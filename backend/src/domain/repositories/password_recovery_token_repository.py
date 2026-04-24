"""Интерфейс репозитория recovery-токенов пароля."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.password_recovery_token import PasswordRecoveryToken
from src.domain.repositories.base import BaseRepository


class PasswordRecoveryTokenRepository(BaseRepository[PasswordRecoveryToken]):
    """Репозиторий временных recovery-токенов."""

    @abstractmethod
    async def add(self, entity: PasswordRecoveryToken) -> PasswordRecoveryToken:
        """Создать токен."""
        ...

    @abstractmethod
    async def get_by_token_hash(self, token_hash: str) -> PasswordRecoveryToken | None:
        """Получить токен по хешу."""
        ...

    @abstractmethod
    async def update(self, entity: PasswordRecoveryToken) -> PasswordRecoveryToken:
        """Обновить токен."""
        ...

    @abstractmethod
    async def delete_by_account_id(self, account_id: UUID) -> int:
        """Удалить все recovery-токены аккаунта."""
        ...
