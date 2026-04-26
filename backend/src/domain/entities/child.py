"""Сущность: ребёнок (принадлежит семье, имеет историю веса и эпизоды болезни)."""

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import UUID


@dataclass
class Child:
    """Ребёнок в семье."""

    id: UUID
    family_id: UUID
    name: str
    birth_date: date | None
    baby_mode_enabled: bool = False
    institution_name: str | None = None
    institution_phone: str | None = None
    doctor_name: str | None = None
    doctor_phone: str | None = None
    allergies: str | None = None
    notes: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
