"""Сущность: запись веса ребёнка (для расчёта дозировок)."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class WeightEntry:
    """Одна запись измерения веса."""

    id: UUID
    child_id: UUID
    value_kg: float
    measured_at: datetime
