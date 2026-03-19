"""Интерфейс репозитория планов приёма лекарства."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.repositories.base import BaseRepository


class EpisodeMedicationPlanRepository(BaseRepository[EpisodeMedicationPlan]):
    """Репозиторий планов лекарства внутри эпизода."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> EpisodeMedicationPlan | None:
        """Получить план по id."""
        ...

    @abstractmethod
    async def get_by_episode_id(self, episode_id: UUID) -> list[EpisodeMedicationPlan]:
        """Все планы по эпизоду."""
        ...

    @abstractmethod
    async def get_by_episode_and_medicine(
        self, episode_id: UUID, household_medicine_id: UUID
    ) -> EpisodeMedicationPlan | None:
        """План по эпизоду и упаковке."""
        ...

    @abstractmethod
    async def add(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlan:
        """Создать план."""
        ...

    @abstractmethod
    async def update(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlan:
        """Обновить план."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить план."""
        ...

    @abstractmethod
    async def get_for_push_notifications(self) -> list[EpisodeMedicationPlan]:
        """Планы, которые участвуют в глобальных push-напоминаниях."""
        ...

    @abstractmethod
    async def update_notification_marks(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlan:
        """Обновить метки уже отправленных уведомлений."""
        ...
