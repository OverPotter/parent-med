"""Интерфейс репозитория записей роста."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.height_entry import HeightEntry
from src.domain.repositories.base import BaseRepository


class HeightEntryRepository(BaseRepository[HeightEntry]):
    """Репозиторий записей роста ребёнка."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> HeightEntry | None:
        ...

    @abstractmethod
    async def get_latest_by_child_id(self, child_id: UUID) -> HeightEntry | None:
        ...

    @abstractmethod
    async def get_by_child_id(self, child_id: UUID) -> list[HeightEntry]:
        ...

    @abstractmethod
    async def add(self, entity: HeightEntry) -> HeightEntry:
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        ...
