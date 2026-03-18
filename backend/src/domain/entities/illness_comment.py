"""Сущность: комментарий внутри эпизода болезни."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class IllnessComment:
    """Одна комментарная запись по эпизоду."""

    id: UUID
    episode_id: UUID
    created_at: datetime
    text: str
