"""DTO для server-side hash идентификаторов аналитики."""

from typing import Literal

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase

AnalyticsHashKind = Literal["account", "child", "episode"]


class AnalyticsHashRequestDto(BaseModel):
    """Запрос на получение hash идентификатора для аналитики."""

    kind: AnalyticsHashKind = Field(..., description="Тип идентификатора")
    value: str = Field(..., min_length=1, max_length=256, description="Исходный id")


class AnalyticsHashResponseDto(ResponseBase):
    """Ответ с hash значением идентификатора."""

    kind: AnalyticsHashKind
    value_hash: str
