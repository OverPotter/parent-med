"""Сущность: сессия сна ребёнка."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class SleepSession:
    """Одна запись сна ребёнка."""

    id: UUID
    child_id: UUID
    started_at: datetime
    ended_at: datetime | None
    status: str
    created_by_account_id: UUID | None
