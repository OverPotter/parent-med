"""Реализация репозитория планов приёма лекарства."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.repositories.episode_medication_plan_repository import (
    EpisodeMedicationPlanRepository,
)
from src.infrastructure.database.models.episode_medication_plan import (
    EpisodeMedicationPlanModel,
)


class SqlEpisodeMedicationPlanRepository(EpisodeMedicationPlanRepository):
    """Репозиторий guided-планов на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: EpisodeMedicationPlanModel) -> EpisodeMedicationPlan:
        return EpisodeMedicationPlan(
            id=m.id,
            episode_id=m.episode_id,
            household_medicine_id=m.household_medicine_id,
            custom_medicine_name=m.custom_medicine_name,
            dose_amount=m.dose_amount,
            min_interval_minutes=m.min_interval_minutes,
            max_doses_per_day=m.max_doses_per_day,
            weight_kg=m.weight_kg,
            dose_mg_per_kg=m.dose_mg_per_kg,
            notes=m.notes,
            reminders_enabled=m.reminders_enabled,
            reminder_before_minutes=m.reminder_before_minutes,
            notify_at_due=m.notify_at_due,
            last_before_notification_for_at=m.last_before_notification_for_at,
            last_due_notification_for_at=m.last_due_notification_for_at,
            last_overdue_notification_for_at=m.last_overdue_notification_for_at,
            created_at=m.created_at,
        )

    def _to_model(self, e: EpisodeMedicationPlan) -> EpisodeMedicationPlanModel:
        return EpisodeMedicationPlanModel(
            id=e.id,
            episode_id=e.episode_id,
            household_medicine_id=e.household_medicine_id,
            custom_medicine_name=e.custom_medicine_name,
            dose_amount=e.dose_amount,
            min_interval_minutes=e.min_interval_minutes,
            max_doses_per_day=e.max_doses_per_day,
            weight_kg=e.weight_kg,
            dose_mg_per_kg=e.dose_mg_per_kg,
            notes=e.notes,
            reminders_enabled=e.reminders_enabled,
            reminder_before_minutes=e.reminder_before_minutes,
            notify_at_due=e.notify_at_due,
            last_before_notification_for_at=e.last_before_notification_for_at,
            last_due_notification_for_at=e.last_due_notification_for_at,
            last_overdue_notification_for_at=e.last_overdue_notification_for_at,
            created_at=e.created_at,
        )

    async def get_by_id(self, id: UUID) -> EpisodeMedicationPlan | None:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(EpisodeMedicationPlanModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_episode_id(self, episode_id: UUID) -> list[EpisodeMedicationPlan]:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel)
            .where(EpisodeMedicationPlanModel.episode_id == episode_id)
            .order_by(EpisodeMedicationPlanModel.created_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_by_episode_and_medicine(
        self, episode_id: UUID, household_medicine_id: UUID
    ) -> EpisodeMedicationPlan | None:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(
                EpisodeMedicationPlanModel.episode_id == episode_id,
                EpisodeMedicationPlanModel.household_medicine_id == household_medicine_id,
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlan:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlan:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(EpisodeMedicationPlanModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"EpisodeMedicationPlan {entity.id} not found")
        row.household_medicine_id = entity.household_medicine_id
        row.custom_medicine_name = entity.custom_medicine_name
        row.dose_amount = entity.dose_amount
        row.min_interval_minutes = entity.min_interval_minutes
        row.max_doses_per_day = entity.max_doses_per_day
        row.weight_kg = entity.weight_kg
        row.dose_mg_per_kg = entity.dose_mg_per_kg
        row.notes = entity.notes
        row.reminders_enabled = entity.reminders_enabled
        row.reminder_before_minutes = entity.reminder_before_minutes
        row.notify_at_due = entity.notify_at_due
        row.last_before_notification_for_at = entity.last_before_notification_for_at
        row.last_due_notification_for_at = entity.last_due_notification_for_at
        row.last_overdue_notification_for_at = entity.last_overdue_notification_for_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def get_for_push_notifications(self) -> list[EpisodeMedicationPlan]:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).order_by(EpisodeMedicationPlanModel.created_at.desc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def update_notification_marks(
        self,
        entity: EpisodeMedicationPlan,
    ) -> EpisodeMedicationPlan:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(EpisodeMedicationPlanModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"EpisodeMedicationPlan {entity.id} not found")
        row.last_before_notification_for_at = entity.last_before_notification_for_at
        row.last_due_notification_for_at = entity.last_due_notification_for_at
        row.last_overdue_notification_for_at = entity.last_overdue_notification_for_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(EpisodeMedicationPlanModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False

    async def clear_household_medicine_references(
        self,
        household_medicine_id: UUID,
        fallback_medicine_name: str,
    ) -> None:
        result = await self._session.execute(
            select(EpisodeMedicationPlanModel).where(
                EpisodeMedicationPlanModel.household_medicine_id == household_medicine_id
            )
        )
        rows = result.scalars().all()
        for row in rows:
            row.household_medicine_id = None
            if not (row.custom_medicine_name or "").strip():
                row.custom_medicine_name = fallback_medicine_name
        if rows:
            await self._session.flush()
