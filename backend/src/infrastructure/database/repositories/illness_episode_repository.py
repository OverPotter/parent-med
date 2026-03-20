"""Реализация репозитория эпизодов болезни."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.infrastructure.database.models.illness_episode import IllnessEpisodeModel


class SqlIllnessEpisodeRepository(IllnessEpisodeRepository):
    """Репозиторий эпизодов болезни на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: IllnessEpisodeModel) -> IllnessEpisode:
        return IllnessEpisode(
            id=m.id,
            child_id=m.child_id,
            started_at=m.started_at,
            title=m.title,
            status=m.status,
            medication_mode=m.medication_mode,
            note=m.note,
            closed_at=m.closed_at,
            deleted_at=m.deleted_at,
        )

    def _to_model(self, e: IllnessEpisode) -> IllnessEpisodeModel:
        return IllnessEpisodeModel(
            id=e.id,
            child_id=e.child_id,
            started_at=e.started_at,
            title=e.title,
            status=e.status,
            medication_mode=e.medication_mode,
            note=e.note,
            closed_at=e.closed_at,
            deleted_at=e.deleted_at,
        )

    async def get_by_id(self, id: UUID) -> IllnessEpisode | None:
        result = await self._session.execute(
            select(IllnessEpisodeModel).where(
                IllnessEpisodeModel.id == id, IllnessEpisodeModel.deleted_at.is_(None)
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_child_id(self, child_id: UUID) -> list[IllnessEpisode]:
        result = await self._session.execute(
            select(IllnessEpisodeModel)
            .where(
                IllnessEpisodeModel.child_id == child_id,
                IllnessEpisodeModel.deleted_at.is_(None),
            )
            .order_by(IllnessEpisodeModel.started_at.desc())
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def get_active_by_child_id(self, child_id: UUID) -> IllnessEpisode | None:
        result = await self._session.execute(
            select(IllnessEpisodeModel)
            .where(
                IllnessEpisodeModel.child_id == child_id,
                IllnessEpisodeModel.status == "active",
                IllnessEpisodeModel.deleted_at.is_(None),
            )
            .order_by(IllnessEpisodeModel.started_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: IllnessEpisode) -> IllnessEpisode:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: IllnessEpisode) -> IllnessEpisode:
        result = await self._session.execute(
            select(IllnessEpisodeModel).where(IllnessEpisodeModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"IllnessEpisode {entity.id} not found")
        row.started_at = entity.started_at
        row.title = entity.title
        row.status = entity.status
        row.medication_mode = entity.medication_mode
        row.note = entity.note
        row.closed_at = entity.closed_at
        row.deleted_at = entity.deleted_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(IllnessEpisodeModel).where(IllnessEpisodeModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            row.deleted_at = datetime.now(UTC)
            if row.status == "active":
                row.status = "closed"
                row.closed_at = row.closed_at or datetime.now(UTC)
            await self._session.flush()
            return True
        return False
