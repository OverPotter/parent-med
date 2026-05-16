from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from src.application.dto.auth import AuthenticatedAccount
from src.application.services.subscription_access_service import SubscriptionAccessService
from src.domain.entities.account import Account
from src.domain.entities.child import Child
from src.domain.entities.family import Family
from src.domain.entities.pillbox import PillboxPlan


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, family_id):  # noqa: ANN001
        return self.family if self.family.id == family_id else None


class StubAccountRepository:
    def __init__(self, accounts: list[Account]) -> None:
        self.accounts = accounts

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [account for account in self.accounts if account.family_id == family_id]


class StubChildRepository:
    def __init__(self, children: list[Child]) -> None:
        self.children = children

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [child for child in self.children if child.family_id == family_id]


class StubPillboxRepository:
    def __init__(self, plans: list[PillboxPlan]) -> None:
        self.plans = plans

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [plan for plan in self.plans if plan.family_id == family_id]


def _build_account(*, family_id, family_role: str, email: str) -> Account:
    return Account(
        id=uuid4(),
        email=email,
        password_hash="hash",
        family_id=family_id,
        display_name=email.split("@", 1)[0],
        family_role=family_role,
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime.now(UTC),
    )


def _build_authenticated_account(account: Account) -> AuthenticatedAccount:
    return AuthenticatedAccount(
        id=account.id,
        email=account.email,
        family_id=account.family_id,
        display_name=account.display_name or "",
        family_role=account.family_role,
        preferred_language="ru",
    )


def _build_child(*, family_id, name: str) -> Child:
    return Child(id=uuid4(), family_id=family_id, name=name, birth_date=None)


def _build_plan(*, family_id, owner_id) -> PillboxPlan:
    now = datetime.now(UTC)
    return PillboxPlan(
        id=uuid4(),
        family_id=family_id,
        title="Plan",
        status="active",
        member_account_ids=[owner_id],
        created_by_account_id=owner_id,
        created_at=now,
        updated_at=now,
        medications=[],
        dose_logs=[],
    )


@pytest.mark.asyncio
async def test_returns_free_limits_for_inactive_family_subscription() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="free",
        subscription_status="inactive",
    )
    service = SubscriptionAccessService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        child_repo=StubChildRepository([_build_child(family_id=family_id, name="Kid")]),
        pillbox_repo=StubPillboxRepository([_build_plan(family_id=family_id, owner_id=owner.id)]),
    )

    result = await service.get_for_account(_build_authenticated_account(owner))

    assert result.plan_code == "free"
    assert result.premium_active is False
    assert result.is_billing_owner is True
    assert result.can_manage_subscription is True
    assert result.can_invite_members is False
    assert result.can_manage_member_roles is False
    assert result.can_use_live_activities is False
    assert result.can_export_csv is False
    assert result.max_children == 1
    assert result.max_adults == 1
    assert result.max_pillbox_plans == 1
    assert result.current_children_count == 1
    assert result.current_adults_count == 1
    assert result.current_pillbox_plan_count == 1


@pytest.mark.asyncio
async def test_returns_plus_access_for_active_premium_family() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    adult = _build_account(family_id=family_id, family_role="adult", email="dad@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
    )
    service = SubscriptionAccessService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, adult]),
        child_repo=StubChildRepository(
            [
                _build_child(family_id=family_id, name="Kid 1"),
                _build_child(family_id=family_id, name="Kid 2"),
            ]
        ),
        pillbox_repo=StubPillboxRepository(
            [
                _build_plan(family_id=family_id, owner_id=owner.id),
                _build_plan(family_id=family_id, owner_id=owner.id),
            ]
        ),
    )

    result = await service.get_for_account(_build_authenticated_account(owner))

    assert result.plan_code == "plus"
    assert result.subscription_status == "active"
    assert result.premium_active is True
    assert result.has_plus_access is True
    assert result.is_billing_owner is True
    assert result.can_manage_subscription is True
    assert result.can_invite_members is True
    assert result.can_manage_member_roles is True
    assert result.can_use_live_activities is True
    assert result.can_export_csv is True
    assert result.max_children is None
    assert result.max_adults is None
    assert result.max_pillbox_plans is None
    assert result.current_children_count == 2
    assert result.current_adults_count == 2
    assert result.current_pillbox_plan_count == 2


@pytest.mark.asyncio
async def test_non_admin_member_gets_shared_plus_without_management_rights() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    member = _build_account(family_id=family_id, family_role="adult", email="dad@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="grace",
    )
    service = SubscriptionAccessService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, member]),
        child_repo=StubChildRepository([]),
        pillbox_repo=StubPillboxRepository([]),
    )

    result = await service.get_for_account(_build_authenticated_account(member))

    assert result.premium_active is True
    assert result.has_plus_access is True
    assert result.is_billing_owner is False
    assert result.can_manage_subscription is False
    assert result.can_invite_members is False
    assert result.can_manage_member_roles is False
    assert result.can_use_live_activities is True
    assert result.can_export_csv is True


@pytest.mark.asyncio
async def test_admin_gets_member_management_but_not_invite_rights() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    admin = _build_account(family_id=family_id, family_role="admin", email="dad@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
    )
    service = SubscriptionAccessService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin]),
        child_repo=StubChildRepository([]),
        pillbox_repo=StubPillboxRepository([]),
    )

    result = await service.get_for_account(_build_authenticated_account(admin))

    assert result.premium_active is True
    assert result.can_manage_subscription is False
    assert result.can_manage_member_roles is True
    assert result.can_invite_members is False


@pytest.mark.asyncio
async def test_expired_trial_is_not_treated_as_premium() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="trialing",
        subscription_expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )
    service = SubscriptionAccessService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        child_repo=StubChildRepository([]),
        pillbox_repo=StubPillboxRepository([]),
    )

    result = await service.get_for_account(_build_authenticated_account(owner))

    assert result.subscription_status == "trialing"
    assert result.premium_active is False
    assert result.has_plus_access is False
    assert result.can_manage_member_roles is False
