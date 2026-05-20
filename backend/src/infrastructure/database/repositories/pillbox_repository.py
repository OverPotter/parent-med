"""Реализация репозитория семейной таблетницы."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.entities.pillbox import PillboxDoseLog, PillboxMedication, PillboxPlan
from src.domain.repositories.pillbox_repository import PillboxRepository
from src.infrastructure.database.models.pillbox import (
    PillboxDoseLogModel,
    PillboxMedicationModel,
    PillboxPlanModel,
)


class SqlPillboxRepository(PillboxRepository):
    """Репозиторий family-level pillbox plans."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_dose_log_entity(self, model: PillboxDoseLogModel) -> PillboxDoseLog:
        return PillboxDoseLog(
            id=model.id,
            family_id=model.family_id,
            plan_id=model.plan_id,
            medication_id=model.medication_id,
            scheduled_for=model.scheduled_for,
            taken_at=model.taken_at,
            taken_by_account_id=model.taken_by_account_id,
            taken_by_name_snapshot=model.taken_by_name_snapshot,
            amount_snapshot=model.amount_snapshot,
            source=model.source,
            notes=model.notes,
            created_at=model.created_at,
        )

    def _to_medication_entity(self, model: PillboxMedicationModel) -> PillboxMedication:
        return PillboxMedication(
            id=model.id,
            plan_id=model.plan_id,
            household_medicine_id=model.household_medicine_id,
            custom_medicine_name=model.custom_medicine_name,
            dose_amount=model.dose_amount,
            meal_rule=model.meal_rule,
            repeat_days=list(model.repeat_days or []),
            times=list(model.times or []),
            course_mode=model.course_mode,
            course_start_date=model.course_start_date,
            course_end_date=model.course_end_date,
            position=model.position,
            created_at=model.created_at,
            updated_at=model.updated_at,
            dose_logs=[self._to_dose_log_entity(item) for item in model.dose_logs],
        )

    def _to_plan_entity(self, model: PillboxPlanModel) -> PillboxPlan:
        medications = [self._to_medication_entity(item) for item in model.medications]
        return PillboxPlan(
            id=model.id,
            family_id=model.family_id,
            title=model.title,
            status=model.status,
            subject_account_id=model.subject_account_id,
            member_account_ids=list(model.member_account_ids or []),
            created_by_account_id=model.created_by_account_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            medications=medications,
            dose_logs=[self._to_dose_log_entity(item) for item in model.dose_logs],
        )

    async def _get_model(self, id: UUID) -> PillboxPlanModel | None:
        result = await self._session.execute(
            select(PillboxPlanModel)
            .where(PillboxPlanModel.id == id)
            .options(
                selectinload(PillboxPlanModel.medications).selectinload(
                    PillboxMedicationModel.dose_logs
                ),
                selectinload(PillboxPlanModel.dose_logs),
            )
        )
        return result.scalars().one_or_none()

    async def list_by_family_id(self, family_id: UUID) -> list[PillboxPlan]:
        result = await self._session.execute(
            select(PillboxPlanModel)
            .where(PillboxPlanModel.family_id == family_id)
            .options(
                selectinload(PillboxPlanModel.medications).selectinload(
                    PillboxMedicationModel.dose_logs
                ),
                selectinload(PillboxPlanModel.dose_logs),
            )
            .order_by(PillboxPlanModel.updated_at.desc(), PillboxPlanModel.created_at.desc())
        )
        return [self._to_plan_entity(row) for row in result.scalars().all()]

    async def get_by_id(self, id: UUID) -> PillboxPlan | None:
        model = await self._get_model(id)
        return self._to_plan_entity(model) if model else None

    async def add(self, entity: PillboxPlan) -> PillboxPlan:
        model = PillboxPlanModel(
            id=entity.id,
            family_id=entity.family_id,
            title=entity.title,
            status=entity.status,
            subject_account_id=entity.subject_account_id,
            member_account_ids=list(entity.member_account_ids),
            created_by_account_id=entity.created_by_account_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            medications=[
                PillboxMedicationModel(
                    id=item.id,
                    plan_id=entity.id,
                    household_medicine_id=item.household_medicine_id,
                    custom_medicine_name=item.custom_medicine_name,
                    dose_amount=item.dose_amount,
                    meal_rule=item.meal_rule,
                    repeat_days=list(item.repeat_days),
                    times=list(item.times),
                    course_mode=item.course_mode,
                    course_start_date=item.course_start_date,
                    course_end_date=item.course_end_date,
                    position=item.position,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
                for item in entity.medications
            ],
        )
        self._session.add(model)
        await self._session.flush()
        reloaded = await self._get_model(model.id)
        if not reloaded:
            raise ValueError(f"PillboxPlan {model.id} not found after insert")
        return self._to_plan_entity(reloaded)

    async def update(self, entity: PillboxPlan) -> PillboxPlan:
        model = await self._get_model(entity.id)
        if not model:
            raise ValueError(f"PillboxPlan {entity.id} not found")

        model.title = entity.title
        model.status = entity.status
        model.subject_account_id = entity.subject_account_id
        model.member_account_ids = list(entity.member_account_ids)
        model.updated_at = entity.updated_at
        existing_by_id = {item.id: item for item in model.medications}
        incoming_ids = {item.id for item in entity.medications}

        for existing in list(model.medications):
            if existing.id not in incoming_ids:
                model.medications.remove(existing)

        for item in entity.medications:
            existing = existing_by_id.get(item.id)
            if existing:
                existing.household_medicine_id = item.household_medicine_id
                existing.custom_medicine_name = item.custom_medicine_name
                existing.dose_amount = item.dose_amount
                existing.meal_rule = item.meal_rule
                existing.repeat_days = list(item.repeat_days)
                existing.times = list(item.times)
                existing.course_mode = item.course_mode
                existing.course_start_date = item.course_start_date
                existing.course_end_date = item.course_end_date
                existing.position = item.position
                existing.updated_at = item.updated_at
                continue

            model.medications.append(
                PillboxMedicationModel(
                    id=item.id,
                    plan_id=entity.id,
                    household_medicine_id=item.household_medicine_id,
                    custom_medicine_name=item.custom_medicine_name,
                    dose_amount=item.dose_amount,
                    meal_rule=item.meal_rule,
                    repeat_days=list(item.repeat_days),
                    times=list(item.times),
                    course_mode=item.course_mode,
                    course_start_date=item.course_start_date,
                    course_end_date=item.course_end_date,
                    position=item.position,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )
        await self._session.flush()
        reloaded = await self._get_model(entity.id)
        if not reloaded:
            raise ValueError(f"PillboxPlan {entity.id} not found after update")
        return self._to_plan_entity(reloaded)

    async def delete(self, id: UUID) -> bool:
        model = await self._get_model(id)
        if not model:
            return False
        await self._session.delete(model)
        await self._session.flush()
        return True

    async def add_dose_log(self, entity: PillboxDoseLog) -> PillboxDoseLog:
        model = PillboxDoseLogModel(
            id=entity.id,
            family_id=entity.family_id,
            plan_id=entity.plan_id,
            medication_id=entity.medication_id,
            scheduled_for=entity.scheduled_for,
            taken_at=entity.taken_at,
            taken_by_account_id=entity.taken_by_account_id,
            taken_by_name_snapshot=entity.taken_by_name_snapshot,
            amount_snapshot=entity.amount_snapshot,
            source=entity.source,
            notes=entity.notes,
            created_at=entity.created_at,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_dose_log_entity(model)
