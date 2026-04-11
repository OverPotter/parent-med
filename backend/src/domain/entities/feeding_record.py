"""Сущность записи кормления ребёнка."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class FeedingRecord:
    """Запись кормления ребёнка."""

    id: UUID
    child_id: UUID
    feeding_type: str
    breast_side: str | None
    is_expressed: bool
    formula_volume_ml: int | None
    recorded_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    duration_minutes: int | None
    status: str
    note: str | None
    created_by_account_id: UUID | None
