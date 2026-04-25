"""Сервис семейной таблетницы."""

from collections import defaultdict
from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.pillbox import (
    PillboxAnalyticsSeriesPointDto,
    PillboxDoseLogCreateDto,
    PillboxHistorySummaryDto,
    PillboxMedicationResponseDto,
    PillboxMedicationWriteDto,
    PillboxPlanCreateDto,
    PillboxPlanResponseDto,
    PillboxPlanSummaryDto,
    PillboxPlanUpdateDto,
    PillboxTopMedicationDto,
)
from src.application.services.access_control import ensure_children_edit_scope, ensure_module_access
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.core.config import settings
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.pillbox import PillboxDoseLog, PillboxMedication, PillboxPlan
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.pillbox_repository import PillboxRepository


class PillboxService:
    """CRUD и вычислительная логика семейной таблетницы."""

    _ON_TIME_WINDOW = timedelta(minutes=30)
    _LATE_WINDOW = timedelta(hours=4)

    def __init__(
        self,
        pillbox_repo: PillboxRepository,
        account_repo: AccountRepository,
        household_repo: HouseholdMedicineRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._repo = pillbox_repo
        self._account_repo = account_repo
        self._household_repo = household_repo
        self._family_repo = family_repo
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

    def _build_medication_slots(
        self,
        medication: PillboxMedication,
        start_day: date,
        end_day: date,
    ) -> list[datetime]:
        slots: list[datetime] = []
        day_cursor = start_day
        while day_cursor <= end_day:
            if (
                self._is_medication_active_on(medication, day_cursor)
                and day_cursor.isoweekday() in medication.repeat_days
            ):
                for dose_time in medication.times:
                    local_scheduled_for = self._build_local_scheduled_at(day_cursor, dose_time)
                    slots.append(local_scheduled_for.astimezone(UTC))
            day_cursor += timedelta(days=1)
        return sorted(slots)

    def _get_slot_deadline(
        self,
        scheduled_for: datetime,
        next_scheduled_for: datetime | None,
    ) -> datetime:
        late_deadline = scheduled_for + self._LATE_WINDOW
        if next_scheduled_for is None:
            return late_deadline
        return min(late_deadline, next_scheduled_for)

    def _get_next_dose_details(
        self, plan: PillboxPlan, now: datetime
    ) -> tuple[datetime | None, PillboxMedication | None]:
        local_now = self._to_local(now)
        start_day = local_now.date()
        end_day = (local_now + timedelta(days=21)).date()

        actionable: list[tuple[datetime, PillboxMedication]] = []
        for medication in plan.medications:
            slots = self._build_medication_slots(medication, start_day, end_day)
            for index, scheduled_for in enumerate(slots):
                if self._is_candidate_already_taken(plan, medication, scheduled_for):
                    continue
                next_scheduled_for = slots[index + 1] if index + 1 < len(slots) else None
                deadline = self._get_slot_deadline(scheduled_for, next_scheduled_for)
                if now > deadline:
                    continue
                actionable.append((scheduled_for, medication))

        if not actionable:
            return None, None
        return min(actionable, key=lambda item: item[0])

    def _get_effective_status(self, plan: PillboxPlan) -> str:
        if plan.status != "active":
            return plan.status

        period_medications = [item for item in plan.medications if item.course_mode == "period"]
        if not period_medications:
            return "active"

        if any(item.course_mode == "continuous" for item in plan.medications):
            return "active"

        if any(
            not item.course_start_date or not item.course_end_date for item in period_medications
        ):
            return "active"

        now = datetime.now(UTC)
        today = now.astimezone(self._timezone).date()
        if all(
            item.course_end_date is not None and item.course_end_date <= today
            for item in period_medications
        ):
            next_dose_at, _ = self._get_next_dose_details(plan, now)
            if next_dose_at is None:
                return "completed"

        return "active"

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
        effective_status = self._get_effective_status(entity)
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
            status=effective_status,
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
            status=self._get_effective_status(entity),
            member_account_ids=list(entity.member_account_ids),
            medications=[self._to_medication_response(item) for item in entity.medications],
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def _require_member_ids_in_family(
        self, member_ids: list[UUID], current_family_id: UUID, current_account_id: UUID
    ) -> list[UUID]:
        family_accounts = await self._account_repo.list_by_family_id(current_family_id)
        family_account_ids = {account.id for account in family_accounts}
        normalized_member_ids = list(member_ids)
        invalid = [
            member_id for member_id in normalized_member_ids if member_id not in family_account_ids
        ]
        if invalid:
            raise ValidationError("В плане есть участники не из текущей семьи")
        eligible_account_ids = {
            account.id
            for account in family_accounts
            if getattr(getattr(account, "access_policy", None), "pillbox_access", "none") != "none"
        }
        if not normalized_member_ids:
            if current_account_id in eligible_account_ids:
                return [current_account_id]
            raise ValidationError("В плане должен быть хотя бы один получатель")
        ineligible = [
            member_id
            for member_id in normalized_member_ids
            if member_id not in eligible_account_ids
        ]
        if ineligible:
            raise ValidationError("Нельзя выбрать получателей без доступа к приёмам")
        return normalized_member_ids

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
        normalized_member_account_ids = await self._require_member_ids_in_family(
            member_account_ids,
            current_family_id,
            current_account_id,
        )
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
            member_account_ids=normalized_member_account_ids,
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
        self,
        current_account: AuthenticatedAccount,
        preferred_language: str = "ru",
    ) -> list[PillboxPlanSummaryDto]:
        ensure_module_access(current_account, "pillbox", "view")
        entities = await self._repo.list_by_family_id(current_account.family_id)
        return [self._to_summary_response(entity, preferred_language) for entity in entities]

    async def get_by_id(
        self,
        plan_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> PillboxPlanResponseDto:
        ensure_module_access(current_account, "pillbox", "view")
        entity = await self._get_plan_for_family(plan_id, current_account.family_id)
        return self._to_plan_response(entity)

    def _normalize_period(self, period: str) -> str:
        normalized_period = period.strip().lower()
        if normalized_period not in {"month", "quarter", "half_year", "year", "all"}:
            raise ValidationError("Неизвестный период аналитики")
        return normalized_period

    def _month_label(self, value: date, language: str) -> str:
        months_ru = [
            "янв",
            "фев",
            "мар",
            "апр",
            "май",
            "июн",
            "июл",
            "авг",
            "сен",
            "окт",
            "ноя",
            "дек",
        ]
        months_en = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        month_name = months_en[value.month - 1] if language == "en" else months_ru[value.month - 1]
        year_short = str(value.year)[-2:]
        return f"{month_name} {year_short}"

    def _resolve_period_start_date(
        self,
        period: str,
        plans: list[PillboxPlan],
        today_local: date,
    ) -> date:
        if period != "all":
            days_by_period = {
                "month": 30,
                "quarter": 90,
                "half_year": 180,
                "year": 365,
            }
            return today_local - timedelta(days=days_by_period[period] - 1)

        candidates: list[date] = []
        for plan in plans:
            candidates.append(self._to_local(plan.created_at).date())
            for log in plan.dose_logs:
                if log.scheduled_for:
                    candidates.append(self._to_local(log.scheduled_for).date())
                candidates.append(self._to_local(log.taken_at).date())
        if not candidates:
            return today_local - timedelta(days=29)
        return min(candidates)

    def _resolve_plan_analytics_bounds(self, plan: PillboxPlan) -> tuple[date | None, date | None]:
        period_medications = [
            item
            for item in plan.medications
            if item.course_mode == "period" and item.course_start_date and item.course_end_date
        ]
        if len(period_medications) != len(plan.medications) or not period_medications:
            return None, None

        starts = [item.course_start_date for item in period_medications if item.course_start_date]
        ends = [item.course_end_date for item in period_medications if item.course_end_date]
        if not starts or not ends:
            return None, None
        return min(starts), max(ends)

    def _build_timeline_labels(
        self,
        period: str,
        start_date: date,
        end_date: date,
        language: str,
    ) -> list[str]:
        if period == "month":
            week_count = ((end_date - start_date).days // 7) + 1
            if language == "en":
                return [f"W{k + 1}" for k in range(week_count)]
            return [f"Нед {k + 1}" for k in range(week_count)]

        labels: list[str] = []
        cursor = date(start_date.year, start_date.month, 1)
        last = date(end_date.year, end_date.month, 1)
        while cursor <= last:
            labels.append(self._month_label(cursor, language))
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)
        return labels

    def _timeline_bucket_label(
        self,
        period: str,
        slot_day: date,
        start_date: date,
        language: str,
    ) -> str:
        if period == "month":
            week_index = ((slot_day - start_date).days // 7) + 1
            return f"W{week_index}" if language == "en" else f"Нед {week_index}"
        return self._month_label(slot_day, language)

    async def get_plan_history_summary(
        self,
        plan_id: UUID,
        current_account: AuthenticatedAccount,
        period: str,
        preferred_language: str = "ru",
    ) -> PillboxHistorySummaryDto:
        ensure_module_access(current_account, "pillbox", "view")
        normalized_period = self._normalize_period(period)
        plan = await self._get_plan_for_family(plan_id, current_account.family_id)
        plans = [plan]
        now_utc = datetime.now(UTC)
        today_local = self._to_local(now_utc).date()
        plan_start_bound, plan_end_bound = self._resolve_plan_analytics_bounds(plan)
        start_date = self._resolve_period_start_date(normalized_period, plans, today_local)
        if plan_start_bound is not None:
            start_date = max(start_date, plan_start_bound)
        end_date = min(today_local, plan_end_bound) if plan_end_bound is not None else today_local
        if start_date > end_date:
            start_date = end_date
        timeline_labels = self._build_timeline_labels(
            normalized_period, start_date, end_date, preferred_language
        )
        timeline_counts: dict[str, int] = {label: 0 for label in timeline_labels}

        scheduled_slots = 0
        taken_slots = 0
        missed_slots = 0
        late_slots = 0
        on_time_slots = 0
        top_missed: dict[str, int] = defaultdict(int)
        total_medications = 0
        total_medications += len(plan.medications)

        logs_by_slot: dict[tuple[UUID, datetime], datetime] = {}
        period_start_utc = datetime.combine(
            start_date,
            time.min,
            tzinfo=self._timezone,
        ).astimezone(UTC)
        analytics_start_utc = max(period_start_utc, plan.created_at)
        for log in plan.dose_logs:
            if log.scheduled_for is None:
                continue
            if log.scheduled_for < analytics_start_utc:
                continue
            previous_taken_at = logs_by_slot.get((log.medication_id, log.scheduled_for))
            if previous_taken_at is None or log.taken_at < previous_taken_at:
                logs_by_slot[(log.medication_id, log.scheduled_for)] = log.taken_at

        for medication in plan.medications:
            slots = self._build_medication_slots(medication, start_date, end_date)
            for index, scheduled_for in enumerate(slots):
                if scheduled_for < analytics_start_utc:
                    continue
                if scheduled_for > now_utc:
                    continue
                next_scheduled_for = slots[index + 1] if index + 1 < len(slots) else None
                slot_deadline = self._get_slot_deadline(scheduled_for, next_scheduled_for)
                taken_at = logs_by_slot.get((medication.id, scheduled_for))
                is_finalized_slot = taken_at is not None or now_utc >= slot_deadline
                if not is_finalized_slot:
                    continue

                scheduled_slots += 1
                if taken_at is None:
                    missed_slots += 1
                    medicine_name = (medication.custom_medicine_name or "").strip() or (
                        "Medicine" if preferred_language == "en" else "Лекарство"
                    )
                    top_missed[medicine_name] += 1
                    continue

                delay = taken_at - scheduled_for
                if delay <= self._ON_TIME_WINDOW:
                    on_time_slots += 1
                    taken_slots += 1
                elif taken_at <= slot_deadline:
                    late_slots += 1
                    taken_slots += 1
                else:
                    missed_slots += 1
                    medicine_name = (medication.custom_medicine_name or "").strip() or (
                        "Medicine" if preferred_language == "en" else "Лекарство"
                    )
                    top_missed[medicine_name] += 1
                    continue

                slot_day = self._to_local(scheduled_for).date()
                bucket_label = self._timeline_bucket_label(
                    normalized_period,
                    slot_day,
                    start_date,
                    preferred_language,
                )
                if bucket_label in timeline_counts:
                    timeline_counts[bucket_label] += 1

        adherence_rate = round(taken_slots / scheduled_slots, 3) if scheduled_slots > 0 else 0.0
        on_time_rate = round(on_time_slots / taken_slots, 3) if taken_slots > 0 else 0.0
        top_missed_items = sorted(top_missed.items(), key=lambda item: item[1], reverse=True)[:3]

        return PillboxHistorySummaryDto(
            plan_id=str(plan.id),
            plan_title=plan.title,
            plan_status=self._get_effective_status(plan),
            member_count=len(plan.member_account_ids),
            period=normalized_period,
            total_medications=total_medications,
            scheduled_slots=scheduled_slots,
            taken_slots=taken_slots,
            missed_slots=missed_slots,
            late_slots=late_slots,
            on_time_slots=on_time_slots,
            adherence_rate=adherence_rate,
            on_time_rate=on_time_rate,
            timeline=[
                PillboxAnalyticsSeriesPointDto(label=label, value=timeline_counts[label])
                for label in timeline_labels
            ],
            top_missed_medications=[
                PillboxTopMedicationDto(medication_name=name, missed_slots=count)
                for name, count in top_missed_items
            ],
        )

    async def create(
        self,
        dto: PillboxPlanCreateDto,
        current_account_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> PillboxPlanResponseDto:
        ensure_module_access(current_account, "pillbox", "edit")
        ensure_children_edit_scope(current_account, "приёмов")
        family = await self._family_repo.get_by_id(current_account.family_id)
        if family is None:
            raise NotFoundError("Семья не найдена", resource="family")
        policy = resolve_family_plan_policy(family)
        existing_plans = await self._repo.list_by_family_id(current_account.family_id)
        if policy.max_pillbox_plans is not None and len(existing_plans) >= policy.max_pillbox_plans:
            raise ValidationError(
                "Во Free доступен только один план таблетницы. Перейдите на Plus, чтобы добавить ещё планы.",
                code="PLUS_REQUIRED_FOR_ADDITIONAL_PILLBOX_PLANS",
            )
        entity = await self._build_plan_entity(
            existing=None,
            title=dto.title,
            status="active",
            member_account_ids=list(dto.member_account_ids),
            medications=list(dto.medications),
            current_account_id=current_account_id,
            current_family_id=current_account.family_id,
        )
        created = await self._repo.add(entity)
        return self._to_plan_response(created)

    async def update(
        self,
        plan_id: UUID,
        dto: PillboxPlanUpdateDto,
        current_account_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> PillboxPlanResponseDto:
        ensure_module_access(current_account, "pillbox", "edit")
        ensure_children_edit_scope(current_account, "приёмов")
        existing = await self._get_plan_for_family(plan_id, current_account.family_id)
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
            current_family_id=current_account.family_id,
        )
        updated = await self._repo.update(entity)
        return self._to_plan_response(updated)

    async def delete(self, plan_id: UUID, current_account: AuthenticatedAccount) -> None:
        ensure_module_access(current_account, "pillbox", "edit")
        ensure_children_edit_scope(current_account, "приёмов")
        await self._get_plan_for_family(plan_id, current_account.family_id)
        await self._repo.delete(plan_id)

    async def log_dose(
        self,
        plan_id: UUID,
        medication_id: UUID,
        dto: PillboxDoseLogCreateDto,
        current_account_id: UUID,
        current_account_display_name: str,
        current_account: AuthenticatedAccount,
        preferred_language: str = "ru",
    ) -> PillboxPlanSummaryDto:
        ensure_module_access(current_account, "pillbox", "act")
        plan = await self._get_plan_for_family(plan_id, current_account.family_id)
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
                family_id=current_account.family_id,
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
        refreshed = await self._get_plan_for_family(plan_id, current_account.family_id)
        return self._to_summary_response(refreshed, preferred_language)
