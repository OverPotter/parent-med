"""DTO для ребёнка."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class ChildCreateDto(BaseModel):
    """Добавление ребёнка."""

    family_id: UUID = Field(..., description="ID семьи")
    name: str = Field(..., description="Имя ребёнка")
    birth_date: date | None = Field(None, description="Дата рождения")


class ChildUpdateDto(BaseModel):
    """Обновление ребёнка."""

    name: str | None = Field(None, description="Имя ребёнка")
    birth_date: date | None = Field(None, description="Дата рождения")


class ChildResponseDto(ResponseBase):
    """Ответ: ребёнок."""

    id: UUID
    family_id: UUID
    name: str
    birth_date: date | None
