"""Сущность: семья (владелец аптечки и привязка детей)."""

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class Family:
    """Семья — контейнер детей и домашней аптечки."""

    id: UUID
    name: str
    cabinet_member_account_ids: list[UUID] = field(default_factory=list)
