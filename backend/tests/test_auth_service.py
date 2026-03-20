from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from src.application.dto.auth import LoginDto, RegisterDto
from src.application.services.auth_service import AuthService
from src.core.exceptions import UnauthorizedError
from src.core.security import hash_password, hash_session_token
from src.domain.entities.account import Account
from src.domain.entities.family import Family
from src.domain.entities.family_invite import FamilyInvite


class StubAccountRepository:
    def __init__(self) -> None:
        self.items: dict = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def get_by_email(self, email):  # noqa: ANN001
        return next((item for item in self.items.values() if item.email == email), None)

    async def get_by_login(self, login):  # noqa: ANN001
        return next((item for item in self.items.values() if item.login == login), None)

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return next((item for item in self.items.values() if item.family_id == family_id), None)

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [item for item in self.items.values() if item.family_id == family_id]

    async def add(self, entity: Account) -> Account:
        self.items[entity.id] = entity
        return entity

    async def update(self, entity: Account) -> Account:
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubSessionRepository:
    def __init__(self) -> None:
        self.items = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def add(self, entity):  # noqa: ANN001
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items.pop(id, None)
        return True

    async def delete_by_account_id(self, account_id):  # noqa: ANN001
        return True


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family
        self.deleted_ids: list = []

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if id == self.family.id else None

    async def add(self, entity):  # noqa: ANN001
        self.family = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.deleted_ids.append(id)
        return True


class StubChildRepository:
    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return []


class StubHouseholdMedicineRepository:
    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return []


class StubParentRepository:
    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return []


class StubFamilyInviteRepository:
    def __init__(self, invite: FamilyInvite | None) -> None:
        self.invite = invite

    async def get_by_token_hash(self, token_hash):  # noqa: ANN001
        if self.invite and self.invite.token_hash == token_hash:
            return self.invite
        return None

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        self.invite = entity
        return entity


def build_account(
    *,
    family_id,
    login: str,
    email: str | None,
    display_name: str,
    family_role: str,
) -> Account:  # noqa: ANN001
    return Account(
        id=uuid4(),
        login=login,
        email=email,
        password_hash=hash_password("password123"),
        family_id=family_id,
        display_name=display_name,
        family_role=family_role,
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_signup_with_invite_joins_existing_family() -> None:
    family = Family(id=uuid4(), name="Семья Петровых")
    raw_token = "invite-token"
    invite = FamilyInvite(
        id=uuid4(),
        family_id=family.id,
        created_by_account_id=uuid4(),
        token_hash=hash_session_token(raw_token),
        family_role="adult",
        created_at=datetime.now(UTC) - timedelta(minutes=5),
        expires_at=datetime.now(UTC) + timedelta(days=1),
        accepted_at=None,
        accepted_by_account_id=None,
    )
    account_repo = StubAccountRepository()
    family_invite_repo = StubFamilyInviteRepository(invite)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=family_invite_repo,
    )

    result = await service.signup(
        RegisterDto(
            login="dad_login",
            email="dad@example.com",
            password="password123",
            display_name="Папа",
            remember_me=True,
            invite_token=raw_token,
        )
    )

    assert result.family.id == family.id
    assert result.family.name == "Семья Петровых"
    assert result.account.family_id == family.id
    assert result.account.family_role == "adult"
    assert result.account.login == "dad_login"
    assert result.account.display_name == "Папа"
    assert result.remember_me is True
    assert family_invite_repo.invite is not None
    assert family_invite_repo.invite.accepted_at is not None


@pytest.mark.asyncio
async def test_existing_account_accepts_invite_into_other_family() -> None:
    source_family = Family(id=uuid4(), name="Старая семья")
    target_family = Family(id=uuid4(), name="Семья Петровых")
    raw_token = "invite-token"
    now = datetime.now(UTC)
    invite = FamilyInvite(
        id=uuid4(),
        family_id=target_family.id,
        created_by_account_id=uuid4(),
        token_hash=hash_session_token(raw_token),
        family_role="adult",
        created_at=now - timedelta(minutes=5),
        expires_at=now + timedelta(days=1),
        accepted_at=None,
        accepted_by_account_id=None,
    )
    account_repo = StubAccountRepository()
    existing_account = build_account(
        family_id=source_family.id,
        login="dad_login",
        email="dad@example.com",
        display_name="Папа",
        family_role="owner",
    )
    await account_repo.add(existing_account)
    session_repo = StubSessionRepository()
    family_repo = StubFamilyRepository(target_family)
    family_invite_repo = StubFamilyInviteRepository(invite)
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=family_repo,
        family_invite_repo=family_invite_repo,
        child_repo=StubChildRepository(),
        household_repo=StubHouseholdMedicineRepository(),
        parent_repo=StubParentRepository(),
    )

    result = await service.accept_family_invite(existing_account.id, raw_token)

    assert result.family.id == target_family.id
    assert result.account.family_id == target_family.id
    assert result.account.family_role == "adult"
    assert family_invite_repo.invite is not None
    assert family_invite_repo.invite.accepted_by_account_id == existing_account.id
    assert family_repo.deleted_ids == [source_family.id]


@pytest.mark.asyncio
async def test_signup_uses_login_as_default_display_name() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    service = AuthService(
        account_repo=StubAccountRepository(),
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.signup(
        RegisterDto(
            login="mama_anya",
            email="mama@example.com",
            password="password123",
        )
    )

    assert result.account.login == "mama_anya"
    assert result.account.display_name == "mama_anya"


@pytest.mark.asyncio
async def test_signup_allows_missing_email() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    service = AuthService(
        account_repo=StubAccountRepository(),
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.signup(
        RegisterDto(
            login="test_parent",
            password="password123",
        )
    )

    assert result.account.email is None


@pytest.mark.asyncio
async def test_signin_uses_login_instead_of_email() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama_anya",
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.signin(LoginDto(login="mama_anya", password="password123"))

    assert result.account.id == account.id
    assert result.account.login == "mama_anya"


@pytest.mark.asyncio
async def test_signin_rejects_email_in_login_field() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    await account_repo.add(
        build_account(
            family_id=family.id,
            login="mama_anya",
            email="mama@example.com",
            display_name="Мама Аня",
            family_role="owner",
        )
    )
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(UnauthorizedError, match="Неверный логин или пароль"):
        await service.signin(LoginDto(login="mama@example.com", password="password123"))
