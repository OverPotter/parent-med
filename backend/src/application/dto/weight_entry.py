"""DTO для записи веса."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class WeightEntryCreateDto(BaseModel):
    """Добавление записи веса."""

    child_id: UUID = Field(..., description="ID ребёнка")
    value_kg: float = Field(..., description="Вес в кг")
    measured_at: datetime | None = Field(None, description="Дата и время измерения")


class WeightEntryResponseDto(ResponseBase):
    """Ответ: запись веса."""

    id: UUID
    child_id: UUID
    value_kg: float
    measured_at: datetime
