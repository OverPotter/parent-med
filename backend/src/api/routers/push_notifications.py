"""Роуты для web push-уведомлений."""

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_push_notification_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.push_notification import (
    PushNotificationConfigResponseDto,
    PushNotificationPreferencesResponseDto,
    PushNotificationPreferencesUpdateDto,
    PushNotificationTestResponseDto,
    PushSubscriptionDeleteDto,
    PushSubscriptionResponseDto,
    PushSubscriptionUpsertDto,
)
from src.application.services.push_notification_service import PushNotificationService
from src.core.config import settings
from src.core.lifespan import get_push_scheduler

router = APIRouter(prefix="/push-notifications", tags=["push-notifications"])


@router.get("/config", response_model=PushNotificationConfigResponseDto)
async def get_push_config(
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushNotificationConfigResponseDto:
    """Публичный конфиг web push для фронта."""
    return service.get_config()


@router.get("/preferences", response_model=PushNotificationPreferencesResponseDto)
async def get_push_preferences(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushNotificationPreferencesResponseDto:
    """Текущие настройки push-напоминаний аккаунта."""
    return await service.get_preferences(current_account.id)


@router.patch("/preferences", response_model=PushNotificationPreferencesResponseDto)
async def update_push_preferences(
    dto: PushNotificationPreferencesUpdateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushNotificationPreferencesResponseDto:
    """Обновить настройки push-напоминаний аккаунта."""
    return await service.update_preferences(current_account.id, dto)


@router.post("/subscriptions", response_model=PushSubscriptionResponseDto, status_code=201)
async def upsert_push_subscription(
    dto: PushSubscriptionUpsertDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushSubscriptionResponseDto:
    """Зарегистрировать или обновить подписку текущего устройства."""
    return await service.upsert_subscription(current_account.id, dto)


@router.delete("/subscriptions", status_code=204)
async def delete_push_subscription(
    dto: PushSubscriptionDeleteDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> None:
    """Удалить подписку текущего устройства."""
    await service.delete_subscription(current_account.id, dto)


@router.post("/test", response_model=PushNotificationTestResponseDto)
async def send_test_push_notification(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushNotificationTestResponseDto:
    """Отправить тестовый push в подписки текущего аккаунта."""
    if not settings.debug:
        raise HTTPException(status_code=404, detail="Not Found")
    scheduler = get_push_scheduler()
    return await service.send_test_notification(current_account.id, scheduler)


@router.post("/test/cabinet", response_model=PushNotificationTestResponseDto)
async def send_cabinet_test_push_notification(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PushNotificationService = Depends(get_push_notification_service),
) -> PushNotificationTestResponseDto:
    """Отправить тестовый push именно в формате аптечки."""
    if not settings.debug:
        raise HTTPException(status_code=404, detail="Not Found")
    scheduler = get_push_scheduler()
    return await service.send_cabinet_test_notification(current_account.id, scheduler)
