"""Сущность: факт приёма лекарства (журнал приёмов)."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AdministrationEvent:
    """Реальный приём: когда, сколько, из какой упаковки."""

    id: UUID
    episode_id: UUID
    household_medicine_id: UUID | None
    custom_medicine_name: str | None
    administered_at: datetime
    administered_by_account_id: UUID | None
    administered_by_name_snapshot: str | None
    amount: str  # например "5 мл", "1 таб"
    unit: str | None
    reason: str | None  # по назначению, по требованию и т.д.
