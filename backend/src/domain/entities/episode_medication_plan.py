"""Сущность: план приёма лекарства внутри эпизода болезни."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class EpisodeMedicationPlan:
    """Опциональный план приёма для guided-режима эпизода."""

    id: UUID
    episode_id: UUID
    household_medicine_id: UUID
    dose_amount: str
    min_interval_minutes: int
    max_doses_per_day: int | None
    weight_kg: float | None
    dose_mg_per_kg: float | None
    notes: str | None
    reminders_enabled: bool
    reminder_before_minutes: int | None
    notify_at_due: bool
    last_before_notification_for_at: datetime | None
    last_due_notification_for_at: datetime | None
    created_at: datetime
