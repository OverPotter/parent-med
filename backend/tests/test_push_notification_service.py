from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.application.dto.push_notification import (
    PushNotificationPreferencesUpdateDto,
    PushSubscriptionUpsertDto,
)
from src.application.services.push_notification_service import PushNotificationService
from src.domain.entities.account import Account
from src.domain.entities.family_access import FamilyAccessPolicy
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
    def __init__(self, account: Account | None = None) -> None:
        self.account = account

    async def get_by_id(self, id):  # noqa: ANN001
        return self.account

    async def update(self, entity):  # noqa: ANN001
        self.account = entity
        return entity


class StubScheduler:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def _send_to_subscriptions(  # noqa: ANN001
        self,
        *,
        subscriptions,
        subscription_repo,
        payload,
    ) -> bool:
        self.calls.append(
            {
                "subscriptions": subscriptions,
                "subscription_repo": subscription_repo,
                "payload": payload,
            }
        )
        return True


def build_account() -> Account:
    return Account(
        id=uuid4(),
        login="tester",
        email="tester@example.com",
        password_hash="hash",
        family_id=uuid4(),
        display_name="Tester",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime.now(UTC),
        children_push_enabled=True,
        pillbox_push_enabled=True,
        pillbox_push_before_reminder_minutes=10,
        access_policy=FamilyAccessPolicy(),
    )


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


@pytest.mark.asyncio
async def test_get_preferences_returns_category_switches() -> None:
    account = build_account()
    account.children_push_enabled = False
    account.pillbox_push_enabled = True
    service = PushNotificationService(
        StubPushSubscriptionRepository(),
        StubAccountRepository(account),
    )

    result = await service.get_preferences(account.id)

    assert result.children_enabled is False
    assert result.before_reminder_minutes == 10
    assert result.pillbox_enabled is True
    assert result.pillbox_before_reminder_minutes == 10


@pytest.mark.asyncio
async def test_update_preferences_persists_category_switches_without_zeroing_minutes() -> None:
    account = build_account()
    service = PushNotificationService(
        StubPushSubscriptionRepository(),
        StubAccountRepository(account),
    )

    result = await service.update_preferences(
        account.id,
        PushNotificationPreferencesUpdateDto(
            children_enabled=False,
            pillbox_enabled=False,
        ),
    )

    assert result.children_enabled is False
    assert result.pillbox_enabled is False
    assert result.before_reminder_minutes == 10
    assert result.pillbox_before_reminder_minutes == 10


@pytest.mark.asyncio
async def test_send_pillbox_test_notification_uses_pillbox_style_payload() -> None:
    account = build_account()
    account.preferred_language = "ru"
    repo = StubPushSubscriptionRepository()
    subscription = build_native_subscription(
        account_id=account.id,
        token="token-1",
        device_id="device-1",
    )
    await repo.add(subscription)
    scheduler = StubScheduler()
    service = PushNotificationService(repo, StubAccountRepository(account))

    result = await service.send_pillbox_test_notification(account.id, scheduler)

    assert result.sent is True
    assert result.subscription_count == 1
    assert len(scheduler.calls) == 1
    payload = scheduler.calls[0]["payload"]
    assert payload["title"] == "Через 10 мин: Ибупрофен"
    assert payload["body"].startswith("1 таблетка · после еды · Кому: Tester · в ")
    assert payload["url"].startswith("/pillbox?plan=test-pillbox-plan")
    assert payload["data"]["kind"] == "before"
    assert payload["data"]["source"] == "pillbox_test"
    assert payload["actions"][0]["action"] == "open-pillbox"
