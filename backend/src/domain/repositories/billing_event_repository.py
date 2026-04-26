"""Repository interface for billing events."""

from abc import abstractmethod

from src.domain.entities.billing_event import BillingEvent
from src.domain.repositories.base import BaseRepository


class BillingEventRepository(BaseRepository[BillingEvent]):
    """Billing event repository."""

    @abstractmethod
    async def get_by_external_event_id(self, external_event_id: str) -> BillingEvent | None:
        """Find billing event by provider event id."""
        ...

    @abstractmethod
    async def update(self, entity: BillingEvent) -> BillingEvent:
        """Update billing event."""
        ...
