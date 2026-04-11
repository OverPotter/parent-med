"""Реализация репозитория записей кормления."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.feeding_record import FeedingRecord
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.infrastructure.database.models.feeding_record import FeedingRecordModel


class SqlFeedingRecordRepository(FeedingRecordRepository):
    """Репозиторий кормлений ребёнка на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: FeedingRecordModel) -> FeedingRecord:
        return FeedingRecord(
            id=model.id,
            child_id=model.child_id,
            feeding_type=model.feeding_type,
            breast_side=model.breast_side,
            is_expressed=model.is_expressed,
            formula_volume_ml=model.formula_volume_ml,
            recorded_at=model.recorded_at,
            started_at=model.started_at,
            ended_at=model.ended_at,
            duration_minutes=model.duration_minutes,
            status=model.status,
            note=model.note,
            created_by_account_id=model.created_by_account_id,
        )

    def _to_model(self, entity: FeedingRecord) -> FeedingRecordModel:
        return FeedingRecordModel(
            id=entity.id,
            child_id=entity.child_id,
            feeding_type=entity.feeding_type,
            breast_side=entity.breast_side,
            is_expressed=entity.is_expressed,
            formula_volume_ml=entity.formula_volume_ml,
            recorded_at=entity.recorded_at,
            started_at=entity.started_at,
            ended_at=entity.ended_at,
            duration_minutes=entity.duration_minutes,
            status=entity.status,
            note=entity.note,
            created_by_account_id=entity.created_by_account_id,
        )

    async def get_by_id(self, id: UUID) -> FeedingRecord | None:
        result = await self._session.execute(
            select(FeedingRecordModel).where(FeedingRecordModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_child_id(self, child_id: UUID) -> list[FeedingRecord]:
        result = await self._session.execute(
            select(FeedingRecordModel)
            .where(FeedingRecordModel.child_id == child_id)
            .order_by(FeedingRecordModel.recorded_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_active_by_child_id(self, child_id: UUID) -> FeedingRecord | None:
        result = await self._session.execute(
            select(FeedingRecordModel)
            .where(
                FeedingRecordModel.child_id == child_id,
                FeedingRecordModel.status == "active",
            )
            .order_by(FeedingRecordModel.recorded_at.desc())
            .limit(1)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: FeedingRecord) -> FeedingRecord:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: FeedingRecord) -> FeedingRecord:
        result = await self._session.execute(
            select(FeedingRecordModel).where(FeedingRecordModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"FeedingRecord {entity.id} not found")
        row.feeding_type = entity.feeding_type
        row.breast_side = entity.breast_side
        row.is_expressed = entity.is_expressed
        row.formula_volume_ml = entity.formula_volume_ml
        row.recorded_at = entity.recorded_at
        row.started_at = entity.started_at
        row.ended_at = entity.ended_at
        row.duration_minutes = entity.duration_minutes
        row.status = entity.status
        row.note = entity.note
        row.created_by_account_id = entity.created_by_account_id
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(FeedingRecordModel).where(FeedingRecordModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
