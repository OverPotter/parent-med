"""Интерфейс репозитория обратной связи."""

from abc import abstractmethod
from datetime import datetime
from uuid import UUID

from src.domain.entities.account_feedback import AccountFeedback
from src.domain.repositories.base import BaseRepository


class AccountFeedbackRepository(BaseRepository[AccountFeedback]):
    """Репозиторий сообщений обратной связи."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> AccountFeedback | None:
        """Получить по id."""
        ...

    @abstractmethod
    async def count_since(self, account_id: UUID, since: datetime) -> int:
        """Число сообщений аккаунта с указанного момента."""
        ...

    @abstractmethod
    async def get_by_account_and_client_request_id(
        self,
        account_id: UUID,
        client_request_id: UUID,
    ) -> AccountFeedback | None:
        """Идемпотентный поиск по паре аккаунт + client_request_id."""
        ...

    @abstractmethod
    async def add(self, entity: AccountFeedback) -> AccountFeedback:
        """Сохранить сообщение."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить по id."""
        ...
