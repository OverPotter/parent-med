"""Интерфейс репозитория комментариев эпизода болезни."""

from abc import abstractmethod
from collections.abc import Sequence
from uuid import UUID

from src.domain.entities.illness_comment import IllnessComment
from src.domain.repositories.base import BaseRepository


class IllnessCommentRepository(BaseRepository[IllnessComment]):
    """Репозиторий комментариев по эпизоду."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> IllnessComment | None:
        """Получить комментарий по id."""
        ...

    @abstractmethod
    async def get_by_episode_id(self, episode_id: UUID) -> list[IllnessComment]:
        """Комментарии по эпизоду."""
        ...

    @abstractmethod
    async def get_by_episode_ids(
        self, episode_ids: Sequence[UUID]
    ) -> dict[UUID, list[IllnessComment]]:
        """Комментарии по нескольким эпизодам."""
        ...

    @abstractmethod
    async def add(self, entity: IllnessComment) -> IllnessComment:
        """Добавить комментарий."""
        ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool:
        """Удалить комментарий."""
        ...
