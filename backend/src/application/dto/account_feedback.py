"""DTO обратной связи."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class AccountFeedbackCreateDto(BaseModel):
    """Отправка сообщения."""

    message: str = Field(..., min_length=1, max_length=8000, description="Текст обращения")
    client_request_id: UUID = Field(..., description="UUID запроса с клиента (идемпотентность)")


class AccountFeedbackResponseDto(ResponseBase):
    """Сохранённое обращение."""

    id: UUID = Field(..., description="ID записи обратной связи")
    account_id: UUID = Field(..., description="ID аккаунта")
    message: str = Field(..., description="Текст обращения")
    client_request_id: UUID = Field(..., description="UUID запроса с клиента")
    created_at: datetime = Field(..., description="Время сохранения")
