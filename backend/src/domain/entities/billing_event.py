"""Billing event entity for provider sync history."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class BillingEvent:
    """Billing event persisted for idempotency and audit."""

    id: UUID
    subscription_id: UUID | None
    family_id: UUID
    provider: str
    event_type: str
    external_event_id: str
    payload_json: dict[str, object]
    processed_at: datetime | None
    created_at: datetime
