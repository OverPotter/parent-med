"""Интерфейс репозитория родителей."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.parent import Parent
from src.domain.repositories.base import BaseRepository


class ParentRepository(BaseRepository[Parent]):
    """Репозиторий родителей внутри семьи."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> Parent | None:
        """Получить родителя по id."""
        ...

    @abstractmethod
    async def get_by_family_id(self, family_id: UUID) -> list[Parent]:
        """Получить список родителей семьи."""
        ...

    @abstractmethod
    async def add(self, entity: Parent) -> Parent:
        """Создать родителя."""
        ...

    @abstractmethod
    async def update(self, entity: Parent) -> Parent:
        """Обновить родителя."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить родителя."""
        ...
