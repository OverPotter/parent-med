"""Сущность: семья как контейнер общих данных и биллинга."""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

DEFAULT_PERSONAL_FAMILY_NAME = "Моя семья"


@dataclass
class Family:
    """Семья — контейнер детей и домашней аптечки."""

    id: UUID
    name: str
    cabinet_member_account_ids: list[UUID] = field(default_factory=list)
    owner_account_id: UUID | None = None
    billing_account_id: UUID | None = None
    free_primary_child_id: UUID | None = None
    free_primary_pillbox_plan_id: UUID | None = None
    plan_code: str = "free"
    subscription_status: str = "inactive"
    subscription_provider: str | None = None
    subscription_product_id: str | None = None
    subscription_expires_at: datetime | None = None


def build_personal_family(owner_account_id: UUID, *, id: UUID | None = None) -> Family:
    return Family(
        id=id or uuid4(),
        name=DEFAULT_PERSONAL_FAMILY_NAME,
        owner_account_id=owner_account_id,
    )
