"""Интерфейс репозитория аккаунтов."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.account import Account
from src.domain.repositories.base import BaseRepository


class AccountRepository(BaseRepository[Account]):
    """Репозиторий аккаунтов."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> Account | None:
        """Получить аккаунт по id."""
        ...

    @abstractmethod
    async def get_by_login(self, login: str) -> Account | None:
        """Получить аккаунт по login."""
        ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Account | None:
        """Получить аккаунт по email."""
        ...

    @abstractmethod
    async def get_by_family_id(self, family_id: UUID) -> Account | None:
        """Получить основной аккаунт семьи."""
        ...

    @abstractmethod
    async def list_by_family_id(self, family_id: UUID) -> list[Account]:
        """Получить все аккаунты семьи."""
        ...

    @abstractmethod
    async def add(self, entity: Account) -> Account:
        """Создать аккаунт."""
        ...

    @abstractmethod
    async def update(self, entity: Account) -> Account:
        """Обновить аккаунт."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить аккаунт."""
        ...
