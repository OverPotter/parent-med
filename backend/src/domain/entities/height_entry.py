"""Сущность: запись роста ребёнка."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class HeightEntry:
    """Одна запись измерения роста."""

    id: UUID
    child_id: UUID
    value_cm: float
    measured_at: datetime
