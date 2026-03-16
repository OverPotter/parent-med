"""Сущность: семья (владелец аптечки и привязка детей)."""

from dataclasses import dataclass
from uuid import UUID


@dataclass
class Family:
    """Семья — контейнер детей и домашней аптечки."""

    id: UUID
    name: str
