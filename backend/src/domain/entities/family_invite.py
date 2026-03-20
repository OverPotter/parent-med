"""Сущность: приглашение в семью."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class FamilyInvite:
    """Приглашение с одноразовым токеном и сроком жизни."""

    id: UUID
    family_id: UUID
    created_by_account_id: UUID
    token_hash: str
    family_role: str
    created_at: datetime
    expires_at: datetime
    accepted_at: datetime | None
    accepted_by_account_id: UUID | None
