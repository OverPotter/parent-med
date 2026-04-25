"""DTO для curated-справочника препаратов."""

from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class CuratedMedicineCatalogResponseDto(ResponseBase):
    """Ответ: препарат из curated-справочника."""

    id: UUID
    language: str = Field(..., description="Язык карточки, например ru или en")
    display_name: str = Field(..., description="Короткое название для UI")
    active_substance: str | None = Field(None, description="Действующее вещество")
    form: str = Field(..., description="Форма: таблетки, сироп, капли и т.д.")
    strength: str | None = Field(None, description="Сила или концентрация")
    short_description: str | None = Field(None, description="Короткое описание в 1-2 строки")
    dosage_summary: str | None = Field(
        None,
        description="Короткая подсказка по применению или дозированию",
    )
    pediatric_dose_mg_per_kg_min: float | None = Field(
        None,
        description="Нижняя граница типовой детской дозы в мг/кг на приём, если она известна",
    )
    pediatric_dose_mg_per_kg_max: float | None = Field(
        None,
        description="Верхняя граница типовой детской дозы в мг/кг на приём, если она известна",
    )
    pediatric_dose_note: str | None = Field(
        None,
        description="Короткая заметка к детской дозе: возраст, частота или источник",
    )
    default_opened_shelf_days: int | None = Field(
        None,
        description="Типовой срок после вскрытия, если он известен для этой карточки",
    )
    is_otc: bool = Field(..., description="Безрецептурный препарат")
    is_home_cabinet_relevant: bool = Field(
        ...,
        description="Подходит для пользовательского каталога домашней аптечки",
    )
    search_rank: int = Field(..., description="Приоритет в выдаче поиска")


class CuratedMedicineCatalogSearchQuery(BaseModel):
    """Параметры поиска по curated-каталогу."""

    query: str | None = Field(None, min_length=1, description="Строка поиска")
    language: str = Field("ru", min_length=2, max_length=8, description="Язык поиска")
    form: str | None = Field(None, min_length=1, max_length=64, description="Фильтр по форме")
    limit: int = Field(20, ge=1, le=100, description="Максимум результатов")
