from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.application.dto.family import FamilyMemberUpdateDto
from src.application.services.family_service import FamilyService
from src.core.exceptions import ValidationError
from src.domain.entities.account import Account
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
async def test_list_members_for_account_returns_owner_first() -> None:
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
        account_repo=StubAccountRepository([adult, owner]),
        session_repo=StubAccountSessionRepository(),
    )

    members = await service.list_members_for_account(family.id)

    assert [member.display_name for member in members] == ["Мама", "Папа"]
    assert members[0].family_role == "owner"


@pytest.mark.asyncio
async def test_delete_member_rejects_last_owner() -> None:
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
    service = FamilyService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository([owner]),
        session_repo=StubAccountSessionRepository(),
    )

    with pytest.raises(ValidationError, match="хотя бы один владелец"):
        await service.update_member_for_account(
            member_account_id=owner.id,
            dto=FamilyMemberUpdateDto(family_role="adult"),
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
    assert all(account.id != adult.id for account in account_repo.accounts)
