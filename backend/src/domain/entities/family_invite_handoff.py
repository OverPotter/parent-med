"""Сущность: handoff-сессия для invite-flow после установки приложения."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class FamilyInviteHandoff:
    """Короткоживущая handoff-сессия для продолжения invite-flow в приложении."""

    id: UUID
    handoff_token_hash: str
    invite_id: UUID
    family_id: UUID
    family_name: str
    family_role: str
    created_at: datetime
    expires_at: datetime
    consumed_at: datetime | None
