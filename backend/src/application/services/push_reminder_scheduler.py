"""Фоновый poller для отправки push-напоминаний по планам лекарства."""

from __future__ import annotations

import asyncio
import base64
import json
from datetime import UTC, date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import selectinload

from src.application.services.safety_engine import calculate_household_medicine_status
from src.core.config import settings
from src.core.logging import get_logger
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.push_subscription import PushSubscription
from src.infrastructure.database.models.household_medicine import HouseholdMedicineModel
from src.infrastructure.database.models.household_medicine_notification_delivery import (
    HouseholdMedicineNotificationDeliveryModel,
)
from src.infrastructure.database.models.illness_notification_delivery import (
    IllnessNotificationDeliveryModel,
)
from src.infrastructure.database.models.pillbox import (
    PillboxMedicationModel,
    PillboxNotificationDeliveryModel,
    PillboxPlanModel,
)
from src.infrastructure.database.repositories.account_repository import SqlAccountRepository
from src.infrastructure.database.repositories.administration_event_repository import (
    SqlAdministrationEventRepository,
)
from src.infrastructure.database.repositories.child_repository import SqlChildRepository
from src.infrastructure.database.repositories.episode_medication_plan_repository import (
    SqlEpisodeMedicationPlanRepository,
)
from src.infrastructure.database.repositories.family_repository import SqlFamilyRepository
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

try:
    import httpx
except ImportError:  # pragma: no cover - зависит от окружения
    httpx = None  # type: ignore[assignment]

try:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec, utils
except ImportError:  # pragma: no cover - зависит от окружения
    hashes = None  # type: ignore[assignment]
    serialization = None  # type: ignore[assignment]
    ec = None  # type: ignore[assignment]
    utils = None  # type: ignore[assignment]


APNS_PRODUCTION_URL = "https://api.push.apple.com/3/device"
APNS_SANDBOX_URL = "https://api.sandbox.push.apple.com/3/device"
APNS_STALE_REASONS = {
    "BadDeviceToken",
    "DeviceTokenNotForTopic",
    "Unregistered",
}
WEB_PUSH_STALE_REASONS = {
    "VapidPkHashMismatch",
}


def _normalize_language(value: str | None) -> str:
    return "en" if value == "en" else "ru"


def _is_push_allowed_for_account(account: Any, channel: str) -> bool:
    if channel == "illness":
        return bool(getattr(account, "children_push_enabled", True))
    if channel == "pillbox":
        return bool(getattr(account, "pillbox_push_enabled", True))
    policy = getattr(account, "access_policy", None)
    if policy is None:
        return True
    if channel != "cabinet":
        return True
    if getattr(policy, "cabinet_access", "none") == "none":
        return False
    return bool(getattr(policy, "cabinet_push_enabled", True))


def _has_child_signal_access(account: Any, child_id: Any) -> bool:
    policy = getattr(account, "access_policy", None)
    if policy is None:
        return False
    if getattr(policy, "all_children", False):
        return True
    return child_id in set(getattr(policy, "child_ids", []))


def _can_receive_illness_push(account: Any, child_id: Any) -> bool:
    return _is_push_allowed_for_account(account, "illness") and _has_child_signal_access(
        account, child_id
    )


def _can_receive_pillbox_push(account: Any) -> bool:
    policy = getattr(account, "access_policy", None)
    if policy is None:
        return False
    return (
        _is_push_allowed_for_account(account, "pillbox")
        and getattr(policy, "pillbox_access", "none") != "none"
    )


def _get_pillbox_target_account_ids(plan: Any) -> list[Any]:
    return list(getattr(plan, "member_account_ids", []) or [])


def _resolve_illness_next_allowed_at(
    plan: Any,
    last_administration: Any | None,
) -> datetime:
    anchor_at = (
        last_administration.administered_at
        if last_administration is not None
        else getattr(plan, "created_at")
    )
    return anchor_at + timedelta(minutes=plan.min_interval_minutes)


def _format_date(value: date, language: str) -> str:
    if language == "en":
        return value.strftime("%b %d, %Y")
    return value.strftime("%d.%m.%Y")


def _format_due_body(
    child_name: str,
    medicine_name: str,
    dose_amount: str,
    scheduled_time_label: str,
    language: str,
) -> str:
    dose_text = dose_amount.strip()
    summary_label = dose_text or medicine_name
    if language == "en":
        return f"{summary_label} · {child_name} · {scheduled_time_label}"
    return f"{summary_label} · {child_name} · в {scheduled_time_label}"


def _format_overdue_body(
    child_name: str,
    medicine_name: str,
    dose_amount: str,
    scheduled_time_label: str,
    language: str,
) -> str:
    dose_text = dose_amount.strip()
    summary_label = dose_text or medicine_name
    if language == "en":
        return f"{summary_label} · {child_name} · not marked since {scheduled_time_label}"
    return f"{summary_label} · {child_name} · не отмечено с {scheduled_time_label}"


def _format_before_body(
    child_name: str,
    medicine_name: str,
    dose_amount: str,
    reminder_before_minutes: int,
    scheduled_time_label: str,
    language: str,
) -> str:
    dose_text = dose_amount.strip()
    summary_label = dose_text or medicine_name
    if language == "en":
        return f"{summary_label} · {child_name} · at {scheduled_time_label}"
    return f"{summary_label} · {child_name} · в {scheduled_time_label}"


def _format_pillbox_due_body(
    summary_label: str,
    recipient_label: str,
    scheduled_time_label: str,
    language: str,
) -> str:
    if language == "en":
        return f"{summary_label} · For: {recipient_label} · {scheduled_time_label}"
    return f"{summary_label} · Кому: {recipient_label} · в {scheduled_time_label}"


def _format_pillbox_before_body(
    summary_label: str,
    recipient_label: str,
    reminder_before_minutes: int,
    scheduled_time_label: str,
    language: str,
) -> str:
    if language == "en":
        return f"{summary_label} · For: {recipient_label} · at {scheduled_time_label}"
    return f"{summary_label} · Кому: {recipient_label} · в {scheduled_time_label}"


def _format_pillbox_overdue_body(
    summary_label: str,
    recipient_label: str,
    scheduled_time_label: str,
    language: str,
) -> str:
    if language == "en":
        return f"{summary_label} · For: {recipient_label} · not marked since {scheduled_time_label}"
    return f"{summary_label} · Кому: {recipient_label} · не отмечено с {scheduled_time_label}"


def _format_pillbox_meal_rule(meal_rule: str, language: str) -> str:
    if meal_rule == "before_meal":
        return "before meal" if language == "en" else "до еды"
    if meal_rule == "with_meal":
        return "with meal" if language == "en" else "во время еды"
    return "after meal" if language == "en" else "после еды"


def _normalize_medicine_name(value: str | None) -> str:
    return (value or "").strip().casefold()


def _resolve_account_recipient_label(account: Any, language: str) -> str:
    display_name = (getattr(account, "display_name", None) or "").strip()
    if display_name:
        return display_name
    return "you" if language == "en" else "вас"


def _format_days_label(days: int) -> str:
    if days % 10 == 1 and days % 100 != 11:
        return f"{days} день"
    if days % 10 in (2, 3, 4) and days % 100 not in (12, 13, 14):
        return f"{days} дня"
    return f"{days} дней"


def _format_days_label_en(days: int) -> str:
    return f"{days} day" if days == 1 else f"{days} days"


def _extract_web_push_error_reason(response: Any) -> str | None:
    if response is None:
        return None
    try:
        payload = response.json()
    except Exception:
        payload = None
    if isinstance(payload, dict):
        reason = payload.get("reason")
        return str(reason) if reason else None
    body = getattr(response, "text", None)
    if isinstance(body, str):
        try:
            payload = json.loads(body)
        except Exception:
            return None
        if isinstance(payload, dict):
            reason = payload.get("reason")
            return str(reason) if reason else None
    return None


def _is_stale_web_push_response(status_code: int | None, reason: str | None) -> bool:
    return status_code in {404, 410} or reason in WEB_PUSH_STALE_REASONS


def _get_cabinet_offsets(account: Any) -> list[int]:
    mapping = (
        (10, account.cabinet_notify_10_days),
        (7, account.cabinet_notify_7_days),
        (3, account.cabinet_notify_3_days),
    )
    return sorted([days for days, enabled in mapping if enabled], reverse=True)


def _build_cabinet_payload(
    medicine: HouseholdMedicine,
    target_date: date,
    days_before: int,
    is_opened_limit: bool,
    language: str,
) -> dict[str, Any]:
    if language == "en":
        label = "opened shelf life" if is_opened_limit else "expiry date"
        day_text = _format_days_label_en(days_before)
        return {
            "title": f"Expires in {day_text}: {medicine.medicine_name}",
            "body": (
                f"{label.capitalize()} · by {_format_date(target_date, language)}\n"
                "Check the package in your cabinet."
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
    label = "срок после вскрытия" if is_opened_limit else "срок годности"
    day_text = _format_days_label(days_before)
    return {
        "title": f"Через {day_text} истекает срок: {medicine.medicine_name}",
        "body": (
            f"{label.capitalize()} · до {target_date.strftime('%d.%m.%Y')}\n"
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
    language: str,
) -> dict[str, Any]:
    if language == "en":
        label = "opened shelf life" if is_opened_limit else "expiry date"
        return {
            "title": f"Expired: {medicine.medicine_name}",
            "body": (
                f"{label.capitalize()} · {_format_date(target_date, language)}\n"
                "Check and discard if needed."
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
    label = "срок после вскрытия" if is_opened_limit else "срок годности"
    return {
        "title": f"Истёк срок: {medicine.medicine_name}",
        "body": (
            f"{label.capitalize()} · {target_date.strftime('%d.%m.%Y')}\n"
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
    """Серверный фоновой poller для web/native push."""

    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory
        self._task: asyncio.Task[None] | None = None
        self._vapid_private_key = self._build_vapid_private_key()
        self._apns_token: str | None = None
        self._apns_token_issued_at = 0
        try:
            self._timezone = ZoneInfo(settings.app_timezone)
        except Exception:  # pragma: no cover - защита от битой timezone
            self._timezone = ZoneInfo("UTC")

    @property
    def is_enabled(self) -> bool:
        return (settings.web_push_enabled and webpush is not None) or self._apns_available

    def _build_vapid_private_key(self) -> str | Any | None:
        private_key = settings.web_push_private_key_pem
        if not private_key:
            return None
        if "-----BEGIN" in private_key:
            if Vapid01 is None:
                return private_key
            return Vapid01.from_pem(private_key.encode("utf-8"))
        return private_key

    @property
    def _apns_available(self) -> bool:
        return bool(settings.apns_enabled and httpx is not None and serialization is not None)

    def start(self) -> None:
        if not self.is_enabled:
            reasons: list[str] = []
            if not settings.web_push_enabled:
                reasons.append("no_vapid")
            elif webpush is None:
                reasons.append("no_pywebpush")
            if not settings.apns_enabled:
                reasons.append("no_apns")
            elif httpx is None:
                reasons.append("no_httpx")
            elif serialization is None:
                reasons.append("no_cryptography")
            logger.info(f"push_scheduler_off | reason={','.join(reasons) or 'not_configured'}")
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

                family_accounts = await account_repo.list_by_family_id(child.family_id)
                if not family_accounts:
                    continue

                eligible_accounts = [
                    account
                    for account in family_accounts
                    if _can_receive_illness_push(account, child.id)
                ]
                selected_account_ids = list(episode.member_account_ids or [])
                if not selected_account_ids:
                    selected_account_ids = list(plan.member_account_ids or [])
                if selected_account_ids:
                    selected_id_set = set(selected_account_ids)
                    accounts = [
                        account for account in eligible_accounts if account.id in selected_id_set
                    ]
                else:
                    accounts = eligible_accounts
                if not accounts:
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

                today_count = sum(
                    1
                    for entry in related
                    if entry.administered_at.astimezone(self._timezone).date()
                    == now.astimezone(self._timezone).date()
                )
                if plan.max_doses_per_day and today_count >= plan.max_doses_per_day:
                    continue

                next_allowed_at = _resolve_illness_next_allowed_at(plan, last_administration)
                next_allowed_local_label = next_allowed_at.astimezone(self._timezone).strftime(
                    "%H:%M"
                )

                for account in accounts:
                    subscriptions = await subscription_repo.get_by_account_id(account.id)
                    if not subscriptions:
                        continue

                    preferred_before_minutes = (
                        account.push_before_reminder_minutes
                        if account.push_before_reminder_minutes is not None
                        else DEFAULT_REMINDER_BEFORE_MINUTES
                    )
                    language = _normalize_language(account.preferred_language)
                    reminder_before_minutes = min(
                        preferred_before_minutes,
                        max(plan.min_interval_minutes - 1, 0),
                    )
                    remind_at = next_allowed_at - timedelta(minutes=reminder_before_minutes)
                    overdue_at = next_allowed_at + timedelta(minutes=OVERDUE_REMINDER_AFTER_MINUTES)

                    if reminder_before_minutes > 0:
                        before_delivered = await self._has_illness_delivery(
                            session=session,
                            account_id=account.id,
                            plan_id=plan.id,
                            notification_kind="before",
                            scheduled_for=next_allowed_at,
                        )
                        if remind_at <= now < next_allowed_at and not before_delivered:
                            payload = {
                                "title": (
                                    (f"In {reminder_before_minutes} min: {medicine_name}")
                                    if language == "en"
                                    else (f"Через {reminder_before_minutes} мин: {medicine_name}")
                                ),
                                "body": _format_before_body(
                                    child.name,
                                    medicine_name,
                                    plan.dose_amount,
                                    reminder_before_minutes,
                                    next_allowed_local_label,
                                    language,
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
                                self._record_illness_delivery(
                                    session=session,
                                    family_id=child.family_id,
                                    account_id=account.id,
                                    plan_id=plan.id,
                                    notification_kind="before",
                                    scheduled_for=next_allowed_at,
                                    now=now,
                                )

                    due_delivered = await self._has_illness_delivery(
                        session=session,
                        account_id=account.id,
                        plan_id=plan.id,
                        notification_kind="due",
                        scheduled_for=next_allowed_at,
                    )
                    if now >= next_allowed_at and not due_delivered:
                        payload = {
                            "title": (
                                f"Time to give: {medicine_name}"
                                if language == "en"
                                else f"Пора дать: {medicine_name}"
                            ),
                            "body": _format_due_body(
                                child.name,
                                medicine_name,
                                plan.dose_amount,
                                next_allowed_local_label,
                                language,
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
                            self._record_illness_delivery(
                                session=session,
                                family_id=child.family_id,
                                account_id=account.id,
                                plan_id=plan.id,
                                notification_kind="due",
                                scheduled_for=next_allowed_at,
                                now=now,
                            )

                    overdue_delivered = await self._has_illness_delivery(
                        session=session,
                        account_id=account.id,
                        plan_id=plan.id,
                        notification_kind="overdue",
                        scheduled_for=next_allowed_at,
                    )
                    if now >= overdue_at and not overdue_delivered:
                        payload = {
                            "title": (
                                f"Check dose: {medicine_name}"
                                if language == "en"
                                else f"Проверьте приём: {medicine_name}"
                            ),
                            "body": _format_overdue_body(
                                child.name,
                                medicine_name,
                                plan.dose_amount,
                                next_allowed_local_label,
                                language,
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
                            self._record_illness_delivery(
                                session=session,
                                family_id=child.family_id,
                                account_id=account.id,
                                plan_id=plan.id,
                                notification_kind="overdue",
                                scheduled_for=next_allowed_at,
                                now=now,
                            )

            await self._process_pillbox_plan_reminders(
                session=session,
                account_repo=account_repo,
                subscription_repo=subscription_repo,
                now=now,
            )

            await self._process_household_medicine_reminders(
                session=session,
                account_repo=account_repo,
                medicine_repo=medicine_repo,
                subscription_repo=subscription_repo,
                now=now,
            )

            await session.commit()

    def _is_pillbox_medication_active_on(
        self, medication: PillboxMedicationModel, target_day: date
    ) -> bool:
        if medication.course_mode == "continuous":
            return True
        if not medication.course_start_date or not medication.course_end_date:
            return False
        return medication.course_start_date <= target_day <= medication.course_end_date

    def _resolve_pillbox_medicine_name(self, medication: PillboxMedicationModel) -> str:
        if medication.custom_medicine_name and medication.custom_medicine_name.strip():
            return medication.custom_medicine_name.strip()
        return "Medicine"

    def _build_pillbox_slot_summary_label(
        self,
        items: list[tuple[PillboxPlanModel, PillboxMedicationModel]],
        language: str,
    ) -> str:
        labels: list[str] = []
        for _, medication in items:
            name = self._resolve_pillbox_medicine_name(medication)
            dose = medication.dose_amount.strip()
            meal_rule_label = _format_pillbox_meal_rule(medication.meal_rule, language)
            if dose:
                labels.append(f"{name} · {dose} · {meal_rule_label}")
                continue
            labels.append(f"{name} · {meal_rule_label}")

        if not labels:
            return "Medicines" if language == "en" else "Лекарства"
        if len(labels) == 1:
            return labels[0]
        if len(labels) == 2:
            return ", ".join(labels)

        if language == "en":
            return f"{labels[0]}, {labels[1]} +{len(labels) - 2} more"
        return f"{labels[0]}, {labels[1]} +{len(labels) - 2}"

    def _build_pillbox_slot_title_label(
        self,
        items: list[tuple[PillboxPlanModel, PillboxMedicationModel]],
        language: str,
    ) -> str:
        names = [self._resolve_pillbox_medicine_name(medication) for _, medication in items]
        if not names:
            return "Medicines" if language == "en" else "Лекарства"
        if len(names) == 1:
            return names[0]
        if language == "en":
            return f"{names[0]} +{len(names) - 1}"
        return f"{names[0]} +{len(names) - 1}"

    def _get_pillbox_schedule_candidates(
        self,
        plan: PillboxPlanModel,
        now: datetime,
    ) -> list[tuple[datetime, PillboxMedicationModel]]:
        candidates: list[tuple[datetime, PillboxMedicationModel]] = []
        local_now = now.astimezone(self._timezone)
        for offset in (0, 1):
            target_day = (local_now + timedelta(days=offset)).date()
            weekday = target_day.isoweekday()
            for medication in plan.medications:
                if not self._is_pillbox_medication_active_on(medication, target_day):
                    continue
                if weekday not in (medication.repeat_days or []):
                    continue
                for dose_time in medication.times or []:
                    local_scheduled_for = datetime.combine(
                        target_day,
                        dose_time,
                        tzinfo=self._timezone,
                    )
                    candidates.append((local_scheduled_for.astimezone(UTC), medication))
        return sorted(candidates, key=lambda item: item[0])

    def _is_pillbox_dose_logged(
        self,
        plan: PillboxPlanModel,
        medication_id: Any,
        scheduled_for: datetime,
    ) -> bool:
        lower_bound = scheduled_for - timedelta(minutes=90)
        upper_bound = scheduled_for + timedelta(hours=6)
        for log in plan.dose_logs:
            if log.medication_id != medication_id:
                continue
            if log.scheduled_for is not None:
                if log.scheduled_for == scheduled_for:
                    return True
                continue
            if lower_bound <= log.taken_at <= upper_bound:
                return True
        return False

    async def _has_pillbox_delivery(
        self,
        *,
        session: Any,
        account_id: Any,
        plan_id: Any,
        medication_id: Any,
        notification_kind: str,
        scheduled_for: datetime,
    ) -> bool:
        result = await session.execute(
            select(PillboxNotificationDeliveryModel.id).where(
                PillboxNotificationDeliveryModel.account_id == account_id,
                PillboxNotificationDeliveryModel.plan_id == plan_id,
                PillboxNotificationDeliveryModel.medication_id == medication_id,
                PillboxNotificationDeliveryModel.notification_kind == notification_kind,
                PillboxNotificationDeliveryModel.scheduled_for == scheduled_for,
            )
        )
        return result.scalar_one_or_none() is not None

    async def _has_illness_delivery(
        self,
        *,
        session: Any,
        account_id: Any,
        plan_id: Any,
        notification_kind: str,
        scheduled_for: datetime,
    ) -> bool:
        result = await session.execute(
            select(IllnessNotificationDeliveryModel.id).where(
                IllnessNotificationDeliveryModel.account_id == account_id,
                IllnessNotificationDeliveryModel.plan_id == plan_id,
                IllnessNotificationDeliveryModel.notification_kind == notification_kind,
                IllnessNotificationDeliveryModel.scheduled_for == scheduled_for,
            )
        )
        return result.scalar_one_or_none() is not None

    def _record_illness_delivery(
        self,
        *,
        session: Any,
        family_id: Any,
        account_id: Any,
        plan_id: Any,
        notification_kind: str,
        scheduled_for: datetime,
        now: datetime,
    ) -> None:
        session.add(
            IllnessNotificationDeliveryModel(
                family_id=family_id,
                account_id=account_id,
                plan_id=plan_id,
                notification_kind=notification_kind,
                scheduled_for=scheduled_for,
                sent_at=now,
            )
        )

    def _record_pillbox_delivery(
        self,
        *,
        session: Any,
        family_id: Any,
        account_id: Any,
        plan_id: Any,
        medication_id: Any,
        notification_kind: str,
        scheduled_for: datetime,
        now: datetime,
    ) -> None:
        session.add(
            PillboxNotificationDeliveryModel(
                family_id=family_id,
                account_id=account_id,
                plan_id=plan_id,
                medication_id=medication_id,
                notification_kind=notification_kind,
                scheduled_for=scheduled_for,
                sent_at=now,
            )
        )

    async def _process_pillbox_plan_reminders(
        self,
        *,
        session: Any,
        account_repo: SqlAccountRepository,
        subscription_repo: SqlPushSubscriptionRepository,
        now: datetime,
    ) -> None:
        result = await session.execute(
            select(PillboxPlanModel)
            .where(PillboxPlanModel.status == "active")
            .options(
                selectinload(PillboxPlanModel.medications),
                selectinload(PillboxPlanModel.dose_logs),
            )
        )
        plans = result.scalars().all()
        slot_map: dict[tuple[Any, datetime], dict[str, Any]] = {}

        for plan in plans:
            if not plan.medications:
                continue

            target_account_ids = _get_pillbox_target_account_ids(plan)
            if not target_account_ids:
                continue

            schedule_candidates = self._get_pillbox_schedule_candidates(plan, now)
            if not schedule_candidates:
                continue

            for account_id in target_account_ids:
                for scheduled_for, medication in schedule_candidates:
                    if self._is_pillbox_dose_logged(plan, medication.id, scheduled_for):
                        continue
                    slot = slot_map.setdefault(
                        (account_id, scheduled_for),
                        {
                            "account_id": account_id,
                            "scheduled_for": scheduled_for,
                            "family_id": plan.family_id,
                            "items": [],
                        },
                    )
                    slot["items"].append((plan, medication))

        for slot in slot_map.values():
            account = await account_repo.get_by_id(slot["account_id"])
            if not account:
                continue
            if not _can_receive_pillbox_push(account):
                continue
            subscriptions = await subscription_repo.get_by_account_id(account.id)
            if not subscriptions:
                continue

            scheduled_for = slot["scheduled_for"]
            items: list[tuple[PillboxPlanModel, PillboxMedicationModel]] = slot["items"]
            language = _normalize_language(account.preferred_language)
            overdue_at = scheduled_for + timedelta(minutes=OVERDUE_REMINDER_AFTER_MINUTES)
            scheduled_time_label = scheduled_for.astimezone(self._timezone).strftime("%H:%M")
            timestamp = int(scheduled_for.timestamp())
            summary_label = self._build_pillbox_slot_summary_label(items, language)
            title_label = self._build_pillbox_slot_title_label(items, language)
            recipient_label = _resolve_account_recipient_label(account, language)
            pillbox_before_minutes = account.pillbox_push_before_reminder_minutes

            first_plan, first_medication = items[0]
            notification_data = {
                "planId": str(first_plan.id),
                "medicationId": str(first_medication.id),
                "scheduledFor": scheduled_for.isoformat(),
                "slotCount": len(items),
            }

            async def slot_delivered(notification_kind: str) -> bool:
                for plan, medication in items:
                    if not await self._has_pillbox_delivery(
                        session=session,
                        account_id=account.id,
                        plan_id=plan.id,
                        medication_id=medication.id,
                        notification_kind=notification_kind,
                        scheduled_for=scheduled_for,
                    ):
                        return False
                return True

            def record_slot_delivery(notification_kind: str) -> None:
                for plan, medication in items:
                    self._record_pillbox_delivery(
                        session=session,
                        family_id=plan.family_id,
                        account_id=account.id,
                        plan_id=plan.id,
                        medication_id=medication.id,
                        notification_kind=notification_kind,
                        scheduled_for=scheduled_for,
                        now=now,
                    )

            actions = [
                {
                    "action": "open-pillbox",
                    "title": "Open" if language == "en" else "Открыть",
                }
            ]

            pillbox_url = f"/pillbox?plan={first_plan.id}&highlightPlan={first_plan.id}&action=take"

            remind_at = scheduled_for - timedelta(minutes=pillbox_before_minutes)
            if remind_at <= now < scheduled_for and not await slot_delivered("before"):
                payload = {
                    "title": (
                        (f"In {pillbox_before_minutes} min: {title_label}")
                        if language == "en"
                        else (f"Через {pillbox_before_minutes} мин: {title_label}")
                    ),
                    "body": _format_pillbox_before_body(
                        summary_label,
                        recipient_label,
                        pillbox_before_minutes,
                        scheduled_time_label,
                        language,
                    ),
                    "url": pillbox_url,
                    "tag": f"pillbox-before-{account.id}-{timestamp}",
                    "data": notification_data,
                    "actions": actions,
                }
                if await self._send_to_subscriptions(
                    subscriptions=subscriptions,
                    subscription_repo=subscription_repo,
                    payload=payload,
                ):
                    record_slot_delivery("before")

            if scheduled_for <= now < overdue_at and not await slot_delivered("due"):
                payload = {
                    "title": (
                        f"Time to take {title_label}"
                        if language == "en"
                        else f"Пора принять {title_label}"
                    ),
                    "body": _format_pillbox_due_body(
                        summary_label,
                        recipient_label,
                        scheduled_time_label,
                        language,
                    ),
                    "url": pillbox_url,
                    "tag": f"pillbox-due-{account.id}-{timestamp}",
                    "data": notification_data,
                    "actions": actions,
                }
                if await self._send_to_subscriptions(
                    subscriptions=subscriptions,
                    subscription_repo=subscription_repo,
                    payload=payload,
                ):
                    record_slot_delivery("due")

            if now >= overdue_at and not await slot_delivered("overdue"):
                payload = {
                    "title": (
                        f"Check dose: {title_label}"
                        if language == "en"
                        else f"Проверьте приём: {title_label}"
                    ),
                    "body": _format_pillbox_overdue_body(
                        summary_label,
                        recipient_label,
                        scheduled_time_label,
                        language,
                    ),
                    "url": pillbox_url,
                    "tag": f"pillbox-overdue-{account.id}-{timestamp}",
                    "data": notification_data,
                    "actions": actions,
                }
                if await self._send_to_subscriptions(
                    subscriptions=subscriptions,
                    subscription_repo=subscription_repo,
                    payload=payload,
                ):
                    record_slot_delivery("overdue")

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
        family_repo = SqlFamilyRepository(session)

        for family_id in family_ids:
            family = await family_repo.get_by_id(family_id)
            if not family:
                continue
            accounts = await account_repo.list_by_family_id(family_id)
            if not accounts:
                continue
            selected_account_ids = list(family.cabinet_member_account_ids or [])
            if selected_account_ids:
                selected_id_set = set(selected_account_ids)
                accounts = [account for account in accounts if account.id in selected_id_set]
            if not accounts:
                continue
            medicines = await medicine_repo.get_by_family_id(family_id)
            for account in accounts:
                if not _is_push_allowed_for_account(account, "cabinet"):
                    continue
                language = _normalize_language(account.preferred_language)
                reminder_offsets = _get_cabinet_offsets(account)
                if not reminder_offsets:
                    continue
                subscriptions = await subscription_repo.get_by_account_id(account.id)
                if not subscriptions:
                    continue

                for medicine in medicines:
                    await self._process_single_household_medicine(
                        session=session,
                        account_id=account.id,
                        subscriptions=subscriptions,
                        subscription_repo=subscription_repo,
                        medicine=medicine,
                        reminder_offsets=reminder_offsets,
                        today=today,
                        now=now,
                        language=language,
                    )

    async def _process_single_household_medicine(
        self,
        *,
        session: Any,
        account_id: Any,
        subscriptions: list[PushSubscription],
        subscription_repo: SqlPushSubscriptionRepository,
        medicine: HouseholdMedicine,
        reminder_offsets: list[int],
        today: date,
        now: datetime,
        language: str,
    ) -> None:
        status = calculate_household_medicine_status(medicine, today=today)
        target_date = status["expiry_alert_date"]
        if not target_date:
            return

        days_until = (target_date - today).days
        if days_until == -1:
            await self._send_expired_household_medicine_notification(
                session=session,
                account_id=account_id,
                subscriptions=subscriptions,
                subscription_repo=subscription_repo,
                medicine=medicine,
                target_date=target_date,
                is_opened_limit=(
                    status["opened_expires_at"] is not None
                    and status["opened_expires_at"] == target_date
                ),
                now=now,
                language=language,
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
                HouseholdMedicineNotificationDeliveryModel.account_id == account_id,
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
            language=language,
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
                account_id=account_id,
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
        account_id: Any,
        subscriptions: list[PushSubscription],
        subscription_repo: SqlPushSubscriptionRepository,
        medicine: HouseholdMedicine,
        target_date: date,
        is_opened_limit: bool,
        now: datetime,
        language: str,
    ) -> None:
        notification_kind = "opened_expired" if is_opened_limit else "expired"
        already_sent_result = await session.execute(
            select(HouseholdMedicineNotificationDeliveryModel.id).where(
                HouseholdMedicineNotificationDeliveryModel.household_medicine_id == medicine.id,
                HouseholdMedicineNotificationDeliveryModel.account_id == account_id,
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
            language=language,
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
                account_id=account_id,
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
        unique_subscriptions: list[PushSubscription] = []
        seen_endpoints: set[str] = set()
        for subscription in subscriptions:
            if subscription.endpoint in seen_endpoints:
                continue
            seen_endpoints.add(subscription.endpoint)
            unique_subscriptions.append(subscription)

        for subscription in unique_subscriptions:
            if subscription.channel == "web":
                sent = await self._send_web_push(subscription, subscription_repo, payload) or sent
                continue
            if subscription.channel == "native" and subscription.platform == "ios":
                sent = await self._send_apns_push(subscription, subscription_repo, payload) or sent
        return sent

    async def _send_web_push(
        self,
        subscription: PushSubscription,
        subscription_repo: SqlPushSubscriptionRepository,
        payload: dict[str, Any],
    ) -> bool:
        if (
            webpush is None
            or not settings.web_push_enabled
            or not subscription.p256dh_key
            or not subscription.auth_key
        ):
            return False
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
            return True
        except WebPushException as exc:  # pragma: no branch - статусы зависят от клиента
            response = getattr(exc, "response", None)
            status_code = getattr(response, "status_code", None) or getattr(
                response, "status", None
            )
            reason = _extract_web_push_error_reason(response)
            if _is_stale_web_push_response(status_code, reason):
                logger.info(
                    "stale_push_subscription | endpoint={} reason={}",
                    subscription.endpoint,
                    reason or status_code,
                )
                await subscription_repo.delete(subscription.id)
                return False
            logger.warning(
                f"push_delivery_failed | subscription_id={subscription.id} error={exc!s}"
            )
        except Exception as exc:  # pragma: no cover - сеть/SSL/библиотека
            logger.warning(
                f"push_delivery_failed | subscription_id={subscription.id} error={exc!s}"
            )
        return False

    async def _send_apns_push(
        self,
        subscription: PushSubscription,
        subscription_repo: SqlPushSubscriptionRepository,
        payload: dict[str, Any],
    ) -> bool:
        if not self._apns_available or not subscription.native_token:
            return False
        token = self._get_apns_provider_token()
        if not token:
            return False

        apns_payload = {
            "aps": {
                "alert": {
                    "title": str(payload.get("title") or settings.app_name),
                    "body": str(payload.get("body") or ""),
                },
                "sound": "default",
            },
            "url": payload.get("url"),
            "tag": payload.get("tag"),
            "data": payload.get("data") or {},
        }
        base_url = APNS_SANDBOX_URL if settings.apns_use_sandbox else APNS_PRODUCTION_URL
        headers = {
            "authorization": f"bearer {token}",
            "apns-topic": settings.apns_bundle_id,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "apns-expiration": "0",
        }

        try:
            async with httpx.AsyncClient(http2=True, timeout=10) as client:
                response = await client.post(
                    f"{base_url}/{subscription.native_token}",
                    headers=headers,
                    json=apns_payload,
                )
            if response.status_code == 200:
                return True
            reason = self._get_apns_error_reason(response)
            if response.status_code == 410 or reason in APNS_STALE_REASONS:
                logger.info(
                    f"stale_native_push_subscription | subscription_id={subscription.id} "
                    f"reason={reason or response.status_code}"
                )
                await subscription_repo.delete(subscription.id)
                return False
            logger.warning(
                f"apns_delivery_failed | subscription_id={subscription.id} "
                f"status={response.status_code} reason={reason or response.text[:120]}"
            )
        except Exception as exc:  # pragma: no cover - сеть/SSL/библиотека
            logger.warning(
                f"apns_delivery_failed | subscription_id={subscription.id} error={exc!s}"
            )
        return False

    def _get_apns_provider_token(self) -> str | None:
        now = int(datetime.now(UTC).timestamp())
        if self._apns_token and now - self._apns_token_issued_at < 50 * 60:
            return self._apns_token
        if serialization is None or ec is None or hashes is None or utils is None:
            return None
        auth_key = settings.apns_auth_key_pem
        if not auth_key or not settings.apns_key_id or not settings.apns_team_id:
            return None
        try:
            private_key = serialization.load_pem_private_key(
                auth_key.encode("utf-8"),
                password=None,
            )
            header = {"alg": "ES256", "kid": settings.apns_key_id}
            claims = {"iss": settings.apns_team_id, "iat": now}
            signing_input = (
                f"{self._base64url_json(header)}.{self._base64url_json(claims)}"
            ).encode("ascii")
            signature = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
            r, s = utils.decode_dss_signature(signature)
            raw_signature = r.to_bytes(32, "big") + s.to_bytes(32, "big")
            token = f"{signing_input.decode('ascii')}.{self._base64url(raw_signature)}"
            self._apns_token = token
            self._apns_token_issued_at = now
            return token
        except Exception as exc:  # pragma: no cover - неверный ключ/криптография
            logger.warning(f"apns_provider_token_failed | error={exc!s}")
            return None

    @staticmethod
    def _base64url_json(value: dict[str, Any]) -> str:
        return PushNotificationScheduler._base64url(
            json.dumps(value, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
        )

    @staticmethod
    def _base64url(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")

    @staticmethod
    def _get_apns_error_reason(response: Any) -> str | None:
        try:
            data = response.json()
        except Exception:
            return None
        reason = data.get("reason") if isinstance(data, dict) else None
        return str(reason) if reason else None
