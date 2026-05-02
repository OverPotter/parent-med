from datetime import UTC, datetime
from uuid import uuid4

from src.application.services.push_reminder_scheduler import (
    _can_receive_illness_push,
    _can_receive_pillbox_push,
    _format_before_body,
    _format_due_body,
    _format_overdue_body,
    _get_cabinet_offsets,
    _get_pillbox_target_account_ids,
    _is_push_allowed_for_account,
    _resolve_account_recipient_label,
)
from src.domain.entities.account import Account
from src.domain.entities.family_access import FamilyAccessPolicy
from src.infrastructure.database.models.household_medicine_notification_delivery import (
    HouseholdMedicineNotificationDeliveryModel,
)
from src.infrastructure.database.models.illness_notification_delivery import (
    IllnessNotificationDeliveryModel,
)


def build_account(policy: FamilyAccessPolicy) -> Account:
    return Account(
        id=uuid4(),
        email="tester@example.com",
        password_hash="hash",
        family_id=uuid4(),
        display_name="Tester",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 4, 22, 0, 0, tzinfo=UTC),
        access_policy=policy,
    )


def test_push_access_defaults_to_allowed() -> None:
    account = build_account(FamilyAccessPolicy())

    assert _is_push_allowed_for_account(account, "illness") is True
    assert _is_push_allowed_for_account(account, "cabinet") is True
    assert _is_push_allowed_for_account(account, "pillbox") is True


def test_push_access_respects_only_cabinet_policy_flag() -> None:
    account = build_account(FamilyAccessPolicy(cabinet_push_enabled=False))

    assert _is_push_allowed_for_account(account, "illness") is True
    assert _is_push_allowed_for_account(account, "cabinet") is False
    assert _is_push_allowed_for_account(account, "pillbox") is True


def test_push_access_respects_account_level_children_and_pillbox_switches() -> None:
    account = build_account(FamilyAccessPolicy())
    account.children_push_enabled = False
    account.pillbox_push_enabled = False

    assert _is_push_allowed_for_account(account, "illness") is False
    assert _is_push_allowed_for_account(account, "pillbox") is False
    assert _is_push_allowed_for_account(account, "cabinet") is True


def test_push_access_rejects_cabinet_when_module_hidden_even_with_stale_flag() -> None:
    account = build_account(
        FamilyAccessPolicy(
            cabinet_access="none",
            cabinet_push_enabled=True,
        )
    )

    assert _is_push_allowed_for_account(account, "cabinet") is False


def test_cabinet_offsets_match_only_explicit_account_settings() -> None:
    account = build_account(FamilyAccessPolicy())

    assert _get_cabinet_offsets(account) == [10, 7, 3]

    account.cabinet_notify_10_days = False
    account.cabinet_notify_7_days = False
    account.cabinet_notify_3_days = True

    assert _get_cabinet_offsets(account) == [3]

    account.cabinet_notify_3_days = False

    assert _get_cabinet_offsets(account) == []


def test_illness_push_requires_current_child_access() -> None:
    child_id = uuid4()
    account = build_account(
        FamilyAccessPolicy(
            all_children=False,
            child_ids=[],
        )
    )

    assert _can_receive_illness_push(account, child_id) is False

    account.access_policy = FamilyAccessPolicy(all_children=False, child_ids=[child_id])

    assert _can_receive_illness_push(account, child_id) is True


def test_pillbox_push_requires_current_pillbox_access() -> None:
    account = build_account(FamilyAccessPolicy(pillbox_access="none"))
    assert _can_receive_pillbox_push(account) is False

    account.access_policy = FamilyAccessPolicy(pillbox_access="view")
    assert _can_receive_pillbox_push(account) is True


def test_pillbox_target_accounts_use_only_explicit_recipients() -> None:
    recipient_id = uuid4()
    creator_id = uuid4()
    plan = type(
        "Plan",
        (),
        {
            "member_account_ids": [],
            "created_by_account_id": creator_id,
        },
    )()
    assert _get_pillbox_target_account_ids(plan) == []

    plan.member_account_ids = [recipient_id]
    assert _get_pillbox_target_account_ids(plan) == [recipient_id]


def test_cabinet_delivery_log_is_scoped_per_account() -> None:
    unique_constraints = [
        constraint
        for constraint in HouseholdMedicineNotificationDeliveryModel.__table__.constraints
        if getattr(constraint, "name", None) == "uq_household_medicine_notification_delivery"
    ]

    assert len(unique_constraints) == 1
    assert tuple(unique_constraints[0].columns.keys()) == (
        "household_medicine_id",
        "notification_kind",
        "target_date",
        "days_before",
        "account_id",
    )
    assert HouseholdMedicineNotificationDeliveryModel.__table__.c.account_id.nullable is False


def test_illness_delivery_log_is_scoped_per_account() -> None:
    unique_constraints = [
        constraint
        for constraint in IllnessNotificationDeliveryModel.__table__.constraints
        if getattr(constraint, "name", None) == "uq_illness_notification_delivery"
    ]

    assert len(unique_constraints) == 1
    assert tuple(unique_constraints[0].columns.keys()) == (
        "plan_id",
        "notification_kind",
        "scheduled_for",
        "account_id",
    )
    assert IllnessNotificationDeliveryModel.__table__.c.account_id.nullable is False


def test_illness_push_bodies_keep_child_name_in_body_for_shorter_titles() -> None:
    assert (
        _format_before_body("Маша", "Ибупрофен", "5 мл", 10, "14:30", "ru")
        == "5 мл · Маша · в 14:30"
    )
    assert _format_due_body("Маша", "Ибупрофен", "5 мл", "14:30", "ru") == "5 мл · Маша · в 14:30"
    assert (
        _format_overdue_body("Маша", "Ибупрофен", "5 мл", "14:30", "ru")
        == "5 мл · Маша · не отмечено с 14:30"
    )


def test_recipient_label_falls_back_to_neutral_copy_without_login() -> None:
    account = build_account(FamilyAccessPolicy())
    account.display_name = None

    assert _resolve_account_recipient_label(account, "en") == "you"
    assert _resolve_account_recipient_label(account, "ru") == "вас"
