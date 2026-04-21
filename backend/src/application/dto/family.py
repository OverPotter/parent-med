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
    cabinet_member_account_ids: list[UUID] | None = Field(
        None,
        description="Кому приходят push по аптечке; пустой список = всей семье",
    )


class FamilyResponseDto(ResponseBase):
    """Ответ: семья."""

    id: UUID
    name: str
    cabinet_member_account_ids: list[UUID]


class FamilyMemberUpdateDto(BaseModel):
    """Обновление участника семьи."""

    family_role: str = Field(..., description="Роль аккаунта в семье: owner или adult")


class FamilyMemberProfileUpdateDto(BaseModel):
    """Обновление профиля участника семьи."""

    display_name: str | None = Field(None, description="Как показывать участника в семье")
    relationship_label: str | None = Field(None, description="Кем участник является в семье")
    phone: str | None = Field(None, description="Телефон участника")
