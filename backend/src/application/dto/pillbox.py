"""DTO семейной таблетницы."""

from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class PillboxMedicationWriteDto(BaseModel):
    """Лекарство внутри create/update payload таблеткицы."""

    id: UUID | None = Field(None, description="ID лекарства внутри плана, если уже существует")
    household_medicine_id: UUID | None = Field(None, description="ID упаковки из аптечки")
    custom_medicine_name: str | None = Field(None, description="Ручное название лекарства")
    dose_amount: str = Field(..., description="Например, 1 таблетка")
    meal_rule: str = Field(..., description="before_meal | with_meal | after_meal")
    repeat_days: list[int] = Field(..., description="ISO weekdays 1..7")
    times: list[time] = Field(..., description="Времена приёма")
    course_mode: str = Field(..., description="continuous | period")
    course_start_date: date | None = None
    course_end_date: date | None = None
    position: int = Field(..., ge=0, description="Порядок в UI")


class PillboxPlanCreateDto(BaseModel):
    """Создание семейного плана таблетницы."""

    title: str = Field(..., description="Название плана")
    member_account_ids: list[UUID] = Field(
        default_factory=list,
        description="Кому идут напоминания",
    )
    medications: list[PillboxMedicationWriteDto] = Field(
        default_factory=list, description="Полное содержимое плана"
    )


class PillboxPlanUpdateDto(BaseModel):
    """Обновление семейного плана таблетницы целиком."""

    title: str = Field(..., description="Название плана")
    member_account_ids: list[UUID] = Field(
        default_factory=list,
        description="Кому идут напоминания",
    )
    medications: list[PillboxMedicationWriteDto] = Field(
        default_factory=list, description="Полное содержимое плана"
    )
    status: str | None = Field(None, description="active | paused | archived")


class PillboxMedicationResponseDto(ResponseBase):
    """Лекарство внутри ответа плана таблетницы."""

    id: UUID
    household_medicine_id: UUID | None
    custom_medicine_name: str | None
    dose_amount: str
    meal_rule: str
    repeat_days: list[int]
    times: list[time]
    course_mode: str
    course_start_date: date | None
    course_end_date: date | None
    position: int


class PillboxPlanSummaryDto(ResponseBase):
    """Карточка плана на hub-экране таблетницы."""

    id: UUID
    title: str
    status: str
    member_account_ids: list[UUID]
    active_medication_count: int
    next_dose_at: datetime | None
    next_dose_label: str | None
    next_medication_id: UUID | None
    next_medication_title: str | None
    course_progress_ratio: float | None
    course_day_label: str | None


class PillboxPlanResponseDto(ResponseBase):
    """Полный ответ по плану таблетницы."""

    id: UUID
    family_id: UUID
    title: str
    status: str
    member_account_ids: list[UUID]
    medications: list[PillboxMedicationResponseDto]
    created_at: datetime
    updated_at: datetime


class PillboxDoseLogCreateDto(BaseModel):
    """Записать факт приёма по плану таблетницы."""

    taken_at: datetime | None = None
    source: str = Field("manual", description="manual | reminder")
    notes: str | None = None
