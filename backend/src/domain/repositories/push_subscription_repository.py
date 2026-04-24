"""Интерфейс репозитория push-подписок."""

from abc import abstractmethod
from uuid import UUID

from src.domain.entities.push_subscription import PushSubscription
from src.domain.repositories.base import BaseRepository


class PushSubscriptionRepository(BaseRepository[PushSubscription]):
    """Репозиторий push-подписок устройств."""

    @abstractmethod
    async def get_by_id(self, id: UUID) -> PushSubscription | None: ...

    @abstractmethod
    async def get_by_endpoint(self, endpoint: str) -> PushSubscription | None: ...

    @abstractmethod
    async def get_by_native_token(self, native_token: str) -> PushSubscription | None: ...

    @abstractmethod
    async def get_by_account_platform_device(
        self,
        account_id: UUID,
        platform: str,
        device_id: str,
    ) -> PushSubscription | None: ...

    @abstractmethod
    async def get_by_account_id(self, account_id: UUID) -> list[PushSubscription]: ...

    @abstractmethod
    async def add(self, entity: PushSubscription) -> PushSubscription: ...

    @abstractmethod
    async def update(self, entity: PushSubscription) -> PushSubscription: ...

    @abstractmethod
    async def delete(self, id: UUID) -> bool: ...

    @abstractmethod
    async def delete_by_endpoint(self, endpoint: str) -> bool: ...
