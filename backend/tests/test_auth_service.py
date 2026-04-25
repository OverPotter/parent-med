from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from src.application.dto.auth import (
    LoginDto,
    RecoverPasswordByCodeDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateRecoveryCodeDto,
)
from src.application.services.auth_service import AuthService
from src.core.exceptions import UnauthorizedError, ValidationError
from src.core.security import hash_password, hash_session_token, verify_password
from src.domain.entities.account import Account
from src.domain.entities.account_identity import DEFAULT_ACCOUNT_DISPLAY_NAME
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
        self.deleted_account_ids: list = []

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def add(self, entity):  # noqa: ANN001
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items.pop(id, None)
        return True

    async def delete_by_account_id(self, account_id):  # noqa: ANN001
        self.deleted_account_ids.append(account_id)
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
    display_name: str | None,
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
        family_role="member",
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
            email="dad@example.com",
            password="password123",
            remember_me=True,
            invite_token=raw_token,
        )
    )

    assert result.family.id == family.id
    assert result.account.family_role == "member"
    assert result.account.email == "dad@example.com"
    assert result.account.display_name == DEFAULT_ACCOUNT_DISPLAY_NAME
    assert result.account.needs_profile_completion is True
    assert result.account.has_recovery_code is False
    assert result.account.login.startswith("dad-")


@pytest.mark.asyncio
async def test_signup_requires_unique_email() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    await account_repo.add(
        build_account(
            family_id=family.id,
            login="existing-login",
            email="test@example.com",
            display_name="Parent",
            family_role="owner",
        )
    )
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ValidationError, match="Аккаунт с таким email уже существует"):
        await service.signup(RegisterDto(email="test@example.com", password="password123"))


@pytest.mark.asyncio
async def test_signin_uses_email_for_new_flow() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
        email="mama@example.com",
        display_name=None,
        family_role="owner",
    )
    await account_repo.add(account)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.signin(LoginDto(email="mama@example.com", password="password123"))

    assert result.account.id == account.id
    assert result.account.needs_profile_completion is True
    assert result.account.has_recovery_code is False


@pytest.mark.asyncio
async def test_signin_keeps_legacy_login_fallback() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="legacy_login",
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

    result = await service.signin(LoginDto(email="legacy_login", password="password123"))

    assert result.account.id == account.id
    assert result.account.display_name == "Мама Аня"
    assert result.account.needs_profile_completion is False
    assert result.account.has_recovery_code is False


@pytest.mark.asyncio
async def test_update_recovery_code_hashes_value() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
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

    await service.update_recovery_code(
        account.id,
        UpdateRecoveryCodeDto(recovery_code="quiet-river-42"),
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert updated_account.recovery_code_hash is not None
    assert verify_password("quiet-river-42", updated_account.recovery_code_hash)

    signin_result = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    assert signin_result.account.has_recovery_code is True


@pytest.mark.asyncio
async def test_update_recovery_code_normalizes_spaces() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
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

    await service.update_recovery_code(
        account.id,
        UpdateRecoveryCodeDto(recovery_code="  тихая   река   42  "),
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert updated_account.recovery_code_hash is not None
    assert verify_password("тихая река 42", updated_account.recovery_code_hash)


@pytest.mark.asyncio
async def test_update_recovery_code_rejects_second_setup() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    account = await account_repo.add(
        Account(
            **{
                **account.__dict__,
                "recovery_code_hash": hash_password("quiet-river-42"),
            }
        )
    )
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ValidationError, match="Кодовая фраза уже установлена"):
        await service.update_recovery_code(
            account.id,
            UpdateRecoveryCodeDto(recovery_code="новая фраза 42"),
        )


@pytest.mark.asyncio
async def test_reset_password_by_recovery_code_updates_password_and_kills_sessions() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    account = await account_repo.add(
        Account(
            **{
                **account.__dict__,
                "recovery_code_hash": hash_password("quiet-river-42"),
            }
        )
    )
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    await service.reset_password_by_recovery_code(
        RecoverPasswordByCodeDto(
            email="mama@example.com",
            recovery_code="quiet-river-42",
            new_password="new-password-123",
        )
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert verify_password("new-password-123", updated_account.password_hash)
    assert session_repo.deleted_account_ids == [account.id]


@pytest.mark.asyncio
async def test_reset_password_by_recovery_code_normalizes_spaces() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    account = await account_repo.add(
        Account(
            **{
                **account.__dict__,
                "recovery_code_hash": hash_password("тихая река 42"),
            }
        )
    )
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    await service.reset_password_by_recovery_code(
        RecoverPasswordByCodeDto(
            email="mama@example.com",
            recovery_code="  тихая   река  42 ",
            new_password="new-password-123",
        )
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert verify_password("new-password-123", updated_account.password_hash)
    assert session_repo.deleted_account_ids == [account.id]


@pytest.mark.asyncio
async def test_reset_password_by_recovery_code_rejects_invalid_code() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    await account_repo.add(
        Account(
            id=uuid4(),
            login="mama-12345678",
            email="mama@example.com",
            password_hash=hash_password("password123"),
            family_id=family.id,
            display_name="Мама Аня",
            family_role="owner",
            push_before_reminder_minutes=10,
            cabinet_notify_10_days=True,
            cabinet_notify_7_days=True,
            cabinet_notify_3_days=True,
            cabinet_notify_1_day=True,
            created_at=datetime.now(UTC),
            recovery_code_hash=hash_password("quiet-river-42"),
        )
    )
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(UnauthorizedError, match="Не удалось подтвердить код восстановления"):
        await service.reset_password_by_recovery_code(
            RecoverPasswordByCodeDto(
                email="mama@example.com",
                recovery_code="wrong-code",
                new_password="new-password-123",
            )
        )


@pytest.mark.asyncio
async def test_update_profile_ignores_email_payload() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        login="mama-12345678",
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

    dto = UpdateAccountProfileDto()
    result = await service.update_profile(account.id, dto)

    assert result.email == "mama@example.com"
