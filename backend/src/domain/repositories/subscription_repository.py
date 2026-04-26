"""Repository interface for family subscriptions."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.subscription import Subscription
from src.domain.repositories.base import BaseRepository


class SubscriptionRepository(BaseRepository[Subscription]):
    """Subscription repository."""

    @abstractmethod
    async def get_current_by_family_id(self, family_id: UUID) -> Subscription | None:
        """Get the current subscription record for a family."""
        ...

    @abstractmethod
    async def list_by_family_id(self, family_id: UUID) -> list[Subscription]:
        """List family subscriptions newest first."""
        ...

    @abstractmethod
    async def update(self, entity: Subscription) -> Subscription:
        """Update subscription."""
        ...
