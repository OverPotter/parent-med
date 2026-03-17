"""Интерфейс репозитория сессий аккаунта."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.account_session import AccountSession
from src.domain.repositories.base import BaseRepository


class AccountSessionRepository(BaseRepository[AccountSession]):
    """Репозиторий refresh-сессий."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> AccountSession | None:
        """Получить сессию по id."""
        ...

    @abstractmethod
    async def get_by_token_hash(self, token_hash: str) -> AccountSession | None:
        """Получить сессию по хешу токена."""
        ...

    @abstractmethod
    async def add(self, entity: AccountSession) -> AccountSession:
        """Создать сессию."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить сессию по id."""
        ...

    @abstractmethod
    async def delete_by_account_id(self, account_id: UUID) -> int:
        """Удалить все сессии аккаунта."""
        ...
