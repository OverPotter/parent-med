"""Сервис семейной таблетницы."""

from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from src.application.dto.pillbox import (
    PillboxDoseLogCreateDto,
    PillboxMedicationResponseDto,
    PillboxMedicationWriteDto,
    PillboxPlanCreateDto,
    PillboxPlanResponseDto,
    PillboxPlanSummaryDto,
    PillboxPlanUpdateDto,
)
from src.core.config import settings
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.pillbox import PillboxDoseLog, PillboxMedication, PillboxPlan
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.pillbox_repository import PillboxRepository


class PillboxService:
    """CRUD и вычислительная логика семейной таблетницы."""

    def __init__(
        self,
        pillbox_repo: PillboxRepository,
        account_repo: AccountRepository,
        household_repo: HouseholdMedicineRepository,
    ) -> None:
        self._repo = pillbox_repo
        self._account_repo = account_repo
        self._household_repo = household_repo
        try:
            self._timezone = ZoneInfo(settings.app_timezone)
        except Exception:  # pragma: no cover - defensive fallback for broken timezone config
            self._timezone = ZoneInfo("UTC")

    def _to_local(self, value: datetime) -> datetime:
        return value.astimezone(self._timezone)

    def _format_course_day_label(self, current_day: int, total_days: int, language: str) -> str:
        if language == "en":
            return f"Day {current_day} of {total_days}"
        return f"День {current_day} из {total_days}"

    def _build_local_scheduled_at(self, target_day: date, dose_time: time) -> datetime:
        return datetime.combine(target_day, dose_time, tzinfo=self._timezone)

    def _to_medication_response(self, entity: PillboxMedication) -> PillboxMedicationResponseDto:
        return PillboxMedicationResponseDto(
            id=entity.id,
            household_medicine_id=entity.household_medicine_id,
            custom_medicine_name=entity.custom_medicine_name,
            dose_amount=entity.dose_amount,
            meal_rule=entity.meal_rule,
            repeat_days=list(entity.repeat_days),
            times=list(entity.times),
            course_mode=entity.course_mode,
            course_start_date=entity.course_start_date,
            course_end_date=entity.course_end_date,
            position=entity.position,
        )

    def _is_medication_active_on(self, medication: PillboxMedication, day: date) -> bool:
        if medication.course_mode == "continuous":
            return True
        if not medication.course_start_date or not medication.course_end_date:
            return False
        return medication.course_start_date <= day <= medication.course_end_date

    def _format_next_dose_label(self, dose_at: datetime, now: datetime) -> str:
        local_now = self._to_local(now)
        local_dose_at = self._to_local(dose_at)
        local_today = local_now.date()
        local_target = local_dose_at.date()
        time_label = local_dose_at.strftime("%H:%M")
        if local_target == local_today:
            return time_label
        return local_dose_at.strftime("%d.%m · %H:%M")

    def _is_candidate_already_taken(
        self,
        plan: PillboxPlan,
        medication: PillboxMedication,
        scheduled_for: datetime,
    ) -> bool:
        if any(
            dose_log.scheduled_for == scheduled_for
            for dose_log in medication.dose_logs
            if dose_log.scheduled_for is not None
        ):
            return True

        return any(
            dose_log.medication_id == medication.id and dose_log.scheduled_for == scheduled_for
            for dose_log in plan.dose_logs
            if dose_log.scheduled_for is not None
        )

    def _is_valid_scheduled_slot(
        self, medication: PillboxMedication, scheduled_for: datetime
    ) -> bool:
        local_scheduled_for = self._to_local(scheduled_for)
        target_day = local_scheduled_for.date()
        return (
            self._is_medication_active_on(medication, target_day)
            and local_scheduled_for.isoweekday() in medication.repeat_days
            and local_scheduled_for.timetz().replace(tzinfo=None) in medication.times
        )

    def _get_next_dose_details(
        self, plan: PillboxPlan, now: datetime
    ) -> tuple[datetime | None, PillboxMedication | None]:
        candidates: list[tuple[datetime, PillboxMedication]] = []
        local_now = self._to_local(now)
        for offset in range(0, 21):
            target_day = (local_now + timedelta(days=offset)).date()
            weekday = target_day.isoweekday()
            for medication in plan.medications:
                if not self._is_medication_active_on(medication, target_day):
                    continue
                if weekday not in medication.repeat_days:
                    continue
                for dose_time in medication.times:
                    candidate = self._build_local_scheduled_at(target_day, dose_time).astimezone(
                        UTC
                    )
                    if self._is_candidate_already_taken(plan, medication, candidate):
                        continue
                    if offset == 0 or candidate >= now:
                        candidates.append((candidate, medication))
            if candidates:
                break
        if not candidates:
            return None, None
        next_dose_at, medication = min(candidates, key=lambda item: item[0])
        return next_dose_at, medication

    def _get_course_progress(
        self, plan: PillboxPlan, language: str
    ) -> tuple[str | None, float | None, str | None]:
        today = datetime.now(UTC).astimezone(self._timezone).date()
        continuous_medications = [
            item for item in plan.medications if item.course_mode == "continuous"
        ]
        period_medications = [
            item
            for item in sorted(plan.medications, key=lambda medication: medication.position)
            if item.course_mode == "period" and item.course_start_date and item.course_end_date
        ]
        if period_medications and continuous_medications:
            return "mixed", None, None
        if continuous_medications:
            return "continuous", None, None
        if not period_medications:
            return None, None, None
        item = period_medications[0]
        assert item.course_start_date is not None
        assert item.course_end_date is not None
        total_days = (item.course_end_date - item.course_start_date).days + 1
        if total_days <= 0:
            return "period", None, None
        if today < item.course_start_date:
            current_day = 1
        elif today > item.course_end_date:
            current_day = total_days
        else:
            current_day = (today - item.course_start_date).days + 1
        return (
            "period",
            current_day / total_days,
            self._format_course_day_label(current_day, total_days, language),
        )

    def _to_summary_response(
        self,
        entity: PillboxPlan,
        language: str = "ru",
    ) -> PillboxPlanSummaryDto:
        now = datetime.now(UTC)
        next_dose_at, next_medication = self._get_next_dose_details(entity, now)
        course_summary_kind, course_progress_ratio, course_day_label = self._get_course_progress(
            entity, language
        )
        next_medication_title = None
        if next_medication:
            medication_name = (next_medication.custom_medicine_name or "").strip() or (
                "Medicine" if language == "en" else "Лекарство"
            )
            dose_amount = next_medication.dose_amount.strip()
            next_medication_title = (
                f"{medication_name} · {dose_amount}" if dose_amount else medication_name
            )
        return PillboxPlanSummaryDto(
            id=entity.id,
            title=entity.title,
            status=entity.status,
            member_account_ids=list(entity.member_account_ids),
            active_medication_count=len(entity.medications),
            next_dose_at=next_dose_at,
            next_dose_label=(
                self._format_next_dose_label(next_dose_at, now) if next_dose_at else None
            ),
            next_medication_id=next_medication.id if next_medication else None,
            next_medication_title=next_medication_title,
            course_summary_kind=course_summary_kind,
            course_progress_ratio=course_progress_ratio,
            course_day_label=course_day_label,
        )

    def _to_plan_response(self, entity: PillboxPlan) -> PillboxPlanResponseDto:
        return PillboxPlanResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            title=entity.title,
            status=entity.status,
            member_account_ids=list(entity.member_account_ids),
            medications=[self._to_medication_response(item) for item in entity.medications],
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def _require_member_ids_in_family(
        self, member_ids: list[UUID], current_family_id: UUID
    ) -> list[UUID]:
        family_accounts = await self._account_repo.list_by_family_id(current_family_id)
        family_account_ids = {account.id for account in family_accounts}
        invalid = [member_id for member_id in member_ids if member_id not in family_account_ids]
        if invalid:
            raise ValidationError("В плане есть участники не из текущей семьи")
        return member_ids

    async def _validate_household_medicine(
        self, household_medicine_id: UUID, current_family_id: UUID
    ) -> None:
        medicine = await self._household_repo.get_by_id(household_medicine_id)
        if not medicine:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if medicine.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к упаковке из другой семьи")

    async def _normalize_medication_write(
        self,
        dto: PillboxMedicationWriteDto,
        plan_id: UUID,
        current_family_id: UUID,
        position: int,
    ) -> PillboxMedication:
        custom_name = (dto.custom_medicine_name or "").strip() or None
        dose_amount = dto.dose_amount.strip()
        if not dto.household_medicine_id and not custom_name:
            raise ValidationError("Выберите лекарство из аптечки или введите название вручную")
        if dto.household_medicine_id:
            await self._validate_household_medicine(dto.household_medicine_id, current_family_id)
        if not dto.times:
            raise ValidationError("Укажите хотя бы одно время приёма")
        times = sorted({value for value in dto.times})
        if not times:
            raise ValidationError("Укажите хотя бы одно время приёма")
        repeat_days = sorted(set(dto.repeat_days))
        if not repeat_days:
            raise ValidationError("Выберите хотя бы один день недели")
        if any(day < 1 or day > 7 for day in repeat_days):
            raise ValidationError("Дни недели должны быть в диапазоне 1..7")
        if dto.meal_rule not in {"before_meal", "with_meal", "after_meal"}:
            raise ValidationError("Некорректное правило приёма относительно еды")
        if dto.course_mode not in {"continuous", "period"}:
            raise ValidationError("Некорректный режим курса")
        if dto.course_mode == "period":
            if not dto.course_start_date or not dto.course_end_date:
                raise ValidationError("Для курса укажи дату начала и окончания")
            if dto.course_end_date < dto.course_start_date:
                raise ValidationError("Дата окончания не может быть раньше даты начала")
        created_at = datetime.now(UTC)
        return PillboxMedication(
            id=dto.id or uuid4(),
            plan_id=plan_id,
            household_medicine_id=dto.household_medicine_id,
            custom_medicine_name=custom_name,
            dose_amount=dose_amount,
            meal_rule=dto.meal_rule,
            repeat_days=repeat_days,
            times=times,
            course_mode=dto.course_mode,
            course_start_date=dto.course_start_date if dto.course_mode == "period" else None,
            course_end_date=dto.course_end_date if dto.course_mode == "period" else None,
            position=position,
            created_at=created_at,
            updated_at=created_at,
        )

    async def _build_plan_entity(
        self,
        *,
        existing: PillboxPlan | None,
        title: str,
        status: str,
        member_account_ids: list[UUID],
        medications: list[PillboxMedicationWriteDto],
        current_account_id: UUID,
        current_family_id: UUID,
    ) -> PillboxPlan:
        normalized_title = title.strip() or "Новый план"
        await self._require_member_ids_in_family(member_account_ids, current_family_id)
        if not medications:
            raise ValidationError("В плане должно быть хотя бы одно лекарство")

        plan_id = existing.id if existing else uuid4()
        medication_entities: list[PillboxMedication] = []
        existing_by_id = {item.id: item for item in (existing.medications if existing else [])}
        for index, medication in enumerate(medications):
            entity = await self._normalize_medication_write(
                medication, plan_id, current_family_id, index
            )
            previous = existing_by_id.get(entity.id)
            if previous:
                entity = replace(entity, created_at=previous.created_at)
            medication_entities.append(entity)
        now = datetime.now(UTC)
        return PillboxPlan(
            id=plan_id,
            family_id=current_family_id,
            title=normalized_title,
            status=status,
            member_account_ids=member_account_ids,
            created_by_account_id=(
                existing.created_by_account_id if existing else current_account_id
            ),
            created_at=existing.created_at if existing else now,
            updated_at=now,
            medications=medication_entities,
        )

    async def _get_plan_for_family(self, plan_id: UUID, current_family_id: UUID) -> PillboxPlan:
        plan = await self._repo.get_by_id(plan_id)
        if not plan:
            raise NotFoundError("План таблетницы не найден", resource="pillbox_plan")
        if plan.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к плану другой семьи")
        return plan

    async def list_by_family_id(
        self, current_family_id: UUID, preferred_language: str = "ru"
    ) -> list[PillboxPlanSummaryDto]:
        entities = await self._repo.list_by_family_id(current_family_id)
        return [self._to_summary_response(entity, preferred_language) for entity in entities]

    async def get_by_id(self, plan_id: UUID, current_family_id: UUID) -> PillboxPlanResponseDto:
        entity = await self._get_plan_for_family(plan_id, current_family_id)
        return self._to_plan_response(entity)

    async def create(
        self,
        dto: PillboxPlanCreateDto,
        current_account_id: UUID,
        current_family_id: UUID,
    ) -> PillboxPlanResponseDto:
        entity = await self._build_plan_entity(
            existing=None,
            title=dto.title,
            status="active",
            member_account_ids=list(dto.member_account_ids),
            medications=list(dto.medications),
            current_account_id=current_account_id,
            current_family_id=current_family_id,
        )
        created = await self._repo.add(entity)
        return self._to_plan_response(created)

    async def update(
        self,
        plan_id: UUID,
        dto: PillboxPlanUpdateDto,
        current_account_id: UUID,
        current_family_id: UUID,
    ) -> PillboxPlanResponseDto:
        existing = await self._get_plan_for_family(plan_id, current_family_id)
        next_status = dto.status or existing.status
        if next_status not in {"active", "paused", "archived"}:
            raise ValidationError("Некорректный статус плана")
        entity = await self._build_plan_entity(
            existing=existing,
            title=dto.title,
            status=next_status,
            member_account_ids=list(dto.member_account_ids),
            medications=list(dto.medications),
            current_account_id=current_account_id,
            current_family_id=current_family_id,
        )
        updated = await self._repo.update(entity)
        return self._to_plan_response(updated)

    async def delete(self, plan_id: UUID, current_family_id: UUID) -> None:
        await self._get_plan_for_family(plan_id, current_family_id)
        await self._repo.delete(plan_id)

    async def log_dose(
        self,
        plan_id: UUID,
        medication_id: UUID,
        dto: PillboxDoseLogCreateDto,
        current_account_id: UUID,
        current_account_display_name: str,
        current_family_id: UUID,
        preferred_language: str = "ru",
    ) -> PillboxPlanSummaryDto:
        plan = await self._get_plan_for_family(plan_id, current_family_id)
        medication = next((item for item in plan.medications if item.id == medication_id), None)
        if not medication:
            raise NotFoundError("Лекарство внутри плана не найдено", resource="pillbox_medication")
        scheduled_for = dto.scheduled_for
        now = datetime.now(UTC)
        if scheduled_for is None:
            raise ValidationError("Для подтверждения приёма нужен конкретный слот")
        if scheduled_for.tzinfo is None:
            scheduled_for = scheduled_for.replace(tzinfo=UTC)
        if not self._is_valid_scheduled_slot(medication, scheduled_for):
            raise ValidationError("Нельзя отметить приём для несуществующего слота")
        if scheduled_for > now:
            raise ValidationError("Нельзя отметить приём заранее")
        if self._is_candidate_already_taken(plan, medication, scheduled_for):
            raise ValidationError("Этот приём уже отмечен")
        await self._repo.add_dose_log(
            PillboxDoseLog(
                id=uuid4(),
                family_id=current_family_id,
                plan_id=plan.id,
                medication_id=medication.id,
                scheduled_for=scheduled_for,
                taken_at=dto.taken_at or now,
                taken_by_account_id=current_account_id,
                taken_by_name_snapshot=current_account_display_name,
                amount_snapshot=medication.dose_amount,
                source=dto.source,
                notes=(dto.notes or "").strip() or None,
                created_at=now,
            )
        )
        refreshed = await self._get_plan_for_family(plan_id, current_family_id)
        return self._to_summary_response(refreshed, preferred_language)
