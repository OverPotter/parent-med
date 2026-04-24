"""Сущность: push-подписка устройства (web/native)."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

PushSubscriptionChannel = Literal["web", "native"]


@dataclass
class PushSubscription:
    """Подписка конкретного устройства на push-уведомления."""

    id: UUID
    account_id: UUID
    channel: PushSubscriptionChannel
    endpoint: str
    p256dh_key: str | None
    auth_key: str | None
    native_token: str | None
    platform: str | None
    device_id: str | None
    expiration_time: datetime | None
    user_agent: str | None
    device_label: str | None
    created_at: datetime
    updated_at: datetime
