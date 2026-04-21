"""DTO для guided-планов лекарства внутри эпизода."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class EpisodeMedicationPlanCreateDto(BaseModel):
    """Создание guided-плана лекарства."""

    episode_id: UUID = Field(..., description="ID эпизода болезни")
    household_medicine_id: UUID | None = Field(None, description="ID упаковки из аптечки")
    custom_medicine_name: str | None = Field(None, description="Свободное название лекарства")
    dose_amount: str = Field(..., description="Разовая доза, напр. 5 мл")
    min_interval_minutes: int = Field(
        ..., ge=1, le=1440, description="Минимальный интервал в минутах"
    )
    max_doses_per_day: int | None = Field(
        None, ge=1, le=24, description="Максимум приёмов за сутки"
    )
    weight_kg: float | None = Field(None, ge=0.1, le=200, description="Вес ребёнка на момент плана")
    dose_mg_per_kg: float | None = Field(None, ge=0.1, le=100, description="Расчётная доза в мг/кг")
    notes: str | None = Field(None, description="Комментарий к схеме")
    member_account_ids: list[UUID] = Field(
        default_factory=list,
        description="Кому отправлять напоминания по схеме",
    )


class EpisodeMedicationPlanUpdateDto(BaseModel):
    """Обновление guided-плана лекарства."""

    household_medicine_id: UUID | None = Field(None, description="ID упаковки из аптечки")
    custom_medicine_name: str | None = Field(None, description="Свободное название лекарства")
    dose_amount: str | None = Field(None, description="Разовая доза, напр. 5 мл")
    min_interval_minutes: int | None = Field(
        None, ge=1, le=1440, description="Минимальный интервал в минутах"
    )
    max_doses_per_day: int | None = Field(
        None, ge=1, le=24, description="Максимум приёмов за сутки"
    )
    weight_kg: float | None = Field(None, ge=0.1, le=200, description="Вес ребёнка на момент плана")
    dose_mg_per_kg: float | None = Field(None, ge=0.1, le=100, description="Расчётная доза в мг/кг")
    notes: str | None = Field(None, description="Комментарий к схеме")
    member_account_ids: list[UUID] | None = Field(
        None,
        description="Кому отправлять напоминания по схеме",
    )


class EpisodeMedicationPlanResponseDto(ResponseBase):
    """Ответ: guided-план лекарства."""

    id: UUID
    episode_id: UUID
    household_medicine_id: UUID | None
    custom_medicine_name: str | None
    dose_amount: str
    min_interval_minutes: int
    max_doses_per_day: int | None
    weight_kg: float | None
    dose_mg_per_kg: float | None
    notes: str | None
    member_account_ids: list[UUID]
    created_at: datetime
