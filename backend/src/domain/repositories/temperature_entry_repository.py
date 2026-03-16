"""Интерфейс репозитория записей температуры."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.temperature_entry import TemperatureEntry
from src.domain.repositories.base import BaseRepository


class TemperatureEntryRepository(BaseRepository[TemperatureEntry]):
    """Репозиторий записей температуры в эпизоде болезни."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> TemperatureEntry | None:
        """Получить запись по id."""
        ...

    @abstractmethod
    async def get_by_episode_id(self, episode_id: UUID) -> list[TemperatureEntry]:
        """Журнал температуры по эпизоду."""
        ...

    @abstractmethod
    async def add(self, entity: TemperatureEntry) -> TemperatureEntry:
        """Добавить запись."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить запись."""
        ...
