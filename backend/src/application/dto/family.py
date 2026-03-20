"""DTO для семьи."""

from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class FamilyCreateDto(BaseModel):
    """Создание семьи."""

    name: str = Field(..., description="Название семьи")


class FamilyUpdateDto(BaseModel):
    """Обновление семьи."""

    name: str | None = Field(None, description="Название семьи")


class FamilyResponseDto(ResponseBase):
    """Ответ: семья."""

    id: UUID
    name: str


class FamilyMemberUpdateDto(BaseModel):
    """Обновление участника семьи."""

    family_role: str = Field(..., description="Роль аккаунта в семье: owner или adult")
