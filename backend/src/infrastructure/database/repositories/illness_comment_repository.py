"""Реализация репозитория комментариев эпизода."""

from collections import defaultdict
from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.illness_comment import IllnessComment
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.infrastructure.database.models.illness_episode_event import IllnessEpisodeEventModel


class SqlIllnessCommentRepository(IllnessCommentRepository):
    """Репозиторий комментариев на общей таблице событий эпизода."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: IllnessEpisodeEventModel) -> IllnessComment:
        return IllnessComment(
            id=model.id,
            episode_id=model.episode_id,
            created_at=model.occurred_at,
            text=model.comment or "",
            created_by_account_id=model.created_by_account_id,
            created_by_name_snapshot=model.created_by_name_snapshot,
        )

    def _to_model(self, entity: IllnessComment) -> IllnessEpisodeEventModel:
        return IllnessEpisodeEventModel(
            id=entity.id,
            episode_id=entity.episode_id,
            event_type="comment",
            occurred_at=entity.created_at,
            comment=entity.text,
            created_by_account_id=entity.created_by_account_id,
            created_by_name_snapshot=entity.created_by_name_snapshot,
        )

    async def get_by_id(self, id: UUID) -> IllnessComment | None:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "comment",
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[IllnessComment]:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel)
            .where(
                IllnessEpisodeEventModel.episode_id == episode_id,
                IllnessEpisodeEventModel.event_type == "comment",
            )
            .order_by(IllnessEpisodeEventModel.occurred_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_by_episode_ids(
        self, episode_ids: Sequence[UUID]
    ) -> dict[UUID, list[IllnessComment]]:
        if not episode_ids:
            return {}
        result = await self._session.execute(
            select(IllnessEpisodeEventModel)
            .where(
                IllnessEpisodeEventModel.episode_id.in_(episode_ids),
                IllnessEpisodeEventModel.event_type == "comment",
            )
            .order_by(
                IllnessEpisodeEventModel.episode_id,
                IllnessEpisodeEventModel.occurred_at.desc(),
            )
        )
        grouped: dict[UUID, list[IllnessComment]] = defaultdict(list)
        for row in result.scalars().all():
            grouped[row.episode_id].append(self._to_entity(row))
        return dict(grouped)

    async def add(self, entity: IllnessComment) -> IllnessComment:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(IllnessEpisodeEventModel).where(
                IllnessEpisodeEventModel.id == id,
                IllnessEpisodeEventModel.event_type == "comment",
            )
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
