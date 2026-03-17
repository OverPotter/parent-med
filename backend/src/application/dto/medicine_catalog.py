"""DTO для справочника препаратов."""

from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class MedicineCatalogCreateDto(BaseModel):
    """Добавление препарата в справочник."""

    name: str = Field(..., description="Название препарата")
    form: str = Field(..., description="Форма: tablet, syrup, drops и т.д.")
    concentration: str | None = Field(None, description="Концентрация, напр. 100 мг/5 мл")
    description: str | None = Field(None, description="Краткое описание или показания")
    dosage: str | None = Field(None, description="Дозировка или схема приёма")
    default_opened_shelf_days: int | None = Field(
        None,
        ge=1,
        le=3650,
        description="Рекомендуемый срок использования после вскрытия, дней",
    )


class MedicineCatalogResponseDto(ResponseBase):
    """Ответ: препарат из справочника."""

    id: UUID
    name: str
    form: str
    concentration: str | None
    description: str | None
    dosage: str | None
    default_opened_shelf_days: int | None
