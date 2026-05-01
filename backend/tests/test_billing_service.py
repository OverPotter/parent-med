from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.billing import BillingDebugActionDto, BillingProviderSyncDto
from src.application.services.billing_service import BillingService
from src.application.services.subscription_access_service import SubscriptionAccessService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.billing_event import BillingEvent
from src.domain.entities.child import Child
from src.domain.entities.family import Family
from src.domain.entities.feeding_record import FeedingRecord
from src.domain.entities.pillbox import PillboxMedication, PillboxPlan
from src.domain.entities.plan import Plan
from src.domain.entities.sleep_session import SleepSession
from src.domain.entities.subscription import Subscription


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, family_id):  # noqa: ANN001
        return self.family if family_id == self.family.id else None

    async def update(self, entity: Family) -> Family:
        self.family = entity
        return entity


class StubPlanRepository:
    def __init__(self, plans: list[Plan]) -> None:
        self.plans = plans

    async def get_by_code(self, code: str) -> Plan | None:
        return next((plan for plan in self.plans if plan.code == code), None)


class StubSubscriptionRepository:
    def __init__(self) -> None:
        self.current: Subscription | None = None
        self.items: list[Subscription] = []

    async def get_current_by_family_id(self, family_id):  # noqa: ANN001
        matches = [item for item in self.items if item.family_id == family_id]
        if not matches:
            return None
        return sorted(matches, key=lambda item: (item.updated_at, item.created_at), reverse=True)[0]

    async def get_current_by_provider_identity(  # noqa: ANN001
        self,
        provider,
        provider_customer_id,
        provider_subscription_id,
    ):
        matches = []
        for item in self.items:
            if item.provider != provider:
                continue
            if (
                provider_subscription_id
                and item.provider_subscription_id == provider_subscription_id
            ):
                matches.append(item)
                continue
            if provider_customer_id and item.provider_customer_id == provider_customer_id:
                matches.append(item)
        if not matches:
            return None
        return sorted(matches, key=lambda item: (item.updated_at, item.created_at), reverse=True)[0]

    async def add(self, entity: Subscription) -> Subscription:
        self.current = entity
        self.items = [item for item in self.items if item.id != entity.id] + [entity]
        return entity

    async def update(self, entity: Subscription) -> Subscription:
        self.current = entity
        self.items = [item for item in self.items if item.id != entity.id] + [entity]
        return entity


class DuplicateProviderSubscriptionOnUpdateRepository(StubSubscriptionRepository):
    async def update(self, entity: Subscription) -> Subscription:
        raise IntegrityError(
            statement="UPDATE subscriptions ...",
            params={},
            orig=Exception(
                "duplicate key value violates unique constraint "
                '"uq_subscriptions_provider_subscription_id"'
            ),
        )


class StubBillingEventRepository:
    def __init__(self) -> None:
        self.items: list[BillingEvent] = []

    async def add(self, entity: BillingEvent) -> BillingEvent:
        self.items.append(entity)
        return entity


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

    async def update(self, entity: PillboxPlan) -> PillboxPlan:
        self.plans = [plan for plan in self.plans if plan.id != entity.id] + [entity]
        return entity


class StubFeedingRecordRepository:
    def __init__(self, items: list[FeedingRecord] | None = None) -> None:
        self.items = {item.id: item for item in items or []}

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        for item in self.items.values():
            if item.child_id == child_id and item.status == "active":
                return item
        return None

    async def update(self, entity: FeedingRecord) -> FeedingRecord:
        self.items[entity.id] = entity
        return entity


class StubSleepSessionRepository:
    def __init__(self, items: list[SleepSession] | None = None) -> None:
        self.items = {item.id: item for item in items or []}

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        for item in self.items.values():
            if item.child_id == child_id and item.status == "active":
                return item
        return None

    async def update(self, entity: SleepSession) -> SleepSession:
        self.items[entity.id] = entity
        return entity


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


def _auth(account: Account) -> AuthenticatedAccount:
    return AuthenticatedAccount(
        id=account.id,
        email=account.email,
        family_id=account.family_id,
        display_name=account.display_name or "",
        family_role=account.family_role,
        preferred_language="ru",
    )


def _plan(*, code: str, name: str, entitlement: str | None = None) -> Plan:
    return Plan(
        id=uuid4(),
        code=code,
        name=name,
        is_active=True,
        apple_product_id=f"pillpath_{code}_monthly" if code != "free" else None,
        revenuecat_entitlement_code=entitlement,
        sort_order=0,
        created_at=datetime.now(UTC),
    )


def _make_service(
    family: Family,
    accounts: list[Account],
    *,
    children: list[Child] | None = None,
    pillbox_plans: list[PillboxPlan] | None = None,
    feeding_records: list[FeedingRecord] | None = None,
    sleep_sessions: list[SleepSession] | None = None,
) -> tuple[
    BillingService,
    StubSubscriptionRepository,
    StubBillingEventRepository,
    StubFeedingRecordRepository,
    StubSleepSessionRepository,
]:
    family_repo = StubFamilyRepository(family)
    account_repo = StubAccountRepository(accounts)
    child_repo = StubChildRepository(children or [])
    pillbox_repo = StubPillboxRepository(pillbox_plans or [])
    feeding_repo = StubFeedingRecordRepository(feeding_records)
    sleep_repo = StubSleepSessionRepository(sleep_sessions)
    access_service = SubscriptionAccessService(
        family_repo=family_repo,
        account_repo=account_repo,
        child_repo=child_repo,
        pillbox_repo=pillbox_repo,
    )
    subscription_repo = StubSubscriptionRepository()
    billing_event_repo = StubBillingEventRepository()
    service = BillingService(
        family_repo=family_repo,
        plan_repo=StubPlanRepository(
            [
                _plan(code="free", name="Free"),
                _plan(code="plus", name="Plus", entitlement="plus"),
                _plan(code="pro", name="Pro", entitlement="pro"),
            ]
        ),
        subscription_repo=subscription_repo,
        billing_event_repo=billing_event_repo,
        child_repo=child_repo,
        pillbox_repo=pillbox_repo,
        feeding_repo=feeding_repo,
        sleep_repo=sleep_repo,
        subscription_access_service=access_service,
    )
    return service, subscription_repo, billing_event_repo, feeding_repo, sleep_repo


def _pillbox_plan(
    *, family_id, owner_id, title: str, status: str = "active", created_at: datetime | None = None
) -> PillboxPlan:
    now = created_at or datetime.now(UTC)
    plan_id = uuid4()
    return PillboxPlan(
        id=plan_id,
        family_id=family_id,
        title=title,
        status=status,
        member_account_ids=[owner_id],
        created_by_account_id=owner_id,
        created_at=now,
        updated_at=now,
        medications=[
            PillboxMedication(
                id=uuid4(),
                plan_id=plan_id,
                household_medicine_id=None,
                custom_medicine_name="Demo",
                dose_amount="1",
                meal_rule="after_meal",
                repeat_days=[0],
                times=[],
                course_mode="continuous",
                course_start_date=None,
                course_end_date=None,
                position=0,
                created_at=now,
                updated_at=now,
            )
        ],
        dose_logs=[],
    )


@pytest.mark.asyncio
async def test_apply_debug_subscription_action_syncs_family_and_access() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(id=family_id, name="Family", plan_code="free", subscription_status="inactive")
    family.owner_account_id = owner.id
    service, subscription_repo, billing_event_repo, _, _ = _make_service(family, [owner])

    result = await service.apply_debug_subscription_action(
        _auth(owner),
        BillingDebugActionDto(plan_code="plus", status="active"),
    )

    assert result.family.plan_code == "plus"
    assert result.family.subscription_status == "active"
    assert result.family.billing_account_id == owner.id
    assert result.access.premium_active is True
    assert result.access.can_invite_members is True
    assert subscription_repo.current is not None
    assert subscription_repo.current.status == "active"
    assert len(billing_event_repo.items) == 1
    assert billing_event_repo.items[0].event_type == "debug_active"


@pytest.mark.asyncio
async def test_reset_debug_subscription_to_free_downgrades_access() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="stub",
    )
    oldest_child = Child(id=uuid4(), family_id=family_id, name="Misha", birth_date=None)
    newer_child = Child(id=uuid4(), family_id=family_id, name="Masha", birth_date=None)
    service, subscription_repo, billing_event_repo, _, _ = _make_service(
        family,
        [owner],
        children=[oldest_child, newer_child],
    )
    subscription_repo.current = Subscription(
        id=uuid4(),
        family_id=family_id,
        plan_id=uuid4(),
        provider="stub",
        provider_customer_id=None,
        provider_subscription_id=None,
        status="active",
        starts_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(days=30),
        trial_ends_at=None,
        canceled_at=None,
        raw_payload_json={},
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    result = await service.reset_debug_subscription_to_free(_auth(owner))

    assert result.family.plan_code == "free"
    assert result.family.subscription_status == "inactive"
    assert result.family.billing_account_id is None
    assert result.family.free_primary_child_id == oldest_child.id
    assert result.access.free_primary_child_id == oldest_child.id
    assert result.access.premium_active is False
    assert result.access.can_invite_members is False
    assert subscription_repo.current is not None
    assert subscription_repo.current.status == "inactive"
    assert len(billing_event_repo.items) == 1
    assert billing_event_repo.items[0].event_type == "debug_reset_free"


@pytest.mark.asyncio
async def test_non_owner_cannot_use_billing_debug() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="admin", email="mom@example.com")
    member = _build_account(family_id=family_id, family_role="adult", email="dad@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        plan_code="free",
        subscription_status="inactive",
    )
    service, _, _, _, _ = _make_service(family, [owner, member])

    with pytest.raises(ForbiddenError, match="владелец семьи"):
        await service.apply_debug_subscription_action(
            _auth(member),
            BillingDebugActionDto(plan_code="plus", status="active"),
        )


@pytest.mark.asyncio
async def test_provider_sync_updates_subscription_provider_fields_and_access() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        plan_code="free",
        subscription_status="inactive",
    )
    service, subscription_repo, billing_event_repo, _, _ = _make_service(family, [owner])
    expires_at = datetime.now(UTC) + timedelta(days=14)
    trial_ends_at = datetime.now(UTC) + timedelta(days=7)

    result = await service.sync_provider_subscription(
        _auth(owner),
        BillingProviderSyncDto(
            provider="revenuecat",
            plan_code="plus",
            status="trialing",
            product_id="pillpath_plus_monthly",
            provider_customer_id="rc_cus_123",
            provider_subscription_id="sub_123",
            entitlement_code="plus",
            expires_at=expires_at,
            trial_ends_at=trial_ends_at,
            raw_payload={"source": "test"},
        ),
    )

    assert result.family.plan_code == "plus"
    assert result.family.subscription_status == "trialing"
    assert result.family.subscription_provider == "revenuecat"
    assert result.family.subscription_product_id == "pillpath_plus_monthly"
    assert result.access.can_invite_members is True
    assert subscription_repo.current is not None
    assert subscription_repo.current.provider == "revenuecat"
    assert subscription_repo.current.provider_customer_id == "rc_cus_123"
    assert subscription_repo.current.provider_subscription_id == "sub_123"
    assert subscription_repo.current.trial_ends_at == trial_ends_at
    assert len(billing_event_repo.items) == 1
    assert billing_event_repo.items[0].event_type == "sync_revenuecat_trialing"


@pytest.mark.asyncio
async def test_provider_sync_free_inactive_clears_billing_owner() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    service, _, _, _, _ = _make_service(family, [owner])

    result = await service.sync_provider_subscription(
        _auth(owner),
        BillingProviderSyncDto(
            provider="revenuecat",
            plan_code="free",
            status="inactive",
            product_id=None,
            provider_customer_id=None,
            provider_subscription_id=None,
            entitlement_code="plus",
            expires_at=None,
            trial_ends_at=None,
            raw_payload={"source": "sync"},
        ),
    )

    assert result.family.plan_code == "free"
    assert result.family.subscription_status == "inactive"
    assert result.family.billing_account_id is None


@pytest.mark.asyncio
async def test_first_provider_sync_allows_family_owner_without_billing_account() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="admin", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        plan_code="free",
        subscription_status="inactive",
    )
    service, subscription_repo, _, _, _ = _make_service(family, [owner])

    result = await service.sync_provider_subscription(
        _auth(owner),
        BillingProviderSyncDto(
            provider="revenuecat",
            plan_code="plus",
            status="active",
            product_id="pillpath_plus_monthly",
            provider_customer_id="rc_cus_first",
            provider_subscription_id="sub_first",
            entitlement_code="premium",
            expires_at=datetime.now(UTC) + timedelta(days=30),
            trial_ends_at=None,
            raw_payload={"source": "test"},
        ),
    )

    assert result.family.billing_account_id == owner.id
    assert result.access.can_manage_subscription is True
    assert subscription_repo.current is not None
    assert subscription_repo.current.provider_customer_id == "rc_cus_first"


@pytest.mark.asyncio
async def test_provider_sync_rejects_non_billing_owner_after_first_purchase() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    second_admin = _build_account(family_id=family_id, family_role="admin", email="dad@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    service, _, _, _, _ = _make_service(family, [owner, second_admin])

    with pytest.raises(ForbiddenError, match="владелец семьи"):
        await service.sync_provider_subscription(
            _auth(second_admin),
            BillingProviderSyncDto(
                provider="revenuecat",
                plan_code="plus",
                status="active",
                product_id="pillpath_plus_monthly",
                provider_customer_id="rc_cus_other",
                provider_subscription_id="sub_other",
                entitlement_code="premium",
                expires_at=datetime.now(UTC) + timedelta(days=30),
                trial_ends_at=None,
                raw_payload={"source": "test"},
            ),
        )


@pytest.mark.asyncio
async def test_provider_sync_rejects_subscription_transfer_to_another_family() -> None:
    first_family_id = uuid4()
    second_family_id = uuid4()
    second_owner = _build_account(
        family_id=second_family_id,
        family_role="owner",
        email="second@example.com",
    )
    second_family = Family(
        id=second_family_id,
        name="Second family",
        owner_account_id=second_owner.id,
        billing_account_id=second_owner.id,
        plan_code="free",
        subscription_status="inactive",
    )
    service, subscription_repo, _, _, _ = _make_service(second_family, [second_owner])
    existing = Subscription(
        id=uuid4(),
        family_id=first_family_id,
        plan_id=uuid4(),
        provider="revenuecat",
        provider_customer_id="rc_customer_shared",
        provider_subscription_id="com.pillpath.premium.monthly#2026-04-27T10:00:00Z",
        status="active",
        starts_at=datetime.now(UTC) - timedelta(days=1),
        expires_at=datetime.now(UTC) + timedelta(days=29),
        trial_ends_at=None,
        canceled_at=None,
        raw_payload_json={"source": "existing"},
        created_at=datetime.now(UTC) - timedelta(days=1),
        updated_at=datetime.now(UTC) - timedelta(days=1),
    )
    await subscription_repo.add(existing)

    with pytest.raises(
        ValidationError,
        match="подписка уже используется в другой семье",
    ) as exc:
        await service.sync_provider_subscription(
            _auth(second_owner),
            BillingProviderSyncDto(
                provider="revenuecat",
                plan_code="plus",
                status="active",
                product_id="com.pillpath.premium.monthly",
                provider_customer_id="rc_customer_shared",
                provider_subscription_id="com.pillpath.premium.monthly#2026-04-27T10:00:00Z",
                entitlement_code="plus",
                expires_at=datetime.now(UTC) + timedelta(days=30),
                trial_ends_at=None,
                raw_payload={"source": "restore"},
            ),
        )

    assert exc.value.code == "SUBSCRIPTION_ALREADY_LINKED_TO_ANOTHER_FAMILY"


@pytest.mark.asyncio
async def test_provider_sync_maps_unique_subscription_conflict_to_business_error() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    service, subscription_repo, _, _, _ = _make_service(family, [owner])
    existing = Subscription(
        id=uuid4(),
        family_id=family_id,
        plan_id=uuid4(),
        provider="revenuecat",
        provider_customer_id="rc_customer_existing",
        provider_subscription_id=None,
        status="active",
        starts_at=datetime.now(UTC) - timedelta(days=1),
        expires_at=datetime.now(UTC) + timedelta(days=29),
        trial_ends_at=None,
        canceled_at=None,
        raw_payload_json={"source": "existing"},
        created_at=datetime.now(UTC) - timedelta(days=1),
        updated_at=datetime.now(UTC) - timedelta(days=1),
    )
    duplicate_repo = DuplicateProviderSubscriptionOnUpdateRepository()
    duplicate_repo.current = existing
    duplicate_repo.items = [existing]
    service._subscription_repo = duplicate_repo

    with pytest.raises(
        ValidationError,
        match="подписка уже используется в другой семье",
    ) as exc:
        await service.sync_provider_subscription(
            _auth(owner),
            BillingProviderSyncDto(
                provider="revenuecat",
                plan_code="plus",
                status="active",
                product_id="com.pillpath.premium.monthly",
                provider_customer_id="rc_customer_existing",
                provider_subscription_id="2000001160731048",
                entitlement_code="plus",
                expires_at=datetime.now(UTC) + timedelta(days=30),
                trial_ends_at=None,
                raw_payload={"source": "restore"},
            ),
        )

    assert exc.value.code == "SUBSCRIPTION_ALREADY_LINKED_TO_ANOTHER_FAMILY"


@pytest.mark.asyncio
async def test_downgrade_stops_active_trackers_for_non_primary_children_only() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    primary_child = Child(id=uuid4(), family_id=family_id, name="Misha", birth_date=None)
    secondary_child = Child(id=uuid4(), family_id=family_id, name="Masha", birth_date=None)
    now = datetime.now(UTC)
    primary_feeding = FeedingRecord(
        id=uuid4(),
        child_id=primary_child.id,
        feeding_type="breast",
        breast_side="left",
        is_expressed=False,
        formula_volume_ml=None,
        recorded_at=now - timedelta(minutes=10),
        started_at=now - timedelta(minutes=10),
        ended_at=None,
        duration_minutes=None,
        status="active",
        note=None,
        created_by_account_id=owner.id,
    )
    secondary_feeding = FeedingRecord(
        id=uuid4(),
        child_id=secondary_child.id,
        feeding_type="formula",
        breast_side=None,
        is_expressed=False,
        formula_volume_ml=120,
        recorded_at=now - timedelta(minutes=20),
        started_at=now - timedelta(minutes=20),
        ended_at=None,
        duration_minutes=None,
        status="active",
        note=None,
        created_by_account_id=owner.id,
    )
    primary_sleep = SleepSession(
        id=uuid4(),
        child_id=primary_child.id,
        started_at=now - timedelta(hours=1),
        ended_at=None,
        status="active",
        created_by_account_id=owner.id,
    )
    secondary_sleep = SleepSession(
        id=uuid4(),
        child_id=secondary_child.id,
        started_at=now - timedelta(hours=2),
        ended_at=None,
        status="active",
        created_by_account_id=owner.id,
    )
    service, _, _, feeding_repo, sleep_repo = _make_service(
        family,
        [owner],
        children=[primary_child, secondary_child],
        feeding_records=[primary_feeding, secondary_feeding],
        sleep_sessions=[primary_sleep, secondary_sleep],
    )

    result = await service.reset_debug_subscription_to_free(_auth(owner))

    assert result.family.plan_code == "free"
    assert result.family.free_primary_child_id == primary_child.id

    updated_primary_feeding = feeding_repo.items[primary_feeding.id]
    updated_secondary_feeding = feeding_repo.items[secondary_feeding.id]
    assert updated_primary_feeding.status == "active"
    assert updated_primary_feeding.ended_at is None
    assert updated_secondary_feeding.status == "completed"
    assert updated_secondary_feeding.ended_at is not None
    assert updated_secondary_feeding.duration_minutes is not None

    updated_primary_sleep = sleep_repo.items[primary_sleep.id]
    updated_secondary_sleep = sleep_repo.items[secondary_sleep.id]
    assert updated_primary_sleep.status == "active"
    assert updated_primary_sleep.ended_at is None
    assert updated_secondary_sleep.status == "completed"
    assert updated_secondary_sleep.ended_at is not None


@pytest.mark.asyncio
async def test_downgrade_keeps_one_pillbox_plan_active_and_archives_others() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    oldest_plan = _pillbox_plan(
        family_id=family_id,
        owner_id=owner.id,
        title="Morning meds",
        status="active",
        created_at=datetime(2026, 4, 1, 8, 0, tzinfo=UTC),
    )
    newer_plan = _pillbox_plan(
        family_id=family_id,
        owner_id=owner.id,
        title="Evening meds",
        status="paused",
        created_at=datetime(2026, 4, 10, 8, 0, tzinfo=UTC),
    )
    archived_plan = _pillbox_plan(
        family_id=family_id,
        owner_id=owner.id,
        title="Old plan",
        status="archived",
        created_at=datetime(2026, 3, 1, 8, 0, tzinfo=UTC),
    )
    service, _, _, _, _ = _make_service(
        family,
        [owner],
        pillbox_plans=[newer_plan, archived_plan, oldest_plan],
    )

    result = await service.reset_debug_subscription_to_free(_auth(owner))

    assert result.family.plan_code == "free"
    assert result.family.free_primary_pillbox_plan_id == oldest_plan.id
    assert result.access.free_primary_pillbox_plan_id == oldest_plan.id
    assert result.access.current_pillbox_plan_count == 3

    pillbox_repo = service._pillbox_repo  # noqa: SLF001
    plans_by_id = {plan.id: plan for plan in pillbox_repo.plans}
    assert plans_by_id[oldest_plan.id].status == "active"
    assert plans_by_id[newer_plan.id].status == "paused"
    assert plans_by_id[archived_plan.id].status == "archived"


@pytest.mark.asyncio
async def test_downgrade_prefers_active_primary_pillbox_plan_over_older_paused_plan() -> None:
    family_id = uuid4()
    owner = _build_account(family_id=family_id, family_role="owner", email="mom@example.com")
    family = Family(
        id=family_id,
        name="Family",
        owner_account_id=owner.id,
        billing_account_id=owner.id,
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
    )
    older_paused = _pillbox_plan(
        family_id=family_id,
        owner_id=owner.id,
        title="Paused vitamins",
        status="paused",
        created_at=datetime(2026, 3, 1, 8, 0, tzinfo=UTC),
    )
    newer_active = _pillbox_plan(
        family_id=family_id,
        owner_id=owner.id,
        title="Active antibiotics",
        status="active",
        created_at=datetime(2026, 4, 1, 8, 0, tzinfo=UTC),
    )
    service, _, _, _, _ = _make_service(
        family,
        [owner],
        pillbox_plans=[older_paused, newer_active],
    )

    result = await service.reset_debug_subscription_to_free(_auth(owner))

    assert result.family.free_primary_pillbox_plan_id == newer_active.id

    pillbox_repo = service._pillbox_repo  # noqa: SLF001
    plans_by_id = {plan.id: plan for plan in pillbox_repo.plans}
    assert plans_by_id[newer_active.id].status == "active"
    assert plans_by_id[older_paused.id].status == "paused"
