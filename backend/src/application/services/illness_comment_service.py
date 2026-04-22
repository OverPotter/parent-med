"""Сервис комментариев по эпизоду болезни."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.illness_comment import (
    IllnessCommentCreateDto,
    IllnessCommentResponseDto,
)
from src.application.services.access_control import (
    get_child_for_account,
)
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.illness_comment import IllnessComment
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class IllnessCommentService:
    """Сервис журнала комментариев внутри эпизода болезни."""

    def __init__(
        self,
        comment_repo: IllnessCommentRepository,
        episode_repo: IllnessEpisodeRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = comment_repo
        self._episode_repo = episode_repo
        self._child_repo = child_repo

    def _to_response(self, entity: IllnessComment) -> IllnessCommentResponseDto:
        return IllnessCommentResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            created_at=entity.created_at,
            text=entity.text,
            created_by_account_id=entity.created_by_account_id,
            created_by_name_snapshot=entity.created_by_name_snapshot,
        )

    async def _require_child_access(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> Child:
        return await get_child_for_account(
            self._child_repo,
            child_id,
            current_account,
            required_level,
        )

    async def _get_episode_for_account(
        self,
        episode_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> IllnessEpisode:
        episode = await self._episode_repo.get_by_id(episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._require_child_access(episode.child_id, current_account, required_level)
        return episode

    async def _get_comment_for_account(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> IllnessComment:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Комментарий не найден", resource="illness_comment")
        await self._get_episode_for_account(entity.episode_id, current_account, required_level)
        return entity

    async def get_by_id(self, id: UUID, current_account: AuthenticatedAccount) -> IllnessCommentResponseDto:
        return self._to_response(await self._get_comment_for_account(id, current_account))

    async def get_by_episode_id(
        self,
        episode_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[IllnessCommentResponseDto]:
        await self._get_episode_for_account(episode_id, current_account)
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(entity) for entity in entities]

    async def create(
        self,
        dto: IllnessCommentCreateDto,
        current_account: AuthenticatedAccount,
        created_by_account_id: UUID | None = None,
        created_by_name_snapshot: str | None = None,
    ) -> IllnessCommentResponseDto:
        episode = await self._get_episode_for_account(dto.episode_id, current_account, "act")
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
            created_by_account_id=created_by_account_id,
            created_by_name_snapshot=(created_by_name_snapshot or "").strip() or None,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        await self._get_comment_for_account(id, current_account, "edit")
        await self._repo.delete(id)
