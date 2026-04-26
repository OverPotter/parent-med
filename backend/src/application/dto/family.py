"""DTO для семьи."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase
from src.application.dto.family_access import (
    FamilyAccessPolicyUpdateDto,
)


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
    owner_account_id: UUID | None = None
    billing_account_id: UUID | None = None
    free_primary_child_id: UUID | None = None
    plan_code: Literal["free", "plus", "pro"] = "free"
    subscription_status: Literal[
        "inactive", "trialing", "active", "grace", "canceled", "expired"
    ] = "inactive"
    subscription_provider: str | None = None
    subscription_product_id: str | None = None
    subscription_expires_at: datetime | None = None
    premium_active: bool = False


class FamilyMemberUpdateDto(BaseModel):
    """Обновление участника семьи."""

    family_role: str | None = Field(None, description="Роль аккаунта в семье: admin/member")
    access_policy: FamilyAccessPolicyUpdateDto | None = Field(
        None,
        description="Обновление granular-доступа участника",
    )


class FamilyMemberProfileUpdateDto(BaseModel):
    """Обновление профиля участника семьи."""

    display_name: str | None = Field(None, description="Как показывать участника в семье")
    relationship_label: str | None = Field(None, description="Кем участник является в семье")
    phone: str | None = Field(None, description="Телефон участника")
