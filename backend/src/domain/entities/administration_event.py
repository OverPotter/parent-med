"""Сущность: факт приёма лекарства (журнал приёмов)."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AdministrationEvent:
    """Реальный приём: когда, сколько, из какой упаковки."""

    id: UUID
    episode_id: UUID
    household_medicine_id: UUID
    administered_at: datetime
    amount: str  # например "5 мл", "1 таб"
    unit: str | None
    reason: str | None  # по назначению, по требованию и т.д.
