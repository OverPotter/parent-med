"""Интерфейс репозитория семей."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.family import Family
from src.domain.repositories.base import BaseRepository


class FamilyRepository(BaseRepository[Family]):
    """Репозиторий семей."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> Family | None:
        """Получить семью по id."""
        ...

    @abstractmethod
    async def add(self, entity: Family) -> Family:
        """Создать семью."""
        ...

    @abstractmethod
    async def update(self, entity: Family) -> Family:
        """Обновить семью."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить семью."""
        ...
