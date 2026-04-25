"""Сущность: curated-справочник препаратов для UI."""

from dataclasses import dataclass
from uuid import UUID


@dataclass
class CuratedMedicineCatalogItem:
    """Короткая и нормализованная карточка препарата для домашней аптечки."""

    id: UUID
    language: str
    display_name: str
    active_substance: str | None
    form: str
    strength: str | None
    short_description: str | None
    dosage_summary: str | None
    pediatric_dose_mg_per_kg_min: float | None
    pediatric_dose_mg_per_kg_max: float | None
    pediatric_dose_note: str | None
    default_opened_shelf_days: int | None
    is_otc: bool
    is_home_cabinet_relevant: bool
    search_rank: int = 0
