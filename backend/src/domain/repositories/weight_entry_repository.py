"""Интерфейс репозитория записей веса."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.weight_entry import WeightEntry
from src.domain.repositories.base import BaseRepository


class WeightEntryRepository(BaseRepository[WeightEntry]):
    """Репозиторий записей веса ребёнка."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> WeightEntry | None:
        """Получить запись по id."""
        ...

    @abstractmethod
    async def get_latest_by_child_id(self, child_id: UUID) -> WeightEntry | None:
        """Последняя запись веса по ребёнку (для расчёта дозировок)."""
        ...

    @abstractmethod
    async def get_by_child_id(self, child_id: UUID) -> list[WeightEntry]:
        """История веса по ребёнку."""
        ...

    @abstractmethod
    async def add(self, entity: WeightEntry) -> WeightEntry:
        """Добавить запись."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить запись."""
        ...
