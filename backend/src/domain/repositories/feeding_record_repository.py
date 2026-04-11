"""Интерфейс репозитория записей кормления."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.feeding_record import FeedingRecord
from src.domain.repositories.base import BaseRepository


class FeedingRecordRepository(BaseRepository[FeedingRecord]):
    """Репозиторий кормлений ребёнка."""

    @abstractmethod
    async def get_by_child_id(self, child_id: UUID) -> list[FeedingRecord]:
        """История кормлений по ребёнку."""
        ...

    @abstractmethod
    async def get_active_by_child_id(self, child_id: UUID) -> FeedingRecord | None:
        """Активное кормление по ребёнку."""
        ...
