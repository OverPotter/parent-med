"""Сервис управления web push-подписками устройства."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.push_notification import (
    PushNotificationConfigResponseDto,
    PushNotificationPreferencesResponseDto,
    PushNotificationPreferencesUpdateDto,
    PushSubscriptionDeleteDto,
    PushSubscriptionResponseDto,
    PushSubscriptionUpsertDto,
)
from src.core.config import settings
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.account import Account
from src.domain.repositories.account_repository import AccountRepository
from src.domain.entities.push_subscription import PushSubscription
from src.domain.repositories.push_subscription_repository import PushSubscriptionRepository


class PushNotificationService:
    """Работа с push-подписками и конфигом VAPID."""

    ALLOWED_BEFORE_REMINDER_MINUTES = {5, 10, 15, 20}

    def __init__(
        self,
        subscription_repo: PushSubscriptionRepository,
        account_repo: AccountRepository,
    ) -> None:
        self._repo = subscription_repo
        self._account_repo = account_repo

    def get_config(self) -> PushNotificationConfigResponseDto:
        return PushNotificationConfigResponseDto(
            enabled=settings.web_push_enabled,
            vapid_public_key=settings.web_push_public_key,
        )

    async def get_preferences(self, account_id: UUID) -> PushNotificationPreferencesResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if not account:
            raise NotFoundError("Аккаунт не найден", resource="account")
        return PushNotificationPreferencesResponseDto(
            before_reminder_minutes=account.push_before_reminder_minutes,
            due_reminder_enabled=True,
            cabinet_notify_10_days=account.cabinet_notify_10_days,
            cabinet_notify_7_days=account.cabinet_notify_7_days,
            cabinet_notify_3_days=account.cabinet_notify_3_days,
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
        if dto.before_reminder_minutes is not None:
            if dto.before_reminder_minutes not in self.ALLOWED_BEFORE_REMINDER_MINUTES:
                raise ValidationError("Можно выбрать только 5, 10, 15 или 20 минут")
            before_reminder_minutes = dto.before_reminder_minutes

        if (
            dto.before_reminder_minutes is None
            and dto.cabinet_notify_10_days is None
            and dto.cabinet_notify_7_days is None
            and dto.cabinet_notify_3_days is None
        ):
            return await self.get_preferences(account_id)

        updated = await self._account_repo.update(
            Account(
                id=account.id,
                email=account.email,
                password_hash=account.password_hash,
                family_id=account.family_id,
                push_before_reminder_minutes=before_reminder_minutes,
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
                created_at=account.created_at,
            )
        )
        return PushNotificationPreferencesResponseDto(
            before_reminder_minutes=updated.push_before_reminder_minutes,
            due_reminder_enabled=True,
            cabinet_notify_10_days=updated.cabinet_notify_10_days,
            cabinet_notify_7_days=updated.cabinet_notify_7_days,
            cabinet_notify_3_days=updated.cabinet_notify_3_days,
        )

    def _to_response(self, entity: PushSubscription) -> PushSubscriptionResponseDto:
        return PushSubscriptionResponseDto(
            id=entity.id,
            account_id=entity.account_id,
            endpoint=entity.endpoint,
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
        existing = await self._repo.get_by_endpoint(dto.endpoint)
        now = datetime.now(UTC)

        entity = PushSubscription(
            id=existing.id if existing else uuid4(),
            account_id=account_id,
            endpoint=dto.endpoint,
            p256dh_key=dto.keys.p256dh,
            auth_key=dto.keys.auth,
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
        if not existing or existing.account_id != account_id:
            return
        await self._repo.delete(existing.id)
