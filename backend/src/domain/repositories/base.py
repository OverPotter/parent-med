"""Базовый интерфейс репозитория (CRUD + доменные методы)."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """Базовый репозиторий для сущности типа T."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> T | None:
        """Получить сущность по id."""
        ...

    @abstractmethod
    async def add(self, entity: T) -> T:
        """Сохранить сущность."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить по id. Возвращает True если удалено."""
        ...
