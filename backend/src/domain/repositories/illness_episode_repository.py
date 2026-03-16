"""Интерфейс репозитория эпизодов болезни."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.base import BaseRepository


class IllnessEpisodeRepository(BaseRepository[IllnessEpisode]):
    """Репозиторий эпизодов болезни."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> IllnessEpisode | None:
        """Получить эпизод по id."""
        ...

    @abstractmethod
    async def get_by_child_id(self, child_id: UUID) -> list[IllnessEpisode]:
        """Эпизоды по ребёнку (по убыванию даты начала)."""
        ...

    @abstractmethod
    async def get_active_by_child_id(self, child_id: UUID) -> IllnessEpisode | None:
        """Активный эпизод по ребёнку (если есть)."""
        ...

    @abstractmethod
    async def add(self, entity: IllnessEpisode) -> IllnessEpisode:
        """Создать эпизод."""
        ...

    @abstractmethod
    async def update(self, entity: IllnessEpisode) -> IllnessEpisode:
        """Обновить эпизод (например, закрыть)."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить эпизод."""
        ...
