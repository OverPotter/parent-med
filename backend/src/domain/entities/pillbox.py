"""Сущности семейной таблетницы."""

from dataclasses import dataclass, field
from datetime import date, datetime, time
from uuid import UUID

PillboxPlanStatus = str
PillboxMealRule = str
PillboxCourseMode = str


@dataclass
class PillboxMedication:
    """Лекарство внутри семейного плана таблетницы."""

    id: UUID
    plan_id: UUID
    household_medicine_id: UUID | None
    custom_medicine_name: str | None
    dose_amount: str
    meal_rule: PillboxMealRule
    repeat_days: list[int]
    times: list[time]
    course_mode: PillboxCourseMode
    course_start_date: date | None
    course_end_date: date | None
    position: int
    created_at: datetime
    updated_at: datetime
    dose_logs: list["PillboxDoseLog"] = field(default_factory=list)


@dataclass
class PillboxPlan:
    """Семейный план таблетницы."""

    id: UUID
    family_id: UUID
    title: str
    status: PillboxPlanStatus
    member_account_ids: list[UUID]
    created_by_account_id: UUID
    created_at: datetime
    updated_at: datetime
    medications: list[PillboxMedication]
    dose_logs: list["PillboxDoseLog"] = field(default_factory=list)
    subject_account_id: UUID | None = None


@dataclass
class PillboxDoseLog:
    """Факт приёма по плану таблетницы."""

    id: UUID
    family_id: UUID
    plan_id: UUID
    medication_id: UUID
    scheduled_for: datetime | None
    taken_at: datetime
    taken_by_account_id: UUID | None
    taken_by_name_snapshot: str | None
    amount_snapshot: str
    source: str
    notes: str | None
    created_at: datetime
