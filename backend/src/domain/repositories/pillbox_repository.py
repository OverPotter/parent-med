"""Интерфейс репозитория семейной таблетницы."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.pillbox import PillboxDoseLog, PillboxPlan
from src.domain.repositories.base import BaseRepository


class PillboxRepository(BaseRepository[PillboxPlan]):
    """Репозиторий семейных pillbox-планов."""

    @abstractmethod
    async def list_by_family_id(self, family_id: UUID) -> list[PillboxPlan]:
        """Все планы таблетницы семьи."""
        ...

    @abstractmethod
    async def get_by_id(self, id: UUID) -> PillboxPlan | None:
        """План по id."""
        ...

    @abstractmethod
    async def add(self, entity: PillboxPlan) -> PillboxPlan:
        """Создать план."""
        ...

    @abstractmethod
    async def update(self, entity: PillboxPlan) -> PillboxPlan:
        """Обновить план и вложенные лекарства."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить план."""
        ...

    @abstractmethod
    async def add_dose_log(self, entity: PillboxDoseLog) -> PillboxDoseLog:
        """Записать факт приёма."""
        ...
