"""DTO для записи роста."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class HeightEntryCreateDto(BaseModel):
    """Добавление записи роста."""

    child_id: UUID = Field(..., description="ID ребёнка")
    value_cm: float = Field(..., gt=0, description="Рост в сантиметрах")
    measured_at: datetime | None = Field(None, description="Дата и время измерения")


class HeightEntryResponseDto(ResponseBase):
    """Ответ: запись роста."""

    id: UUID
    child_id: UUID
    value_cm: float
    measured_at: datetime
