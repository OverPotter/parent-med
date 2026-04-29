"""Сущность: публичное обращение в поддержку."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class PublicSupportRequest:
    """Публичное сообщение, доступное без авторизации."""

    id: UUID
    reply_contact: str
    message: str
    client_request_id: UUID
    created_at: datetime
