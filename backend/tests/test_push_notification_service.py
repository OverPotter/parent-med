from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.application.dto.push_notification import PushSubscriptionUpsertDto
from src.application.services.push_notification_service import PushNotificationService
from src.domain.entities.push_subscription import PushSubscription


class StubPushSubscriptionRepository:
    def __init__(self) -> None:
        self.items: dict = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def get_by_endpoint(self, endpoint):  # noqa: ANN001
        return next((item for item in self.items.values() if item.endpoint == endpoint), None)

    async def get_by_native_token(self, native_token):  # noqa: ANN001
        return next(
            (item for item in self.items.values() if item.native_token == native_token),
            None,
        )

    async def get_by_account_platform_device(self, account_id, platform, device_id):  # noqa: ANN001
        return next(
            (
                item
                for item in self.items.values()
                if item.account_id == account_id
                and item.platform == platform
                and item.device_id == device_id
            ),
            None,
        )

    async def get_by_account_id(self, account_id):  # noqa: ANN001
        return [item for item in self.items.values() if item.account_id == account_id]

    async def add(self, entity: PushSubscription) -> PushSubscription:
        self.items[entity.id] = entity
        return entity

    async def update(self, entity: PushSubscription) -> PushSubscription:
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items.pop(id, None)
        return True

    async def delete_by_endpoint(self, endpoint):  # noqa: ANN001
        entity = await self.get_by_endpoint(endpoint)
        if not entity:
            return False
        self.items.pop(entity.id, None)
        return True


class StubAccountRepository:
    async def get_by_id(self, id):  # noqa: ANN001
        return None


def build_native_subscription(
    *,
    account_id,
    token: str,
    device_id: str | None,
) -> PushSubscription:  # noqa: ANN001
    now = datetime.now(UTC)
    return PushSubscription(
        id=uuid4(),
        account_id=account_id,
        channel="native",
        endpoint=f"native:ios:{device_id or token}",
        p256dh_key=None,
        auth_key=None,
        native_token=token,
        platform="ios",
        device_id=device_id,
        expiration_time=None,
        user_agent="native",
        device_label="App · iOS",
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_upsert_native_subscription_updates_existing_device_record_when_token_rotates() -> (
    None
):
    account_id = uuid4()
    repo = StubPushSubscriptionRepository()
    existing = build_native_subscription(
        account_id=account_id,
        token="old-token",
        device_id="device-1",
    )
    await repo.add(existing)
    service = PushNotificationService(repo, StubAccountRepository())

    result = await service.upsert_subscription(
        account_id,
        PushSubscriptionUpsertDto(
            channel="native",
            endpoint="new-token",
            native_token="new-token",
            platform="ios",
            device_id="device-1",
            user_agent="native-ios",
            device_label="App · iOS",
        ),
    )

    assert result.id == existing.id
    saved = await repo.get_by_id(existing.id)
    assert saved is not None
    assert saved.native_token == "new-token"
    assert saved.device_id == "device-1"
    assert saved.endpoint == "native:ios:device-1"


@pytest.mark.asyncio
async def test_upsert_native_subscription_adopts_legacy_token_record_for_device_id() -> None:
    account_id = uuid4()
    repo = StubPushSubscriptionRepository()
    legacy = build_native_subscription(
        account_id=account_id,
        token="same-token",
        device_id=None,
    )
    await repo.add(legacy)
    service = PushNotificationService(repo, StubAccountRepository())

    result = await service.upsert_subscription(
        account_id,
        PushSubscriptionUpsertDto(
            channel="native",
            endpoint="same-token",
            native_token="same-token",
            platform="ios",
            device_id="device-2",
            user_agent="native-ios",
            device_label="App · iOS",
        ),
    )

    assert result.id == legacy.id
    saved = await repo.get_by_id(legacy.id)
    assert saved is not None
    assert saved.native_token == "same-token"
    assert saved.device_id == "device-2"
    assert saved.endpoint == "native:ios:device-2"
