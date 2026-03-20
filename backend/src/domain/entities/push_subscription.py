"""Сущность: web push-подписка устройства."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class PushSubscription:
    """Подписка конкретного устройства на web push-уведомления."""

    id: UUID
    account_id: UUID
    endpoint: str
    p256dh_key: str
    auth_key: str
    expiration_time: datetime | None
    user_agent: str | None
    device_label: str | None
    created_at: datetime
    updated_at: datetime
