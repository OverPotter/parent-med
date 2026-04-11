"""Интерфейс репозитория сессий сна."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.sleep_session import SleepSession
from src.domain.repositories.base import BaseRepository


class SleepSessionRepository(BaseRepository[SleepSession]):
    """Репозиторий сессий сна ребёнка."""

    @abstractmethod
    async def get_by_child_id(self, child_id: UUID) -> list[SleepSession]:
        """История сна по ребёнку."""
        ...

    @abstractmethod
    async def get_active_by_child_id(self, child_id: UUID) -> SleepSession | None:
        """Текущая активная сессия сна."""
        ...

    @abstractmethod
    async def update(self, entity: SleepSession) -> SleepSession:
        """Обновить сессию сна."""
        ...
