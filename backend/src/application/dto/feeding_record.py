"""DTO записей кормления ребёнка."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class FeedingRecordCreateDto(BaseModel):
    """Создание записи кормления."""

    child_id: UUID = Field(..., description="ID ребёнка")
    feeding_type: str = Field(..., description="Тип: breast или formula")
    breast_side: str | None = Field(None, description="Сторона груди")
    is_expressed: bool = Field(False, description="Сцеженное молоко")
    formula_volume_ml: int | None = Field(None, description="Объём смеси в мл")
    recorded_at: datetime | None = Field(None, description="Время кормления")
    duration_minutes: int | None = Field(None, description="Длительность в минутах")
    note: str | None = Field(None, description="Заметка")


class FeedingRecordStartDto(BaseModel):
    """Старт активного кормления."""

    child_id: UUID = Field(..., description="ID ребёнка")
    feeding_type: str = Field(..., description="Тип: breast или formula")
    breast_side: str | None = Field(None, description="Сторона груди")
    is_expressed: bool = Field(False, description="Сцеженное молоко")
    formula_volume_ml: int | None = Field(None, description="Объём смеси в мл")
    recorded_at: datetime | None = Field(None, description="Фактическое время начала кормления")
    started_at: datetime | None = Field(None, description="Время старта кормления")
    note: str | None = Field(None, description="Заметка")


class FeedingRecordStopDto(BaseModel):
    """Завершение активного кормления."""

    ended_at: datetime | None = Field(None, description="Время окончания кормления")
    formula_volume_ml: int | None = Field(None, description="Объём смеси в мл")
    note: str | None = Field(None, description="Заметка")


class FeedingRecordResponseDto(ResponseBase):
    """Ответ API по записи кормления."""

    id: UUID
    child_id: UUID
    feeding_type: str
    breast_side: str | None
    is_expressed: bool
    formula_volume_ml: int | None
    recorded_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    duration_minutes: int | None
    status: str
    note: str | None
    created_by_account_id: UUID | None
