"""Сервис комментариев по эпизоду болезни."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.illness_comment import (
    IllnessCommentCreateDto,
    IllnessCommentResponseDto,
)
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.illness_comment import IllnessComment
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class IllnessCommentService:
    """Сервис журнала комментариев внутри эпизода болезни."""

    def __init__(
        self,
        comment_repo: IllnessCommentRepository,
        episode_repo: IllnessEpisodeRepository,
    ) -> None:
        self._repo = comment_repo
        self._episode_repo = episode_repo

    def _to_response(self, entity: IllnessComment) -> IllnessCommentResponseDto:
        return IllnessCommentResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            created_at=entity.created_at,
            text=entity.text,
        )

    async def get_by_id(self, id: UUID) -> IllnessCommentResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Комментарий не найден", resource="illness_comment")
        return self._to_response(entity)

    async def get_by_episode_id(self, episode_id: UUID) -> list[IllnessCommentResponseDto]:
        if await self._episode_repo.get_by_id(episode_id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(entity) for entity in entities]

    async def create(self, dto: IllnessCommentCreateDto) -> IllnessCommentResponseDto:
        episode = await self._episode_repo.get_by_id(dto.episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        if episode.status != "active":
            raise ValidationError("Эпизод закрыт, комментарии добавлять нельзя")
        text = dto.text.strip()
        if not text:
            raise ValidationError("Комментарий не может быть пустым")
        entity = IllnessComment(
            id=uuid4(),
            episode_id=dto.episode_id,
            created_at=dto.created_at or datetime.now(UTC),
            text=text,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Комментарий не найден", resource="illness_comment")
        await self._repo.delete(id)
