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

    before_reminder_minutes: int
    pillbox_before_reminder_minutes: int
    due_reminder_enabled: bool = True
    cabinet_notify_10_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_3_days: bool


class PushNotificationPreferencesUpdateDto(BaseModel):
    """Обновление настроек push-напоминаний аккаунта."""

    before_reminder_minutes: int | None = Field(
        None, description="За сколько минут прислать раннее напоминание"
    )
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
    expiration_time: datetime | None
    user_agent: str | None
    device_label: str | None
    created_at: datetime
    updated_at: datetime
