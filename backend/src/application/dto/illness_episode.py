"""DTO для эпизода болезни."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class IllnessEpisodeCreateDto(BaseModel):
    """Создание эпизода болезни."""

    child_id: UUID = Field(..., description="ID ребёнка")
    started_at: date = Field(..., description="Дата начала")
    note: str | None = Field(None, description="Общая заметка")


class IllnessEpisodeUpdateDto(BaseModel):
    """Обновление эпизода (закрытие, заметка)."""

    status: str | None = Field(None, description="Статус: active, closed")
    note: str | None = Field(None, description="Общая заметка")
    closed_at: datetime | None = Field(None, description="Дата закрытия")


class IllnessEpisodeResponseDto(ResponseBase):
    """Ответ: эпизод болезни."""

    id: UUID
    child_id: UUID
    started_at: date
    status: str
    note: str | None
    closed_at: datetime | None
