"""Сущность: эпизод болезни ребёнка."""

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass
class IllnessEpisode:
    """Эпизод болезни: дата начала, статус, общая заметка."""

    id: UUID
    child_id: UUID
    started_at: date
    title: str | None
    status: str  # active, closed
    note: str | None
    closed_at: datetime | None
    deleted_at: datetime | None
