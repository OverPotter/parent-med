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
    created_by_account_id: UUID | None
    created_by_name_snapshot: str | None
