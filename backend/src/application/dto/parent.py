"""DTO для родителя."""

from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class ParentCreateDto(BaseModel):
    """Создание родителя внутри семьи."""

    family_id: UUID = Field(..., description="ID семьи")
    name: str = Field(..., description="Имя родителя")
    role: str = Field(..., description="Роль: мама, папа, опекун")


class ParentUpdateDto(BaseModel):
    """Обновление родителя."""

    name: str | None = Field(None, description="Имя родителя")
    role: str | None = Field(None, description="Роль: мама, папа, опекун")


class ParentResponseDto(ResponseBase):
    """Ответ: родитель."""

    id: UUID
    family_id: UUID
    name: str
    role: str
