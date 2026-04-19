"""DTO для записи температуры."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class TemperatureEntryCreateDto(BaseModel):
    """Добавление записи температуры."""

    episode_id: UUID = Field(..., description="ID эпизода болезни")
    value_celsius: float = Field(..., description="Температура в °C")
    measured_at: datetime | None = Field(None, description="Время измерения")
    method: str | None = Field(None, description="Способ: oral, rectal, axillary")
    comment: str | None = Field(None, description="Комментарий")


class TemperatureEntryResponseDto(ResponseBase):
    """Ответ: запись температуры."""

    id: UUID
    episode_id: UUID
    value_celsius: float
    measured_at: datetime
    method: str | None
    comment: str | None
    created_by_account_id: UUID | None
    created_by_name_snapshot: str | None
