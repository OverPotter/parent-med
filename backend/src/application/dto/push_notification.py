"""DTO для web push-подписок и конфигурации."""

from datetime import datetime
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
    due_reminder_enabled: bool = True
    cabinet_notify_30_days: bool
    cabinet_notify_15_days: bool
    cabinet_notify_7_days: bool
    cabinet_notify_1_day: bool


class PushNotificationPreferencesUpdateDto(BaseModel):
    """Обновление настроек push-напоминаний аккаунта."""

    before_reminder_minutes: int | None = Field(
        None, description="За сколько минут прислать раннее напоминание"
    )
    cabinet_notify_30_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 30 дней"
    )
    cabinet_notify_15_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 15 дней"
    )
    cabinet_notify_7_days: bool | None = Field(
        None, description="Присылать reminder по аптечке за 7 дней"
    )
    cabinet_notify_1_day: bool | None = Field(
        None, description="Присылать reminder по аптечке за 1 день"
    )


class PushSubscriptionKeysDto(BaseModel):
    """Ключи browser push-подписки."""

    p256dh: str
    auth: str


class PushSubscriptionUpsertDto(BaseModel):
    """Регистрация или обновление push-подписки устройства."""

    endpoint: str = Field(..., description="Push endpoint браузера")
    expiration_time: datetime | None = Field(None, description="Время истечения подписки браузера")
    keys: PushSubscriptionKeysDto
    user_agent: str | None = Field(None, description="User-Agent устройства")
    device_label: str | None = Field(None, description="Короткая подпись устройства")


class PushSubscriptionDeleteDto(BaseModel):
    """Удаление push-подписки устройства."""

    endpoint: str


class PushSubscriptionResponseDto(ResponseBase):
    """Ответ с push-подпиской устройства."""

    id: UUID
    account_id: UUID
    endpoint: str
    expiration_time: datetime | None
    user_agent: str | None
    device_label: str | None
    created_at: datetime
    updated_at: datetime
