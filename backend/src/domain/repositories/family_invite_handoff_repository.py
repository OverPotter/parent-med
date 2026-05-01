"""Интерфейс репозитория handoff-сессий invite-flow."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.family_invite_handoff import FamilyInviteHandoff
from src.domain.repositories.base import BaseRepository


class FamilyInviteHandoffRepository(BaseRepository[FamilyInviteHandoff]):
    """Репозиторий handoff-сессий invite-flow."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> FamilyInviteHandoff | None:
        """Получить handoff-сессию по id."""
        ...

    @abstractmethod
    async def get_by_handoff_token_hash(
        self, handoff_token_hash: str
    ) -> FamilyInviteHandoff | None:
        """Получить handoff-сессию по хешу публичного handoff id."""
        ...

    @abstractmethod
    async def add(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        """Создать handoff-сессию."""
        ...

    @abstractmethod
    async def update(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        """Обновить handoff-сессию."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить handoff-сессию."""
        ...
