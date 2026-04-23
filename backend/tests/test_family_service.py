from datetime import UTC, datetime
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
from src.domain.entities.family_access import FamilyAccessPolicy
from src.domain.entities.family import Family


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def list_all(self):  # noqa: ANN001
        return [self.family]

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if id == self.family.id else None

    async def add(self, entity):  # noqa: ANN001
        self.family = entity
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.family = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
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


@pytest.mark.asyncio
async def test_list_members_for_account_returns_admin_first() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        login="mama",
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
        login="papa",
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
async def test_delete_member_rejects_last_admin() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    owner = Account(
        id=uuid4(),
        login="mama",
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
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ValidationError, match="хотя бы один администратор"):
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
        login="mama",
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
        login="papa",
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
    assert all(account.id != adult.id for account in account_repo.accounts)


@pytest.mark.asyncio
async def test_member_can_update_own_profile() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    adult = Account(
        id=uuid4(),
        login="papa",
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
        login="mama",
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
        login="papa",
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
        login="mama",
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
        login="mama",
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
        login="grandma",
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
        login="mama",
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
        login="relative",
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
async def test_update_family_for_account_requires_admin() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    member = Account(
        id=uuid4(),
        login="papa",
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
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([member]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ForbiddenError, match="администратор семьи"):
        await service.update_for_account(
            family.id,
            FamilyUpdateDto(name="Новая семья"),
            current_family_id=family.id,
            current_family_role="member",
        )


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
        login="mama",
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
        login="grandma",
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
        login="mama",
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
        login="grandma",
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
