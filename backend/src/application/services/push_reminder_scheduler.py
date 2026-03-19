"""Фоновый poller для отправки push-напоминаний по планам лекарства."""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import async_sessionmaker

from src.core.config import settings
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.entities.push_subscription import PushSubscription
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

logger = logging.getLogger(__name__)
DEFAULT_REMINDER_BEFORE_MINUTES = 10

try:
    from pywebpush import WebPushException, webpush
except ImportError:  # pragma: no cover - зависит от окружения
    WebPushException = Exception  # type: ignore[assignment]
    webpush = None

try:
    from py_vapid import Vapid01
except ImportError:  # pragma: no cover - зависит от окружения
    Vapid01 = None  # type: ignore[assignment]


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
                logger.info("Push scheduler disabled: VAPID keys are not configured.")
            elif webpush is None:
                logger.info("Push scheduler disabled: pywebpush is not installed.")
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

                medicine = await medicine_repo.get_by_id(plan.household_medicine_id)
                if not medicine:
                    continue

                administrations = await administration_repo.get_by_episode_id(episode.id)
                related = sorted(
                    (
                        entry
                        for entry in administrations
                        if entry.household_medicine_id == plan.household_medicine_id
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
                    minutes=plan.min_interval_hours
                )

                subscriptions = await subscription_repo.get_by_account_id(account.id)
                if not subscriptions:
                    continue

                preferred_before_minutes = account.push_before_reminder_minutes or DEFAULT_REMINDER_BEFORE_MINUTES
                reminder_before_minutes = min(
                    preferred_before_minutes,
                    max(plan.min_interval_hours - 1, 0),
                )
                if reminder_before_minutes > 0:
                    remind_at = next_allowed_at - timedelta(minutes=reminder_before_minutes)
                    if (
                        remind_at <= now < next_allowed_at
                        and plan.last_before_notification_for_at != next_allowed_at
                    ):
                        payload = {
                            "title": f"{medicine.medicine_name} скоро можно дать",
                            "body": (
                                f"{child.name}: через {reminder_before_minutes} мин можно дать "
                                f"{plan.dose_amount}."
                            ),
                            "url": f"/children/{child.id}/illness",
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
                        "title": f"Можно дать {medicine.medicine_name}",
                        "body": f"{child.name}: сейчас можно дать {plan.dose_amount}.",
                        "url": f"/children/{child.id}/illness",
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

            await session.commit()

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
                status_code = getattr(response, "status_code", None) or getattr(response, "status", None)
                if status_code in {404, 410}:
                    logger.info("Removing stale push subscription: %s", subscription.endpoint)
                    await subscription_repo.delete(subscription.id)
                    continue
                logger.warning("Push delivery failed for subscription %s: %s", subscription.id, exc)
            except Exception as exc:  # pragma: no cover - сеть/SSL/библиотека
                logger.warning("Push delivery failed for subscription %s: %s", subscription.id, exc)
        return sent
