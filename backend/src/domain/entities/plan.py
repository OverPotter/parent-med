"""Commercial subscription plan entity."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Plan:
    """Commercial plan definition."""

    id: UUID
    code: str
    name: str
    is_active: bool
    apple_product_id: str | None
    revenuecat_entitlement_code: str | None
    sort_order: int
    created_at: datetime
