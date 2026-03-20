"""Интерфейс репозитория приёмов лекарств."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.administration_event import AdministrationEvent
from src.domain.repositories.base import BaseRepository


class AdministrationEventRepository(BaseRepository[AdministrationEvent]):
    """Репозиторий фактов приёма лекарств."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> AdministrationEvent | None:
        """Получить приём по id."""
        ...

    @abstractmethod
    async def get_by_episode_id(self, episode_id: UUID) -> list[AdministrationEvent]:
        """Журнал приёмов по эпизоду."""
        ...

    @abstractmethod
    async def add(self, entity: AdministrationEvent) -> AdministrationEvent:
        """Зафиксировать приём (после проверки Safety Engine)."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить запись приёма."""
        ...

    @abstractmethod
    async def clear_household_medicine_references(
        self,
        household_medicine_id: UUID,
        fallback_medicine_name: str,
    ) -> None:
        """Убрать ссылку на упаковку из истории при удалении из аптечки."""
        ...
