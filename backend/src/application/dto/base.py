"""Базовые классы DTO."""

from pydantic import BaseModel


class ResponseBase(BaseModel):
    """Базовый класс для DTO с конфигом."""

    model_config = {"from_attributes": True}
