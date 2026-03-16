"""DTO для упаковки в аптечке."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class HouseholdMedicineCreateDto(BaseModel):
    """Добавление упаковки в аптечку."""

    family_id: UUID = Field(..., description="ID семьи")
    catalog_item_id: UUID = Field(..., description="ID препарата из справочника")
    expiry_date: date = Field(..., description="Срок годности")
    opened_at: datetime | None = Field(None, description="Дата вскрытия")
    storage_place: str | None = Field(None, description="Место хранения")
    comment: str | None = Field(None, description="Комментарий")


class HouseholdMedicineUpdateDto(BaseModel):
    """Обновление упаковки (вскрытие, место, комментарий)."""

    opened_at: datetime | None = Field(None, description="Дата вскрытия")
    storage_place: str | None = Field(None, description="Место хранения")
    comment: str | None = Field(None, description="Комментарий")


class HouseholdMedicineResponseDto(ResponseBase):
    """Ответ: упаковка в аптечке."""

    id: UUID
    family_id: UUID
    catalog_item_id: UUID
    expiry_date: date
    opened_at: datetime | None
    storage_place: str | None
    comment: str | None
