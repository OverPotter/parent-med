"""DTO сессий сна ребёнка."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class SleepSessionCreateDto(BaseModel):
    """Старт сессии сна."""

    child_id: UUID = Field(..., description="ID ребёнка")
    started_at: datetime | None = Field(None, description="Время начала сна")


class SleepSessionStopDto(BaseModel):
    """Завершение сессии сна."""

    ended_at: datetime | None = Field(None, description="Время окончания сна")


class SleepSessionResponseDto(ResponseBase):
    """Ответ API по сессии сна."""

    id: UUID
    child_id: UUID
    started_at: datetime
    ended_at: datetime | None
    duration_minutes: int | None
    status: str
    created_by_account_id: UUID | None
