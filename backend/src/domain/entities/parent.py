"""Сущность: родитель внутри семьи."""

from dataclasses import dataclass
from uuid import UUID


@dataclass
class Parent:
    """Родитель или опекун, привязанный к семье."""

    id: UUID
    family_id: UUID
    name: str
    role: str
