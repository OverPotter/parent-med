"""Family subscription lifecycle entity."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Subscription:
    """Subscription record for a family."""

    id: UUID
    family_id: UUID
    plan_id: UUID
    provider: str
    provider_customer_id: str | None
    provider_subscription_id: str | None
    status: str
    starts_at: datetime | None
    expires_at: datetime | None
    trial_ends_at: datetime | None
    canceled_at: datetime | None
    raw_payload_json: dict[str, object]
    created_at: datetime
    updated_at: datetime
