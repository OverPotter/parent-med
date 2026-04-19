"""Сущность: запись измерения температуры в рамках эпизода болезни."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class TemperatureEntry:
    """Одно измерение температуры."""

    id: UUID
    episode_id: UUID
    value_celsius: float
    measured_at: datetime
    method: str | None  # oral, rectal, axillary, etc.
    comment: str | None
    created_by_account_id: UUID | None = None
    created_by_name_snapshot: str | None = None
