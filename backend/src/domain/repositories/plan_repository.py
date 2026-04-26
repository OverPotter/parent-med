"""Repository interface for commercial plans."""

from abc import abstractmethod

from src.domain.entities.plan import Plan
from src.domain.repositories.base import BaseRepository


class PlanRepository(BaseRepository[Plan]):
    """Plan repository."""

    @abstractmethod
    async def get_by_code(self, code: str) -> Plan | None:
        """Get plan by stable code."""
        ...

    @abstractmethod
    async def list_active(self) -> list[Plan]:
        """List active plans ordered for UI/debug use."""
        ...

    @abstractmethod
    async def update(self, entity: Plan) -> Plan:
        """Update plan."""
        ...
