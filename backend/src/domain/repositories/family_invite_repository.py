"""Интерфейс репозитория приглашений в семью."""

from abc import abstractmethod
from datetime import datetime
from uuid import UUID

from src.domain.entities.family_invite import FamilyInvite
from src.domain.repositories.base import BaseRepository


class FamilyInviteRepository(BaseRepository[FamilyInvite]):
    """Репозиторий invite-ссылок в семью."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> FamilyInvite | None:
        """Получить приглашение по id."""
        ...

    @abstractmethod
    async def get_by_token_hash(self, token_hash: str) -> FamilyInvite | None:
        """Получить приглашение по хешу токена."""
        ...

    @abstractmethod
    async def add(self, entity: FamilyInvite) -> FamilyInvite:
        """Создать приглашение."""
        ...

    @abstractmethod
    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        """Обновить приглашение."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить приглашение."""
        ...

    @abstractmethod
    async def delete_for_family(self, family_id: UUID) -> int:
        """Удалить все приглашения семьи перед выпуском нового кода."""
        ...

    @abstractmethod
    async def accept_if_active(
        self, invite_id: UUID, account_id: UUID, accepted_at: datetime
    ) -> bool:
        """Атомарно пометить приглашение использованным, если оно ещё активно."""
        ...
