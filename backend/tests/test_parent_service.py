from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.application.dto.parent import ParentCreateDto
from src.application.services.parent_service import ParentService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.family import Family


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if id == self.family.id else None


class StubAccountRepository:
    def __init__(self, accounts: list[Account]) -> None:
        self.accounts = accounts

    async def get_by_id(self, id):  # noqa: ANN001
        return next((account for account in self.accounts if account.id == id), None)

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [account for account in self.accounts if account.family_id == family_id]


def build_account(*, family_id, display_name: str, family_role: str) -> Account:  # noqa: ANN001
    return Account(
        id=uuid4(),
        email=f"{display_name.lower()}@example.com",
        password_hash="hash",
        family_id=family_id,
        display_name=display_name,
        family_role=family_role,
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime(2026, 3, 20, 10, 0, tzinfo=UTC),
    )


@pytest.mark.asyncio
async def test_get_by_family_id_returns_accounts_as_legacy_parents() -> None:
    family = Family(id=uuid4(), name="Семья")
    owner = build_account(family_id=family.id, display_name="Мама", family_role="owner")
    adult = build_account(family_id=family.id, display_name="Папа", family_role="adult")
    service = ParentService(
        account_repo=StubAccountRepository([owner, adult]),
        family_repo=StubFamilyRepository(family),
    )

    result = await service.get_by_family_id_for_account(family.id, family.id)

    assert [item.name for item in result] == ["Мама", "Папа"]
    assert [item.role for item in result] == ["owner", "adult"]


@pytest.mark.asyncio
async def test_get_by_family_id_for_account_rejects_other_family() -> None:
    family = Family(id=uuid4(), name="Семья")
    account = build_account(family_id=family.id, display_name="Мама", family_role="owner")
    service = ParentService(
        account_repo=StubAccountRepository([account]),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ForbiddenError, match="чужой семье"):
        await service.get_by_family_id_for_account(uuid4(), family.id)


@pytest.mark.asyncio
async def test_create_rejects_legacy_parent_mutation() -> None:
    family = Family(id=uuid4(), name="Семья")
    service = ParentService(
        account_repo=StubAccountRepository([]),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ValidationError, match="Legacy /parents API"):
        await service.create(
            ParentCreateDto(
                family_id=family.id,
                name="Новый родитель",
                role="мама",
            )
        )
