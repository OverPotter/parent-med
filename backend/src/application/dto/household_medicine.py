"""DTO для упаковки в аптечке."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from src.application.dto.base import ResponseBase


class HouseholdMedicineCreateDto(BaseModel):
    """Добавление упаковки в аптечку."""

    medicine_name: str | None = Field(None, description="Название препарата для своей аптечки")
    medicine_form: str | None = Field(None, description="Форма препарата")
    medicine_category: str | None = Field(None, description="Категория препарата для ручной записи")
    medicine_concentration: str | None = Field(None, description="Концентрация")
    medicine_description: str | None = Field(None, description="Описание препарата")
    medicine_dosage: str | None = Field(None, description="Как применять")
    pediatric_dose_mg_per_kg_min: float | None = Field(
        None, description="Нижняя граница типовой детской дозы в мг/кг на приём"
    )
    pediatric_dose_mg_per_kg_max: float | None = Field(
        None, description="Верхняя граница типовой детской дозы в мг/кг на приём"
    )
    pediatric_dose_note: str | None = Field(
        None, description="Короткая заметка к детской дозе"
    )
    expiry_date: date = Field(..., description="Срок годности")
    opened_at: datetime | None = Field(None, description="Дата вскрытия")
    opened_shelf_days: int | None = Field(
        None, ge=1, le=3650, description="Срок использования после вскрытия, дней"
    )
    comment: str | None = Field(None, description="Комментарий")

    @model_validator(mode="after")
    def validate_source(self) -> "HouseholdMedicineCreateDto":
        if not self.medicine_name or not (self.medicine_form or self.medicine_category):
            raise ValueError(
                "Нужно указать название и форму или категорию препарата"
            )
        return self


class HouseholdMedicineUpdateDto(BaseModel):
    """Обновление упаковки (вскрытие, место, комментарий)."""

    medicine_name: str | None = Field(None, description="Название препарата для своей аптечки")
    medicine_form: str | None = Field(None, description="Форма препарата")
    medicine_category: str | None = Field(None, description="Категория препарата для ручной записи")
    medicine_concentration: str | None = Field(None, description="Концентрация")
    medicine_description: str | None = Field(None, description="Описание препарата")
    medicine_dosage: str | None = Field(None, description="Как применять")
    pediatric_dose_mg_per_kg_min: float | None = Field(
        None, description="Нижняя граница типовой детской дозы в мг/кг на приём"
    )
    pediatric_dose_mg_per_kg_max: float | None = Field(
        None, description="Верхняя граница типовой детской дозы в мг/кг на приём"
    )
    pediatric_dose_note: str | None = Field(
        None, description="Короткая заметка к детской дозе"
    )
    expiry_date: date | None = Field(None, description="Срок годности")
    opened_at: datetime | None = Field(None, description="Дата вскрытия")
    opened_shelf_days: int | None = Field(
        None, ge=1, le=3650, description="Срок использования после вскрытия, дней"
    )
    comment: str | None = Field(None, description="Комментарий")


class HouseholdMedicineResponseDto(ResponseBase):
    """Ответ: упаковка в аптечке."""

    id: UUID
    family_id: UUID
    medicine_name: str
    medicine_form: str
    medicine_category: str | None
    medicine_concentration: str | None
    medicine_description: str | None
    medicine_dosage: str | None
    pediatric_dose_mg_per_kg_min: float | None
    pediatric_dose_mg_per_kg_max: float | None
    pediatric_dose_note: str | None
    expiry_date: date
    opened_at: datetime | None
    opened_shelf_days: int | None
    effective_opened_shelf_days: int | None
    comment: str | None
    status: str
    status_label: str
    expiry_alert_date: date | None
    expires_in_days: int
    opened_expires_at: date | None
    opened_expires_in_days: int | None
