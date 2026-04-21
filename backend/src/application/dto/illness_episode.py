"""DTO для эпизода болезни."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class IllnessEpisodeCreateDto(BaseModel):
    """Создание эпизода болезни."""

    child_id: UUID = Field(..., description="ID ребёнка")
    started_at: date = Field(..., description="Дата начала")
    title: str | None = Field(None, description="Короткое название эпизода")
    medication_mode: str = Field("manual", description="Режим лекарств: manual или guided")
    note: str | None = Field(None, description="Общая заметка")
    member_account_ids: list[UUID] = Field(
        default_factory=list,
        description="Кому приходят push-напоминания по эпизоду",
    )


class IllnessEpisodeUpdateDto(BaseModel):
    """Обновление эпизода (закрытие, заметка)."""

    started_at: date | None = Field(None, description="Дата начала")
    title: str | None = Field(None, description="Короткое название эпизода")
    status: str | None = Field(None, description="Статус: active, closed")
    medication_mode: str | None = Field(None, description="Режим лекарств: manual или guided")
    note: str | None = Field(None, description="Общая заметка")
    member_account_ids: list[UUID] | None = Field(
        None,
        description="Кому приходят push-напоминания по эпизоду",
    )
    closed_at: datetime | None = Field(None, description="Дата закрытия")


class IllnessEpisodeResponseDto(ResponseBase):
    """Ответ: эпизод болезни."""

    id: UUID
    child_id: UUID
    started_at: date
    title: str | None
    status: str
    medication_mode: str
    note: str | None
    member_account_ids: list[UUID]
    closed_at: datetime | None
