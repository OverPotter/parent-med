from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest

from src.application.services.push_reminder_scheduler import PushNotificationScheduler
from src.domain.entities.account import Account
from src.domain.entities.family_access import FamilyAccessPolicy


class _DummySession:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.commits = 0

    async def __aenter__(self) -> _DummySession:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    def add(self, item: object) -> None:
        self.added.append(item)

    async def commit(self) -> None:
        self.commits += 1


def _build_account(*, account_id, family_id, child_id, name: str) -> Account:
    return Account(
        id=account_id,
        email=f"{name.lower()}@example.com",
        password_hash="hash",
        family_id=family_id,
        display_name=name,
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 5, 1, 8, 0, tzinfo=UTC),
        children_push_enabled=True,
        pillbox_push_enabled=True,
        pillbox_push_before_reminder_minutes=10,
        preferred_language="ru",
        access_policy=FamilyAccessPolicy(all_children=False, child_ids=[child_id]),
    )


@pytest.mark.asyncio
async def test_illness_delivery_retries_only_failed_recipient_next_tick(monkeypatch) -> None:
    family_id = uuid4()
    child_id = uuid4()
    plan_id = uuid4()
    episode_id = uuid4()
    account_a_id = uuid4()
    account_b_id = uuid4()
    now = datetime(2026, 5, 2, 12, 0, tzinfo=UTC)
    plan_created_at = now - timedelta(minutes=181)
    plan = SimpleNamespace(
        id=plan_id,
        episode_id=episode_id,
        household_medicine_id=None,
        custom_medicine_name="Ибупрофен",
        min_interval_minutes=180,
        max_doses_per_day=None,
        created_at=plan_created_at,
        dose_amount="5 мл",
        member_account_ids=[],
    )
    episode = SimpleNamespace(
        id=episode_id,
        child_id=child_id,
        status="active",
        member_account_ids=[],
    )
    child = SimpleNamespace(id=child_id, family_id=family_id, name="Маша")
    account_a = _build_account(
        account_id=account_a_id,
        family_id=family_id,
        child_id=child_id,
        name="Мама",
    )
    account_b = _build_account(
        account_id=account_b_id,
        family_id=family_id,
        child_id=child_id,
        name="Папа",
    )
    subscription_a = SimpleNamespace(account_id=account_a_id, endpoint="a", channel="web")
    subscription_b = SimpleNamespace(account_id=account_b_id, endpoint="b", channel="web")
    sent_deliveries: set[tuple[object, str, datetime]] = set()
    attempts: list[tuple[object, str]] = []
    dummy_session = _DummySession()

    class _PlanRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def get_for_push_notifications(self):
            return [plan]

    class _EpisodeRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def get_by_id(self, requested_id):
            return episode if requested_id == episode_id else None

    class _ChildRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def get_by_id(self, requested_id):
            return child if requested_id == child_id else None

    class _AccountRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def list_by_family_id(self, requested_family_id):
            if requested_family_id != family_id:
                return []
            return [account_a, account_b]

    class _MedicineRepo:
        def __init__(self, session) -> None:
            self.session = session

    class _AdministrationRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def get_by_episode_id(self, requested_episode_id):
            return [] if requested_episode_id == episode_id else []

    class _SubscriptionRepo:
        def __init__(self, session) -> None:
            self.session = session

        async def get_by_account_id(self, requested_account_id):
            if requested_account_id == account_a_id:
                return [subscription_a]
            if requested_account_id == account_b_id:
                return [subscription_b]
            return []

    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlEpisodeMedicationPlanRepository",
        _PlanRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlIllnessEpisodeRepository",
        _EpisodeRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlChildRepository",
        _ChildRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlAccountRepository",
        _AccountRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlHouseholdMedicineRepository",
        _MedicineRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlAdministrationEventRepository",
        _AdministrationRepo,
    )
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.SqlPushSubscriptionRepository",
        _SubscriptionRepo,
    )

    scheduler = PushNotificationScheduler(session_factory=lambda: dummy_session)

    async def _fake_has_delivery(
        *,
        account_id,
        plan_id,
        notification_kind,
        scheduled_for,
        **_kwargs,
    ):
        return (account_id, notification_kind, scheduled_for) in sent_deliveries

    def _fake_record_delivery(
        *,
        account_id,
        notification_kind,
        scheduled_for,
        **_kwargs,
    ) -> None:
        sent_deliveries.add((account_id, notification_kind, scheduled_for))

    async def _fake_send(*, subscriptions, payload, **_kwargs):
        account_id = subscriptions[0].account_id
        notification_kind = payload["tag"].split("-")[1]
        attempts.append((account_id, notification_kind))
        if account_id == account_a_id:
            return True
        return attempts.count((account_b_id, notification_kind)) > 1

    monkeypatch.setattr(scheduler, "_has_illness_delivery", _fake_has_delivery)
    monkeypatch.setattr(scheduler, "_record_illness_delivery", _fake_record_delivery)
    monkeypatch.setattr(scheduler, "_send_to_subscriptions", _fake_send)
    monkeypatch.setattr(scheduler, "_process_pillbox_plan_reminders", _noop_async)
    monkeypatch.setattr(scheduler, "_process_household_medicine_reminders", _noop_async)
    monkeypatch.setattr(
        "src.application.services.push_reminder_scheduler.datetime",
        _FixedDateTime(now),
    )

    await scheduler._tick()
    await scheduler._tick()

    due_attempts = [item for item in attempts if item[1] == "due"]
    assert due_attempts == [
        (account_a_id, "due"),
        (account_b_id, "due"),
        (account_b_id, "due"),
    ]
    assert (account_a_id, "due", now - timedelta(hours=1)) not in sent_deliveries
    next_allowed_at = plan_created_at + timedelta(minutes=plan.min_interval_minutes)
    assert (account_a_id, "due", next_allowed_at) in sent_deliveries
    assert (account_b_id, "due", next_allowed_at) in sent_deliveries


class _FixedDateTime:
    def __init__(self, now: datetime) -> None:
        self._now = now

    def now(self, tz=None):
        if tz is None:
            return self._now
        return self._now.astimezone(tz)


async def _noop_async(**_kwargs) -> None:
    return None
