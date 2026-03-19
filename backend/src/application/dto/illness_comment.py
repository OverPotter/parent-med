"""DTO для комментариев эпизода болезни."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class IllnessCommentCreateDto(BaseModel):
    """Добавление комментария в эпизод."""

    episode_id: UUID = Field(..., description="ID эпизода болезни")
    text: str = Field(..., description="Текст комментария")
    created_at: datetime | None = Field(None, description="Время комментария")


class IllnessCommentResponseDto(ResponseBase):
    """Ответ: комментарий по эпизоду."""

    id: UUID
    episode_id: UUID
    created_at: datetime
    text: str
