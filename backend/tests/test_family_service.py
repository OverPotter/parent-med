from datetime import UTC, date, datetime, time
from uuid import uuid4

import pytest

from src.application.dto.family import (
    FamilyMemberProfileUpdateDto,
    FamilyMemberUpdateDto,
    FamilyUpdateDto,
)
from src.application.dto.family_access import FamilyAccessPolicyUpdateDto
from src.application.services.family_service import FamilyService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.child import Child
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.entities.family import Family
from src.domain.entities.family_access import FamilyAccessPolicy
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.pillbox import PillboxMedication, PillboxPlan


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family
        self.items = {family.id: family}
        self.added_entities: list[Family] = []

    async def list_all(self):  # noqa: ANN001
        return list(self.items.values())

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def add(self, entity):  # noqa: ANN001
        self.added_entities.append(entity)
        self.family = entity
        self.items[entity.id] = entity
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.family = entity
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items.pop(id, None)
        return True


class StubAccountRepository:
    def __init__(self, accounts: list[Account]) -> None:
        self.accounts = accounts

    async def get_by_id(self, id):  # noqa: ANN001
        return next((account for account in self.accounts if account.id == id), None)

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [account for account in self.accounts if account.family_id == family_id]

    async def update(self, entity):  # noqa: ANN001
        self.accounts = [account for account in self.accounts if account.id != entity.id]
        self.accounts.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.accounts = [account for account in self.accounts if account.id != id]
        return True


class StubAccountSessionRepository:
    def __init__(self) -> None:
        self.deleted_account_ids: list = []

    async def delete_by_account_id(self, account_id):  # noqa: ANN001
        self.deleted_account_ids.append(account_id)
        return 1


class StubChildRepository:
    def __init__(self, children: list[Child]) -> None:
        self.children = children

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [child for child in self.children if child.family_id == family_id]


class StubIllnessEpisodeRepository:
    def __init__(self, episodes: list[IllnessEpisode]) -> None:
        self.episodes = episodes

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [episode for episode in self.episodes if episode.child_id == child_id]

    async def update(self, entity):  # noqa: ANN001
        self.episodes = [episode for episode in self.episodes if episode.id != entity.id] + [entity]
        return entity


class StubEpisodeMedicationPlanRepository:
    def __init__(self, plans: list[EpisodeMedicationPlan]) -> None:
        self.plans = plans

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return [plan for plan in self.plans if plan.episode_id == episode_id]

    async def update(self, entity):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != entity.id] + [entity]
        return entity


class StubPillboxRepository:
    def __init__(self, plans: list[PillboxPlan]) -> None:
        self.plans = plans

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [plan for plan in self.plans if plan.family_id == family_id]

    async def update(self, entity):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != entity.id] + [entity]
        return entity


@pytest.mark.asyncio
async def test_list_members_for_account_returns_admin_first() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    adult = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="adult",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([adult, owner]),
        session_repo=StubAccountSessionRepository(),
    )

    members = await service.list_members_for_account(family.id)

    assert [member.display_name for member in members] == ["Мама", "Папа"]
    assert members[0].family_role == "admin"


@pytest.mark.asyncio
async def test_family_owner_role_cannot_be_demoted() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(
        ValidationError, match="Владелец семьи должен сохранять права администратора"
    ):
        await service.update_member_for_account(
            member_account_id=owner.id,
            dto=FamilyMemberUpdateDto(family_role="member"),
            current_account_id=owner.id,
            current_family_id=family.id,
            current_family_role="owner",
        )


@pytest.mark.asyncio
async def test_delete_member_revokes_sessions() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    adult = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="adult",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    session_repo = StubAccountSessionRepository()
    account_repo = StubAccountRepository([owner, adult])
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=account_repo,
        session_repo=session_repo,
    )

    await service.delete_member_for_account(
        member_account_id=adult.id,
        current_account_id=owner.id,
        current_family_id=family.id,
        current_family_role="owner",
    )

    assert session_repo.deleted_account_ids == [adult.id]
    updated_adult = next(account for account in account_repo.accounts if account.id == adult.id)
    assert updated_adult.family_id != family.id
    assert updated_adult.family_role == "admin"
    assert updated_adult.access_policy.all_children is True
    assert updated_adult.access_policy.children_access == "edit"
    assert updated_adult.access_policy.cabinet_access == "edit"
    assert updated_adult.access_policy.pillbox_access == "edit"
    new_family = service._repo.items[updated_adult.family_id]
    assert new_family.owner_account_id == adult.id
    assert new_family.name == "Моя семья"


@pytest.mark.asyncio
async def test_delete_member_removes_member_from_all_recipient_lists() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    removed_member = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    other_member = Account(
        id=uuid4(),
        email="nanny@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Няня",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    family.cabinet_member_account_ids = [removed_member.id, other_member.id]

    child = Child(id=uuid4(), family_id=family.id, name="Ребёнок", birth_date=None)
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 20),
        title="ОРВИ",
        status="active",
        medication_mode="guided",
        note=None,
        closed_at=None,
        deleted_at=None,
        member_account_ids=[removed_member.id, other_member.id],
        created_by_account_id=owner.id,
    )
    episode_plan = EpisodeMedicationPlan(
        id=uuid4(),
        episode_id=episode.id,
        household_medicine_id=None,
        custom_medicine_name="Смекта",
        dose_amount="1 пакет",
        min_interval_minutes=360,
        max_doses_per_day=None,
        weight_kg=None,
        dose_mg_per_kg=None,
        calculated_dose_mg=None,
        calculated_dose_value=None,
        calculated_dose_unit=None,
        dose_calc_mode=None,
        dose_calc_warning=None,
        manual_dose_override=False,
        notes=None,
        member_account_ids=[removed_member.id, other_member.id],
        reminders_enabled=True,
        reminder_before_minutes=15,
        notify_at_due=True,
        last_before_notification_for_at=None,
        last_due_notification_for_at=None,
        last_overdue_notification_for_at=None,
        created_at=datetime(2026, 3, 20, 11, 0, tzinfo=UTC),
    )
    pillbox_plan = PillboxPlan(
        id=uuid4(),
        family_id=family.id,
        title="Курс",
        status="active",
        member_account_ids=[removed_member.id, other_member.id],
        created_by_account_id=owner.id,
        created_at=datetime(2026, 3, 20, 12, 0, tzinfo=UTC),
        updated_at=datetime(2026, 3, 20, 12, 0, tzinfo=UTC),
        medications=[
            PillboxMedication(
                id=uuid4(),
                plan_id=uuid4(),
                household_medicine_id=None,
                custom_medicine_name="Уголь",
                dose_amount="1 таб",
                meal_rule="any",
                repeat_days=[1],
                times=[time(9, 0)],
                course_mode="continuous",
                course_start_date=None,
                course_end_date=None,
                position=0,
                created_at=datetime(2026, 3, 20, 12, 0, tzinfo=UTC),
                updated_at=datetime(2026, 3, 20, 12, 0, tzinfo=UTC),
            )
        ],
    )

    session_repo = StubAccountSessionRepository()
    account_repo = StubAccountRepository([owner, removed_member, other_member])
    family_repo = StubFamilyRepository(family)
    episode_repo = StubIllnessEpisodeRepository([episode])
    episode_plan_repo = StubEpisodeMedicationPlanRepository([episode_plan])
    pillbox_repo = StubPillboxRepository([pillbox_plan])
    service = FamilyService(
        family_repo=family_repo,
        account_repo=account_repo,
        session_repo=session_repo,
        child_repo=StubChildRepository([child]),
        episode_repo=episode_repo,
        episode_plan_repo=episode_plan_repo,
        pillbox_repo=pillbox_repo,
    )

    await service.delete_member_for_account(
        member_account_id=removed_member.id,
        current_account_id=owner.id,
        current_family_id=family.id,
        current_family_role="owner",
    )

    assert family_repo.items[family.id].cabinet_member_account_ids == [other_member.id]
    updated_episode = next(item for item in episode_repo.episodes if item.id == episode.id)
    assert updated_episode.member_account_ids == [other_member.id]
    updated_episode_plan = next(item for item in episode_plan_repo.plans if item.id == episode_plan.id)
    assert updated_episode_plan.member_account_ids == [other_member.id]
    updated_pillbox_plan = next(item for item in pillbox_repo.plans if item.id == pillbox_plan.id)
    assert updated_pillbox_plan.member_account_ids == [other_member.id]


@pytest.mark.asyncio
async def test_admin_cannot_delete_family_owner() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    second_admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, second_admin]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="только участниками member"):
        await service.delete_member_for_account(
            member_account_id=owner.id,
            current_account_id=second_admin.id,
            current_family_id=family.id,
            current_family_role="admin",
        )


@pytest.mark.asyncio
async def test_admin_can_update_member_access_policy_only() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    member = Account(
        id=uuid4(),
        email="grandma@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Бабушка",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin, member]),
        session_repo=StubAccountSessionRepository(),
    )

    updated = await service.update_member_for_account(
        member_account_id=member.id,
        dto=FamilyMemberUpdateDto(access_policy=FamilyAccessPolicyUpdateDto(cabinet_access="view")),
        current_account_id=admin.id,
        current_family_id=family.id,
        current_family_role="admin",
    )

    assert updated.access_policy.cabinet_access == "view"
    assert updated.family_role == "member"


@pytest.mark.asyncio
async def test_admin_cannot_change_member_role() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    member = Account(
        id=uuid4(),
        email="grandma@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Бабушка",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin, member]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="владелец семьи"):
        await service.update_member_for_account(
            member_account_id=member.id,
            dto=FamilyMemberUpdateDto(family_role="admin"),
            current_account_id=admin.id,
            current_family_id=family.id,
            current_family_role="admin",
        )


@pytest.mark.asyncio
async def test_admin_cannot_manage_other_admin() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    second_admin = Account(
        id=uuid4(),
        email="aunt@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Тётя",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin, second_admin]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="только участниками member"):
        await service.update_member_for_account(
            member_account_id=second_admin.id,
            dto=FamilyMemberUpdateDto(
                access_policy=FamilyAccessPolicyUpdateDto(cabinet_access="view")
            ),
            current_account_id=admin.id,
            current_family_id=family.id,
            current_family_role="admin",
        )


@pytest.mark.asyncio
async def test_admin_cannot_manage_self() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ValidationError, match="свои семейные права"):
        await service.update_member_for_account(
            member_account_id=admin.id,
            dto=FamilyMemberUpdateDto(
                access_policy=FamilyAccessPolicyUpdateDto(cabinet_access="none")
            ),
            current_account_id=admin.id,
            current_family_id=family.id,
            current_family_role="admin",
        )


@pytest.mark.asyncio
async def test_admin_cannot_delete_other_admin() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    second_admin = Account(
        id=uuid4(),
        email="aunt@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Тётя",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin, second_admin]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="только участниками member"):
        await service.delete_member_for_account(
            member_account_id=second_admin.id,
            current_account_id=admin.id,
            current_family_id=family.id,
            current_family_role="admin",
        )


@pytest.mark.asyncio
async def test_member_can_update_own_profile() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    adult = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="adult",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([adult]),
        session_repo=StubAccountSessionRepository(),
    )

    updated = await service.update_member_profile_for_account(
        member_account_id=adult.id,
        dto=FamilyMemberProfileUpdateDto(
            display_name="Папа Антон",
            relationship_label="папа",
            phone="+375291234567",
        ),
        current_account_id=adult.id,
        current_family_id=family.id,
        current_family_role="adult",
    )

    assert updated.display_name == "Папа Антон"
    assert updated.relationship_label == "папа"
    assert updated.phone == "+375291234567"


@pytest.mark.asyncio
async def test_update_family_saves_cabinet_recipients() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    adult = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="adult",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, adult]),
        session_repo=StubAccountSessionRepository(),
    )

    updated = await service.update(
        family.id,
        dto=FamilyUpdateDto(cabinet_member_account_ids=[adult.id]),
    )

    assert updated.cabinet_member_account_ids == [adult.id]


@pytest.mark.asyncio
async def test_update_family_rejects_foreign_cabinet_recipient() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    foreign_member_id = uuid4()
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="Нельзя выбрать получателей из другой семьи"):
        await service.update(
            family.id,
            dto=FamilyUpdateDto(cabinet_member_account_ids=[foreign_member_id]),
        )


@pytest.mark.asyncio
async def test_update_family_rejects_cabinet_recipient_without_cabinet_access() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    hidden_member = Account(
        id=uuid4(),
        email="grandma@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Бабушка",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
        access_policy=FamilyAccessPolicy(cabinet_access="none"),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, hidden_member]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="доступа к аптечке"):
        await service.update(
            family.id,
            dto=FamilyUpdateDto(cabinet_member_account_ids=[hidden_member.id]),
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("cabinet_access", "expected_allowed"),
    [
        ("view", True),
        ("edit", True),
        ("none", False),
    ],
)
async def test_update_family_cabinet_recipient_matrix(
    cabinet_access: str,
    expected_allowed: bool,
) -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    member = Account(
        id=uuid4(),
        email="relative@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Родственник",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
        access_policy=FamilyAccessPolicy(cabinet_access=cabinet_access),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, member]),
        session_repo=StubAccountSessionRepository(),
    )

    if expected_allowed:
        updated = await service.update(
            family.id,
            dto=FamilyUpdateDto(cabinet_member_account_ids=[member.id]),
        )
        assert updated.cabinet_member_account_ids == [member.id]
        return

    with pytest.raises(ForbiddenError, match="доступа к аптечке"):
        await service.update(
            family.id,
            dto=FamilyUpdateDto(cabinet_member_account_ids=[member.id]),
        )


@pytest.mark.asyncio
async def test_update_family_for_account_requires_owner() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    admin = Account(
        id=uuid4(),
        email="dad@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Папа",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, admin]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="владелец семьи"):
        await service.update_for_account(
            family.id,
            FamilyUpdateDto(name="Новая семья"),
            current_family_id=family.id,
            current_account_id=admin.id,
        )


@pytest.mark.asyncio
async def test_owner_can_update_family_for_account() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="admin",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    family.owner_account_id = owner.id
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        session_repo=StubAccountSessionRepository(),
    )

    updated = await service.update_for_account(
        family.id,
        FamilyUpdateDto(name="Новая семья"),
        current_family_id=family.id,
        current_account_id=owner.id,
    )

    assert updated.name == "Новая семья"


@pytest.mark.asyncio
async def test_family_response_includes_subscription_defaults() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([]),
        session_repo=StubAccountSessionRepository(),
    )

    result = await service.get_by_id(family.id)

    assert result.plan_code == "free"
    assert result.subscription_status == "inactive"
    assert result.subscription_provider is None
    assert result.subscription_product_id is None
    assert result.subscription_expires_at is None
    assert result.premium_active is False


@pytest.mark.asyncio
async def test_family_response_marks_plus_subscription_as_premium() -> None:
    family = Family(
        id=uuid4(),
        name="Моя семья",
        plan_code="plus",
        subscription_status="active",
        subscription_provider="revenuecat",
        subscription_product_id="pillpath_plus_monthly",
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([]),
        session_repo=StubAccountSessionRepository(),
    )

    result = await service.get_by_id(family.id)

    assert result.plan_code == "plus"
    assert result.subscription_status == "active"
    assert result.subscription_provider == "revenuecat"
    assert result.subscription_product_id == "pillpath_plus_monthly"
    assert result.premium_active is True


@pytest.mark.asyncio
async def test_update_member_rejects_pillbox_push_without_action_access() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    member = Account(
        id=uuid4(),
        email="grandma@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Бабушка",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, member]),
        session_repo=StubAccountSessionRepository(),
    )

    result = await service.update_member_for_account(
        member_account_id=member.id,
        dto=FamilyMemberUpdateDto(
            access_policy=FamilyAccessPolicyUpdateDto(
                cabinet_access="none",
                cabinet_push_enabled=True,
            )
        ),
        current_account_id=owner.id,
        current_family_id=family.id,
        current_family_role="owner",
    )

    assert result.access_policy.cabinet_access == "none"
    assert result.access_policy.cabinet_push_enabled is False


@pytest.mark.asyncio
async def test_update_member_rejects_pillbox_edit_without_children_edit_access() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        email="mom@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Мама",
        family_role="owner",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 8, 0, tzinfo=UTC),
    )
    member = Account(
        id=uuid4(),
        email="grandma@example.com",
        password_hash="hash",
        family_id=family.id,
        display_name="Бабушка",
        family_role="member",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 9, 0, tzinfo=UTC),
    )
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner, member]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(
        ValidationError, match="Полный доступ к приёмам требует права на изменение детей"
    ):
        await service.update_member_for_account(
            member_account_id=member.id,
            dto=FamilyMemberUpdateDto(
                access_policy=FamilyAccessPolicyUpdateDto(
                    children_access="view",
                    pillbox_access="edit",
                )
            ),
            current_account_id=owner.id,
            current_family_id=family.id,
            current_family_role="owner",
        )
