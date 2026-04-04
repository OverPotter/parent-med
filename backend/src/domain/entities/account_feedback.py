"""Сущность: сообщение обратной связи."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AccountFeedback:
    """Обращение пользователя."""

    id: UUID
    account_id: UUID
    message: str
    client_request_id: UUID
    created_at: datetime
