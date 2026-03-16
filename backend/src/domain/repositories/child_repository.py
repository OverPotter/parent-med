"""Интерфейс репозитория детей."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.child import Child
from src.domain.repositories.base import BaseRepository


class ChildRepository(BaseRepository[Child]):
    """Репозиторий детей."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> Child | None:
        """Получить ребёнка по id."""
        ...

    @abstractmethod
    async def get_by_family_id(self, family_id: UUID) -> list[Child]:
        """Список детей в семье."""
        ...

    @abstractmethod
    async def add(self, entity: Child) -> Child:
        """Добавить ребёнка."""
        ...

    @abstractmethod
    async def update(self, entity: Child) -> Child:
        """Обновить ребёнка."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить ребёнка."""
        ...
