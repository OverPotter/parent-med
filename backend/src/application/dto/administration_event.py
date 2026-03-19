"""DTO для приёма лекарства."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class AdministrationEventCreateDto(BaseModel):
    """Фиксация приёма лекарства (после проверки Safety Engine)."""

    episode_id: UUID = Field(..., description="ID эпизода болезни")
    household_medicine_id: UUID | None = Field(None, description="ID упаковки из аптечки")
    custom_medicine_name: str | None = Field(None, description="Свободное название лекарства")
    administered_at: datetime | None = Field(None, description="Время приёма")
    amount: str = Field(..., description="Количество, напр. 5 мл, 1 таб")
    unit: str | None = Field(None, description="Единица измерения")
    reason: str | None = Field(None, description="Причина: по назначению, по требованию")


class AdministrationEventResponseDto(ResponseBase):
    """Ответ: факт приёма."""

    id: UUID
    episode_id: UUID
    household_medicine_id: UUID | None
    custom_medicine_name: str | None
    administered_at: datetime
    amount: str
    unit: str | None
    reason: str | None
