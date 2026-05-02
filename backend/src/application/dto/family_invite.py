"""DTO для приглашений в семью."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class FamilyInviteCreateDto(BaseModel):
    """Создание инвайта в семью."""

    family_role: str = Field("member", description="Роль приглашаемого внутри семьи")


class FamilyInviteResponseDto(ResponseBase):
    """Ответ с только что созданным инвайтом."""

    token: str
    family_id: UUID
    family_name: str
    family_role: str
    expires_at: datetime


class FamilyInvitePreviewResponseDto(ResponseBase):
    """Публичный preview инвайта."""

    family_id: UUID
    family_name: str
    family_role: str
    expires_at: datetime
