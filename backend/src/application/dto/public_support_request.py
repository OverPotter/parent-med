"""DTO публичных обращений в поддержку."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class PublicSupportRequestCreateDto(BaseModel):
    """Создание public support обращения."""

    reply_contact: str = Field(
        ...,
        min_length=3,
        max_length=320,
        description="Контакт для ответа пользователю",
    )
    message: str = Field(..., min_length=1, max_length=8000, description="Текст обращения")
    client_request_id: UUID = Field(..., description="UUID запроса с клиента (идемпотентность)")


class PublicSupportRequestResponseDto(ResponseBase):
    """Сохранённое public support обращение."""

    id: UUID = Field(..., description="ID записи")
    reply_contact: str = Field(..., description="Контакт для ответа")
    message: str = Field(..., description="Текст обращения")
    client_request_id: UUID = Field(..., description="UUID запроса с клиента")
    created_at: datetime = Field(..., description="Время сохранения")
