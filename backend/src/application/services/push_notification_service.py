"""Сервис управления push-подписками устройства (web/native)."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.push_notification import (
    PushNotificationConfigResponseDto,
    PushNotificationPreferencesResponseDto,
    PushNotificationPreferencesUpdateDto,
    PushNotificationTestResponseDto,
    PushSubscriptionDeleteDto,
    PushSubscriptionResponseDto,
    PushSubscriptionUpsertDto,
)
from src.core.config import settings
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.account import copy_account
from src.domain.entities.push_subscription import PushSubscription
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.push_subscription_repository import PushSubscriptionRepository


class PushNotificationService:
    """Работа с push-подписками и конфигом VAPID."""

    ALLOWED_BEFORE_REMINDER_MINUTES = {0, 5, 10, 15, 20}
    ALLOWED_PILLBOX_BEFORE_REMINDER_MINUTES = {0, 5, 10, 15}

    def __init__(
        self,
        subscription_repo: PushSubscriptionRepository,
        account_repo: AccountRepository,
    ) -> None:
        self._repo = subscription_repo
        self._account_repo = account_repo

    def get_config(self) -> PushNotificationConfigResponseDto:
        return PushNotificationConfigResponseDto(
            enabled=settings.web_push_enabled or settings.apns_enabled,
            vapid_public_key=settings.web_push_public_key,
        )

    async def get_preferences(self, account_id: UUID) -> PushNotificationPreferencesResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Аккаунт не найден", resource="account")
        return PushNotificationPreferencesResponseDto(
            before_reminder_minutes=account.push_before_reminder_minutes,
            pillbox_before_reminder_minutes=account.pillbox_push_before_reminder_minutes,
            due_reminder_enabled=True,
            cabinet_notify_10_days=account.cabinet_notify_10_days,
            cabinet_notify_7_days=account.cabinet_notify_7_days,
            cabinet_notify_3_days=account.cabinet_notify_3_days,
            live_activity_sleep_enabled=account.live_activity_sleep_enabled,
            live_activity_feeding_enabled=account.live_activity_feeding_enabled,
            live_activity_illness_enabled=account.live_activity_illness_enabled,
        )

    async def update_preferences(
        self,
        account_id: UUID,
        dto: PushNotificationPreferencesUpdateDto,
    ) -> PushNotificationPreferencesResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Аккаунт не найден", resource="account")

        before_reminder_minutes = account.push_before_reminder_minutes
        pillbox_before_reminder_minutes = account.pillbox_push_before_reminder_minutes
        live_activity_sleep_enabled = account.live_activity_sleep_enabled
        live_activity_feeding_enabled = account.live_activity_feeding_enabled
        live_activity_illness_enabled = account.live_activity_illness_enabled
        if dto.before_reminder_minutes is not None:
            if dto.before_reminder_minutes not in self.ALLOWED_BEFORE_REMINDER_MINUTES:
                raise ValidationError("Можно выбрать 0, 5, 10, 15 или 20 минут")
            before_reminder_minutes = dto.before_reminder_minutes
        if dto.pillbox_before_reminder_minutes is not None:
            if (
                dto.pillbox_before_reminder_minutes
                not in self.ALLOWED_PILLBOX_BEFORE_REMINDER_MINUTES
            ):
                raise ValidationError("Для таблетницы можно выбрать 0, 5, 10 или 15 минут")
            pillbox_before_reminder_minutes = dto.pillbox_before_reminder_minutes
        if dto.live_activity_sleep_enabled is not None:
            live_activity_sleep_enabled = dto.live_activity_sleep_enabled
        if dto.live_activity_feeding_enabled is not None:
            live_activity_feeding_enabled = dto.live_activity_feeding_enabled
        if dto.live_activity_illness_enabled is not None:
            live_activity_illness_enabled = dto.live_activity_illness_enabled

        if (
            dto.before_reminder_minutes is None
            and dto.pillbox_before_reminder_minutes is None
            and dto.cabinet_notify_10_days is None
            and dto.cabinet_notify_7_days is None
            and dto.cabinet_notify_3_days is None
            and dto.live_activity_sleep_enabled is None
            and dto.live_activity_feeding_enabled is None
            and dto.live_activity_illness_enabled is None
        ):
            return await self.get_preferences(account_id)

        updated = await self._account_repo.update(
            copy_account(
                account,
                push_before_reminder_minutes=before_reminder_minutes,
                pillbox_push_before_reminder_minutes=pillbox_before_reminder_minutes,
                cabinet_notify_10_days=(
                    dto.cabinet_notify_10_days
                    if dto.cabinet_notify_10_days is not None
                    else account.cabinet_notify_10_days
                ),
                cabinet_notify_7_days=(
                    dto.cabinet_notify_7_days
                    if dto.cabinet_notify_7_days is not None
                    else account.cabinet_notify_7_days
                ),
                cabinet_notify_3_days=(
                    dto.cabinet_notify_3_days
                    if dto.cabinet_notify_3_days is not None
                    else account.cabinet_notify_3_days
                ),
                cabinet_notify_1_day=True,
                live_activity_sleep_enabled=live_activity_sleep_enabled,
                live_activity_feeding_enabled=live_activity_feeding_enabled,
                live_activity_illness_enabled=live_activity_illness_enabled,
            )
        )
        return PushNotificationPreferencesResponseDto(
            before_reminder_minutes=updated.push_before_reminder_minutes,
            pillbox_before_reminder_minutes=updated.pillbox_push_before_reminder_minutes,
            due_reminder_enabled=True,
            cabinet_notify_10_days=updated.cabinet_notify_10_days,
            cabinet_notify_7_days=updated.cabinet_notify_7_days,
            cabinet_notify_3_days=updated.cabinet_notify_3_days,
            live_activity_sleep_enabled=updated.live_activity_sleep_enabled,
            live_activity_feeding_enabled=updated.live_activity_feeding_enabled,
            live_activity_illness_enabled=updated.live_activity_illness_enabled,
        )

    def _to_response(self, entity: PushSubscription) -> PushSubscriptionResponseDto:
        return PushSubscriptionResponseDto(
            id=entity.id,
            account_id=entity.account_id,
            channel=entity.channel,
            endpoint=entity.endpoint,
            native_token=entity.native_token,
            platform=entity.platform,
            expiration_time=entity.expiration_time,
            user_agent=entity.user_agent,
            device_label=entity.device_label,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    async def upsert_subscription(
        self,
        account_id: UUID,
        dto: PushSubscriptionUpsertDto,
    ) -> PushSubscriptionResponseDto:
        channel = dto.channel or ("native" if dto.native_token else "web")
        if channel == "native":
            native_token = (dto.native_token or dto.endpoint).strip()
            if not native_token:
                raise ValidationError("Для native push требуется token устройства")
            if dto.platform not in {"ios", "android"}:
                raise ValidationError("Для native push требуется platform: ios или android")
            endpoint = f"native:{dto.platform}:{native_token}"
            existing = await self._repo.get_by_native_token(native_token)
            p256dh_key = None
            auth_key = None
        else:
            if dto.keys is None:
                raise ValidationError("Для web push обязательны keys")
            endpoint = dto.endpoint.strip()
            if not endpoint:
                raise ValidationError("Для web push требуется endpoint")
            existing = await self._repo.get_by_endpoint(endpoint)
            native_token = None
            p256dh_key = dto.keys.p256dh
            auth_key = dto.keys.auth

        now = datetime.now(UTC)
        entity = PushSubscription(
            id=existing.id if existing else uuid4(),
            account_id=account_id,
            channel=channel,
            endpoint=endpoint,
            p256dh_key=p256dh_key,
            auth_key=auth_key,
            native_token=native_token,
            platform=dto.platform if channel == "native" else None,
            expiration_time=dto.expiration_time,
            user_agent=dto.user_agent,
            device_label=dto.device_label,
            created_at=existing.created_at if existing else now,
            updated_at=now,
        )

        saved = await self._repo.update(entity) if existing else await self._repo.add(entity)
        return self._to_response(saved)

    async def delete_subscription(
        self,
        account_id: UUID,
        dto: PushSubscriptionDeleteDto,
    ) -> None:
        existing = await self._repo.get_by_endpoint(dto.endpoint)
        if existing is None:
            existing = await self._repo.get_by_native_token(dto.endpoint)
        if not existing or existing.account_id != account_id:
            return
        await self._repo.delete(existing.id)

    async def send_test_notification(
        self,
        account_id: UUID,
        scheduler,
    ) -> PushNotificationTestResponseDto:
        subscriptions = await self._repo.get_by_account_id(account_id)
        if not subscriptions:
            return PushNotificationTestResponseDto(sent=False, subscription_count=0)

        payload = {
            "title": settings.app_name,
            "body": "Test push from Settings",
            "url": "/settings",
            "tag": f"push-test-{account_id}",
            "data": {
                "kind": "test",
                "source": "settings",
            },
        }
        sent = await scheduler._send_to_subscriptions(  # noqa: SLF001
            subscriptions=subscriptions,
            subscription_repo=self._repo,
            payload=payload,
        )
        return PushNotificationTestResponseDto(
            sent=sent,
            subscription_count=len(subscriptions),
        )
