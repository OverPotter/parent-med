"""Сущность: семья как контейнер общих данных и биллинга."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Family:
    """Семья — контейнер детей и домашней аптечки."""

    id: UUID
    name: str
    cabinet_member_account_ids: list[UUID] = field(default_factory=list)
    billing_account_id: UUID | None = None
    plan_code: str = "free"
    subscription_status: str = "inactive"
    subscription_provider: str | None = None
    subscription_product_id: str | None = None
    subscription_expires_at: datetime | None = None
