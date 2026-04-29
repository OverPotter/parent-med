"""Интерфейс репозитория публичных обращений."""

from abc import abstractmethod
from datetime import datetime
from uuid import UUID

from src.domain.entities.public_support_request import PublicSupportRequest
from src.domain.repositories.base import BaseRepository


class PublicSupportRequestRepository(BaseRepository[PublicSupportRequest]):
    """Репозиторий public support обращений."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> PublicSupportRequest | None:
        """Получить по id."""
        ...

    @abstractmethod
    async def count_since(self, reply_contact: str, since: datetime) -> int:
        """Число обращений по reply_contact с указанного момента."""
        ...

    @abstractmethod
    async def get_by_reply_contact_and_client_request_id(
        self,
        reply_contact: str,
        client_request_id: UUID,
    ) -> PublicSupportRequest | None:
        """Идемпотентный поиск по reply_contact + client_request_id."""
        ...

    @abstractmethod
    async def add(self, entity: PublicSupportRequest) -> PublicSupportRequest:
        """Сохранить обращение."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить по id."""
        ...
