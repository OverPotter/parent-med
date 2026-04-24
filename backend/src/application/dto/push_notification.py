"""DTO для push-подписок и конфигурации."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class PushNotificationConfigResponseDto(ResponseBase):
    """Конфиг web push для фронта."""

    enabled: bool
    vapid_public_key: str | None


class PushNotificationPreferencesResponseDto(ResponseBase):
    """Настройки push-напоминаний на уровне аккаунта."""

    children_enabled: bool = True
    before_reminder_minutes: int
    pillbox_enabled: bool = True
    pillbox_before_reminder_minutes: int
    cabinet_notify_10_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_3_days: bool
    live_activity_sleep_enabled: bool = True
    live_activity_feeding_enabled: bool = True
    live_activity_illness_enabled: bool = True


class PushNotificationPreferencesUpdateDto(BaseModel):
    """Обновление настроек push-напоминаний аккаунта."""

    children_enabled: bool | None = Field(None, description="Разрешены push по детям")
    before_reminder_minutes: int | None = Field(
        None, description="За сколько минут прислать раннее напоминание"
    )
    pillbox_enabled: bool | None = Field(None, description="Разрешены push по таблетнице")
    pillbox_before_reminder_minutes: int | None = Field(
        None, description="За сколько минут прислать раннее напоминание для таблетницы"
    )
    cabinet_notify_10_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 10 дней"
    )
    cabinet_notify_7_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 7 дней"
    )
    cabinet_notify_3_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 3 дня"
    )
    live_activity_sleep_enabled: bool | None = Field(
        None, description="Показывать live activity для сна"
    )
    live_activity_feeding_enabled: bool | None = Field(
        None, description="Показывать live activity для кормления"
    )
    live_activity_illness_enabled: bool | None = Field(
        None, description="Показывать live activity для болезни"
    )


class PushSubscriptionKeysDto(BaseModel):
    """Ключи browser push-подписки (web)."""

    p256dh: str
    auth: str


class PushSubscriptionUpsertDto(BaseModel):
    """Регистрация или обновление push-подписки устройства."""

    channel: Literal["web", "native"] | None = Field(
        None, description="Канал подписки: web или native"
    )
    endpoint: str = Field(..., description="Идентификатор подписки (web endpoint или native key)")
    native_token: str | None = Field(None, description="Нативный push token устройства")
    platform: Literal["ios", "android"] | None = Field(
        None, description="Платформа нативного токена"
    )
    device_id: str | None = Field(None, description="Стабильный идентификатор устройства")
    expiration_time: datetime | None = Field(None, description="Время истечения подписки браузера")
    keys: PushSubscriptionKeysDto | None = None
    user_agent: str | None = Field(None, description="User-Agent устройства")
    device_label: str | None = Field(None, description="Короткая подпись устройства")


class PushSubscriptionDeleteDto(BaseModel):
    """Удаление push-подписки устройства."""

    endpoint: str


class PushSubscriptionResponseDto(ResponseBase):
    """Ответ с push-подпиской устройства."""

    id: UUID
    account_id: UUID
    channel: Literal["web", "native"]
    endpoint: str
    native_token: str | None
    platform: str | None
    device_id: str | None
    expiration_time: datetime | None
    user_agent: str | None
    device_label: str | None
    created_at: datetime
    updated_at: datetime


class PushNotificationTestResponseDto(ResponseBase):
    """Результат отправки тестового push."""

    sent: bool
    subscription_count: int
