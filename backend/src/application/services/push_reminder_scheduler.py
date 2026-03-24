"""Фоновый poller для отправки push-напоминаний по планам лекарства."""

from __future__ import annotations

import asyncio
import json
from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from src.application.services.safety_engine import calculate_household_medicine_status
from src.core.config import settings
from src.core.logging import get_logger
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.push_subscription import PushSubscription
from src.infrastructure.database.models.household_medicine import HouseholdMedicineModel
from src.infrastructure.database.models.household_medicine_notification_delivery import (
    HouseholdMedicineNotificationDeliveryModel,
)
from src.infrastructure.database.repositories.account_repository import SqlAccountRepository
from src.infrastructure.database.repositories.administration_event_repository import (
    SqlAdministrationEventRepository,
)
from src.infrastructure.database.repositories.child_repository import SqlChildRepository
from src.infrastructure.database.repositories.episode_medication_plan_repository import (
    SqlEpisodeMedicationPlanRepository,
)
from src.infrastructure.database.repositories.household_medicine_repository import (
    SqlHouseholdMedicineRepository,
)
from src.infrastructure.database.repositories.illness_episode_repository import (
    SqlIllnessEpisodeRepository,
)
from src.infrastructure.database.repositories.push_subscription_repository import (
    SqlPushSubscriptionRepository,
)

logger = get_logger(__name__)
DEFAULT_REMINDER_BEFORE_MINUTES = 10
OVERDUE_REMINDER_AFTER_MINUTES = 2
MEDICINE_CABINET_REMINDER_OFFSETS = (7, 3, 1)

try:
    from pywebpush import WebPushException, webpush
except ImportError:  # pragma: no cover - зависит от окружения
    WebPushException = Exception  # type: ignore[assignment]
    webpush = None

try:
    from py_vapid import Vapid01
except ImportError:  # pragma: no cover - зависит от окружения
    Vapid01 = None  # type: ignore[assignment]


def _format_due_body(child_name: str, medicine_name: str, dose_amount: str) -> str:
    dose_text = dose_amount.strip()
    if dose_text:
        return (
            f"Ребёнок: {child_name}\n"
            f"Лекарство: {medicine_name}\n"
            f"Доза: {dose_text}\n"
            "Откройте наблюдение и отметьте приём."
        )
    return (
        f"Ребёнок: {child_name}\n"
        f"Лекарство: {medicine_name}\n"
        "Сейчас пора дать препарат и отметить приём."
    )


def _format_overdue_body(child_name: str, medicine_name: str, dose_amount: str) -> str:
    dose_text = dose_amount.strip()
    if dose_text:
        return (
            f"Ребёнок: {child_name}\n"
            f"Лекарство: {medicine_name}\n"
            f"Доза: {dose_text}\n"
            "Приём ещё не отмечен. Если уже дали препарат, просто отметьте приём."
        )
    return (
        f"Ребёнок: {child_name}\n"
        f"Лекарство: {medicine_name}\n"
        "Приём ещё не отмечен. Если уже дали препарат, просто отметьте приём."
    )


def _format_before_body(
    child_name: str,
    medicine_name: str,
    dose_amount: str,
    reminder_before_minutes: int,
) -> str:
    dose_text = dose_amount.strip()
    if dose_text:
        return (
            f"Через {reminder_before_minutes} мин можно дать препарат.\n"
            f"Ребёнок: {child_name}\n"
            f"Лекарство: {medicine_name}\n"
            f"Доза: {dose_text}"
        )
    return (
        f"Через {reminder_before_minutes} мин можно дать препарат.\n"
        f"Ребёнок: {child_name}\n"
        f"Лекарство: {medicine_name}"
    )


def _normalize_medicine_name(value: str | None) -> str:
    return (value or "").strip().casefold()


def _format_days_label(days: int) -> str:
    if days % 10 == 1 and days % 100 != 11:
        return f"{days} день"
    if days % 10 in (2, 3, 4) and days % 100 not in (12, 13, 14):
        return f"{days} дня"
    return f"{days} дней"


def _get_cabinet_offsets(account: Any) -> list[int]:
    mapping = (
        (10, account.cabinet_notify_10_days),
        (7, account.cabinet_notify_7_days),
        (3, account.cabinet_notify_3_days),
    )
    optional_offsets = [days for days, enabled in mapping if enabled]
    return sorted({*optional_offsets, 1}, reverse=True)


def _build_cabinet_payload(
    medicine: HouseholdMedicine,
    target_date: date,
    days_before: int,
    is_opened_limit: bool,
) -> dict[str, Any]:
    label = "срок после вскрытия" if is_opened_limit else "срок годности"
    day_text = _format_days_label(days_before)
    return {
        "title": "Аптечка",
        "body": (
            f"Лекарство: {medicine.medicine_name}\n"
            f"Что истечёт: {label}\n"
            f"Когда: через {day_text}, до {target_date.strftime('%d.%m.%Y')}\n"
            "Проверьте упаковку в аптечке."
        ),
        "url": "/medicine-cabinet",
        "tag": f"cabinet-{medicine.id}-{target_date.isoformat()}-{days_before}",
        "data": {
            "medicineId": str(medicine.id),
            "targetDate": target_date.isoformat(),
            "daysBefore": days_before,
            "kind": "opened" if is_opened_limit else "expiry",
        },
    }


def _build_cabinet_expired_payload(
    medicine: HouseholdMedicine,
    target_date: date,
    is_opened_limit: bool,
) -> dict[str, Any]:
    label = "срок после вскрытия" if is_opened_limit else "срок годности"
    return {
        "title": "Аптечка",
        "body": (
            f"Лекарство: {medicine.medicine_name}\n"
            f"Истёк: {label}\n"
            f"Дата: {target_date.strftime('%d.%m.%Y')}\n"
            "Проверьте упаковку и при необходимости спишите препарат."
        ),
        "url": "/medicine-cabinet",
        "tag": f"cabinet-expired-{medicine.id}-{target_date.isoformat()}",
        "data": {
            "medicineId": str(medicine.id),
            "targetDate": target_date.isoformat(),
            "daysBefore": -1,
            "kind": "opened_expired" if is_opened_limit else "expired",
        },
    }


class PushNotificationScheduler:
    """Серверный фоновой poller для web push."""

    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory
        self._task: asyncio.Task[None] | None = None
        self._vapid_private_key = self._build_vapid_private_key()
        try:
            self._timezone = ZoneInfo(settings.app_timezone)
        except Exception:  # pragma: no cover - защита от битой timezone
            self._timezone = ZoneInfo("UTC")

    @property
    def is_enabled(self) -> bool:
        return settings.web_push_enabled and webpush is not None

    def _build_vapid_private_key(self) -> str | Any | None:
        private_key = settings.web_push_private_key_pem
        if not private_key:
            return None
        if "-----BEGIN" in private_key:
            if Vapid01 is None:
                return private_key
            return Vapid01.from_pem(private_key.encode("utf-8"))
        return private_key

    def start(self) -> None:
        if not self.is_enabled:
            if not settings.web_push_enabled:
                logger.info("push_scheduler_off | reason=no_vapid")
            elif webpush is None:
                logger.info("push_scheduler_off | reason=no_pywebpush")
            return
        if self._task is None:
            self._task = asyncio.create_task(self._run(), name="push-reminder-scheduler")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def _run(self) -> None:
        while True:
            try:
                await self._tick()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Push reminder scheduler tick failed.")
            await asyncio.sleep(max(settings.push_poll_interval_seconds, 1))

    async def _tick(self) -> None:
        async with self._session_factory() as session:
            plan_repo = SqlEpisodeMedicationPlanRepository(session)
            episode_repo = SqlIllnessEpisodeRepository(session)
            child_repo = SqlChildRepository(session)
            account_repo = SqlAccountRepository(session)
            medicine_repo = SqlHouseholdMedicineRepository(session)
            administration_repo = SqlAdministrationEventRepository(session)
            subscription_repo = SqlPushSubscriptionRepository(session)

            plans = await plan_repo.get_for_push_notifications()
            now = datetime.now(UTC)

            for plan in plans:
                episode = await episode_repo.get_by_id(plan.episode_id)
                if not episode or episode.status != "active":
                    continue

                child = await child_repo.get_by_id(episode.child_id)
                if not child:
                    continue

                account = await account_repo.get_by_family_id(child.family_id)
                if not account:
                    continue

                medicine = None
                medicine_name = (plan.custom_medicine_name or "").strip()
                if plan.household_medicine_id:
                    medicine = await medicine_repo.get_by_id(plan.household_medicine_id)
                    if not medicine:
                        continue
                    medicine_name = medicine.medicine_name
                elif not medicine_name:
                    continue

                administrations = await administration_repo.get_by_episode_id(episode.id)
                normalized_plan_name = _normalize_medicine_name(plan.custom_medicine_name)
                related = sorted(
                    (
                        entry
                        for entry in administrations
                        if (
                            plan.household_medicine_id
                            and entry.household_medicine_id == plan.household_medicine_id
                        )
                        or (
                            not plan.household_medicine_id
                            and _normalize_medicine_name(entry.custom_medicine_name)
                            == normalized_plan_name
                        )
                    ),
                    key=lambda entry: entry.administered_at,
                    reverse=True,
                )
                last_administration = related[0] if related else None
                if not last_administration:
                    continue

                today_count = sum(
                    1
                    for entry in related
                    if entry.administered_at.astimezone(self._timezone).date()
                    == now.astimezone(self._timezone).date()
                )
                if plan.max_doses_per_day and today_count >= plan.max_doses_per_day:
                    continue

                next_allowed_at = last_administration.administered_at + timedelta(
                    minutes=plan.min_interval_minutes
                )

                subscriptions = await subscription_repo.get_by_account_id(account.id)
                if not subscriptions:
                    continue

                preferred_before_minutes = (
                    account.push_before_reminder_minutes or DEFAULT_REMINDER_BEFORE_MINUTES
                )
                reminder_before_minutes = min(
                    preferred_before_minutes,
                    max(plan.min_interval_minutes - 1, 0),
                )
                if reminder_before_minutes > 0:
                    remind_at = next_allowed_at - timedelta(minutes=reminder_before_minutes)
                    if (
                        remind_at <= now < next_allowed_at
                        and plan.last_before_notification_for_at != next_allowed_at
                    ):
                        payload = {
                            "title": "Скоро можно дать",
                            "body": _format_before_body(
                                child.name,
                                medicine_name,
                                plan.dose_amount,
                                reminder_before_minutes,
                            ),
                            "url": "/illnesses/active",
                            "tag": f"plan-before-{plan.id}-{int(next_allowed_at.timestamp())}",
                            "data": {
                                "childId": str(child.id),
                                "episodeId": str(episode.id),
                                "planId": str(plan.id),
                            },
                        }
                        if await self._send_to_subscriptions(
                            subscriptions=subscriptions,
                            subscription_repo=subscription_repo,
                            payload=payload,
                        ):
                            updated = replace(plan, last_before_notification_for_at=next_allowed_at)
                            await plan_repo.update_notification_marks(updated)

                if now >= next_allowed_at and plan.last_due_notification_for_at != next_allowed_at:
                    payload = {
                        "title": "Пора дать",
                        "body": _format_due_body(
                            child.name,
                            medicine_name,
                            plan.dose_amount,
                        ),
                        "url": "/illnesses/active",
                        "tag": f"plan-due-{plan.id}-{int(next_allowed_at.timestamp())}",
                        "data": {
                            "childId": str(child.id),
                            "episodeId": str(episode.id),
                            "planId": str(plan.id),
                        },
                    }
                    if await self._send_to_subscriptions(
                        subscriptions=subscriptions,
                        subscription_repo=subscription_repo,
                        payload=payload,
                    ):
                        updated = replace(plan, last_due_notification_for_at=next_allowed_at)
                        await plan_repo.update_notification_marks(updated)

                overdue_at = next_allowed_at + timedelta(minutes=OVERDUE_REMINDER_AFTER_MINUTES)
                if now >= overdue_at and plan.last_overdue_notification_for_at != next_allowed_at:
                    payload = {
                        "title": "Приём не отмечен",
                        "body": _format_overdue_body(
                            child.name,
                            medicine_name,
                            plan.dose_amount,
                        ),
                        "url": "/illnesses/active",
                        "tag": f"plan-overdue-{plan.id}-{int(next_allowed_at.timestamp())}",
                        "data": {
                            "childId": str(child.id),
                            "episodeId": str(episode.id),
                            "planId": str(plan.id),
                        },
                    }
                    if await self._send_to_subscriptions(
                        subscriptions=subscriptions,
                        subscription_repo=subscription_repo,
                        payload=payload,
                    ):
                        updated = replace(plan, last_overdue_notification_for_at=next_allowed_at)
                        await plan_repo.update_notification_marks(updated)

            await self._process_household_medicine_reminders(
                session=session,
                account_repo=account_repo,
                medicine_repo=medicine_repo,
                subscription_repo=subscription_repo,
                now=now,
            )

            await session.commit()

    async def _process_household_medicine_reminders(
        self,
        *,
        session: Any,
        account_repo: SqlAccountRepository,
        medicine_repo: SqlHouseholdMedicineRepository,
        subscription_repo: SqlPushSubscriptionRepository,
        now: datetime,
    ) -> None:
        result = await session.execute(select(HouseholdMedicineModel.family_id).distinct())
        family_ids = [family_id for family_id in result.scalars().all() if family_id is not None]
        today = now.astimezone(self._timezone).date()

        for family_id in family_ids:
            account = await account_repo.get_by_family_id(family_id)
            if not account:
                continue
            reminder_offsets = _get_cabinet_offsets(account)

            subscriptions = await subscription_repo.get_by_account_id(account.id)
            if not subscriptions:
                continue

            medicines = await medicine_repo.get_by_family_id(family_id)
            for medicine in medicines:
                await self._process_single_household_medicine(
                    session=session,
                    subscriptions=subscriptions,
                    subscription_repo=subscription_repo,
                    medicine=medicine,
                    reminder_offsets=reminder_offsets,
                    today=today,
                    now=now,
                )

    async def _process_single_household_medicine(
        self,
        *,
        session: Any,
        subscriptions: list[PushSubscription],
        subscription_repo: SqlPushSubscriptionRepository,
        medicine: HouseholdMedicine,
        reminder_offsets: list[int],
        today: date,
        now: datetime,
    ) -> None:
        status = calculate_household_medicine_status(medicine, today=today)
        target_date = status["expiry_alert_date"]
        if not target_date:
            return

        days_until = (target_date - today).days
        if days_until == -1:
            await self._send_expired_household_medicine_notification(
                session=session,
                subscriptions=subscriptions,
                subscription_repo=subscription_repo,
                medicine=medicine,
                target_date=target_date,
                is_opened_limit=(
                    status["opened_expires_at"] is not None
                    and status["opened_expires_at"] == target_date
                ),
                now=now,
            )
            return

        if days_until not in reminder_offsets or days_until <= 0:
            return

        is_opened_limit = (
            status["opened_expires_at"] is not None and status["opened_expires_at"] == target_date
        )
        notification_kind = "opened_limit" if is_opened_limit else "expiry_date"

        already_sent_result = await session.execute(
            select(HouseholdMedicineNotificationDeliveryModel.id).where(
                HouseholdMedicineNotificationDeliveryModel.household_medicine_id == medicine.id,
                HouseholdMedicineNotificationDeliveryModel.notification_kind == notification_kind,
                HouseholdMedicineNotificationDeliveryModel.target_date == target_date,
                HouseholdMedicineNotificationDeliveryModel.days_before == days_until,
            )
        )
        if already_sent_result.scalar_one_or_none() is not None:
            return

        payload = _build_cabinet_payload(
            medicine=medicine,
            target_date=target_date,
            days_before=days_until,
            is_opened_limit=is_opened_limit,
        )
        sent = await self._send_to_subscriptions(
            subscriptions=subscriptions,
            subscription_repo=subscription_repo,
            payload=payload,
        )
        if not sent:
            return

        session.add(
            HouseholdMedicineNotificationDeliveryModel(
                household_medicine_id=medicine.id,
                notification_kind=notification_kind,
                target_date=target_date,
                days_before=days_until,
                sent_at=now,
            )
        )

    async def _send_expired_household_medicine_notification(
        self,
        *,
        session: Any,
        subscriptions: list[PushSubscription],
        subscription_repo: SqlPushSubscriptionRepository,
        medicine: HouseholdMedicine,
        target_date: date,
        is_opened_limit: bool,
        now: datetime,
    ) -> None:
        notification_kind = "opened_expired" if is_opened_limit else "expired"
        already_sent_result = await session.execute(
            select(HouseholdMedicineNotificationDeliveryModel.id).where(
                HouseholdMedicineNotificationDeliveryModel.household_medicine_id == medicine.id,
                HouseholdMedicineNotificationDeliveryModel.notification_kind == notification_kind,
                HouseholdMedicineNotificationDeliveryModel.target_date == target_date,
                HouseholdMedicineNotificationDeliveryModel.days_before == -1,
            )
        )
        if already_sent_result.scalar_one_or_none() is not None:
            return

        payload = _build_cabinet_expired_payload(
            medicine=medicine,
            target_date=target_date,
            is_opened_limit=is_opened_limit,
        )
        sent = await self._send_to_subscriptions(
            subscriptions=subscriptions,
            subscription_repo=subscription_repo,
            payload=payload,
        )
        if not sent:
            return

        session.add(
            HouseholdMedicineNotificationDeliveryModel(
                household_medicine_id=medicine.id,
                notification_kind=notification_kind,
                target_date=target_date,
                days_before=-1,
                sent_at=now,
            )
        )

    async def _send_to_subscriptions(
        self,
        subscriptions: list[PushSubscription],
        subscription_repo: SqlPushSubscriptionRepository,
        payload: dict[str, Any],
    ) -> bool:
        sent = False
        for subscription in subscriptions:
            try:
                await asyncio.to_thread(
                    webpush,
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.p256dh_key,
                            "auth": subscription.auth_key,
                        },
                    },
                    data=json.dumps(payload, ensure_ascii=False),
                    vapid_private_key=self._vapid_private_key,
                    vapid_claims={"sub": settings.web_push_subject},
                )
                sent = True
            except WebPushException as exc:  # pragma: no branch - статусы зависят от клиента
                response = getattr(exc, "response", None)
                status_code = getattr(response, "status_code", None) or getattr(
                    response, "status", None
                )
                if status_code in {404, 410}:
                    logger.info(f"stale_push_subscription | endpoint={subscription.endpoint}")
                    await subscription_repo.delete(subscription.id)
                    continue
                logger.warning(
                    f"push_delivery_failed | subscription_id={subscription.id} error={exc!s}"
                )
            except Exception as exc:  # pragma: no cover - сеть/SSL/библиотека
                logger.warning(
                    f"push_delivery_failed | subscription_id={subscription.id} error={exc!s}"
                )
        return sent
