"""Сущность: ребёнок (принадлежит семье, имеет историю веса и эпизоды болезни)."""

from dataclasses import dataclass
from datetime import date
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
