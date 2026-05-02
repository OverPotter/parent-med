from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from src.application.dto.auth import (
    ChangePasswordDto,
    LoginDto,
    RecoverPasswordByCodeDto,
    RefreshDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateRecoveryCodeDto,
)
from src.application.services.auth_service import AuthService
from src.core.exceptions import ForbiddenError, UnauthorizedError, ValidationError
from src.core.security import (
    decode_access_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from src.domain.entities.account import Account
from src.domain.entities.account_identity import DEFAULT_ACCOUNT_DISPLAY_NAME
from src.domain.entities.family import Family
from src.domain.entities.family_access import FamilyAccessPolicy
from src.domain.entities.family_invite import FamilyInvite


class StubAccountRepository:
    def __init__(self) -> None:
        self.items: dict = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def get_by_email(self, email):  # noqa: ANN001
        return next((item for item in self.items.values() if item.email == email), None)

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
        self.items.pop(id, None)
        return True


class StubSessionRepository:
    def __init__(self) -> None:
        self.items = {}
        self.deleted_account_ids: list = []
        self.deleted_session_ids: list = []
        self.delete_other_calls: list[tuple] = []

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)

    async def add(self, entity):  # noqa: ANN001
        self.items[entity.id] = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.items.pop(id, None)
        self.deleted_session_ids.append(id)
        return True

    async def delete_by_account_id(self, account_id):  # noqa: ANN001
        self.deleted_account_ids.append(account_id)
        return True

    async def delete_other_sessions(self, account_id, keep_session_id):  # noqa: ANN001
        self.delete_other_calls.append((account_id, keep_session_id))
        self.items = {
            key: value
            for key, value in self.items.items()
            if not (value.account_id == account_id and key != keep_session_id)
        }
        return True


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family
        self.items: dict = {family.id: family}
        self.deleted_ids: list = []
        self.added_entities: list[Family] = []

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
        self.deleted_ids.append(id)
        self.items.pop(id, None)
        return True


class StubFamilyInviteRepository:
    def __init__(self, invite: FamilyInvite | None) -> None:
        self.invite = invite
        self.accept_should_succeed = True

    async def get_by_id(self, id):  # noqa: ANN001
        if self.invite and self.invite.id == id:
            return self.invite
        return None

    async def get_by_token_hash(self, token_hash):  # noqa: ANN001
        if self.invite and self.invite.token_hash == token_hash:
            return self.invite
        return None

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        self.invite = entity
        return entity

    async def accept_if_active(self, invite_id, account_id, accepted_at):  # noqa: ANN001
        if not self.invite or self.invite.id != invite_id or not self.accept_should_succeed:
            return False
        if self.invite.accepted_at is not None or self.invite.expires_at <= accepted_at:
            return False
        self.invite = FamilyInvite(
            id=self.invite.id,
            family_id=self.invite.family_id,
            created_by_account_id=self.invite.created_by_account_id,
            token_hash=self.invite.token_hash,
            family_role=self.invite.family_role,
            created_at=self.invite.created_at,
            expires_at=self.invite.expires_at,
            accepted_at=accepted_at,
            accepted_by_account_id=account_id,
        )
        return True


class DuplicateEmailOnAddRepository(StubAccountRepository):
    async def add(self, entity: Account) -> Account:
        raise IntegrityError(
            statement="INSERT INTO accounts ...",
            params={},
            orig=Exception('duplicate key value violates unique constraint "accounts_email_key"'),
        )


def build_account(
    *,
    family_id,
    email: str | None,
    display_name: str | None,
    family_role: str,
) -> Account:  # noqa: ANN001
    return Account(
        id=uuid4(),
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
    assert family_invite_repo.invite is not None
    assert family_invite_repo.invite.accepted_by_account_id == result.account.id


@pytest.mark.asyncio
async def test_signup_with_invite_reopens_link_after_deleted_account() -> None:
    family = Family(id=uuid4(), name="Семья Петровых")
    raw_token = "invite-token"
    deleted_account = build_account(
        family_id=family.id,
        email=None,
        display_name="Deleted user",
        family_role="deleted",
    )
    invite = FamilyInvite(
        id=uuid4(),
        family_id=family.id,
        created_by_account_id=uuid4(),
        token_hash=hash_session_token(raw_token),
        family_role="member",
        created_at=datetime.now(UTC) - timedelta(minutes=5),
        expires_at=datetime.now(UTC) + timedelta(days=1),
        accepted_at=datetime.now(UTC) - timedelta(minutes=1),
        accepted_by_account_id=deleted_account.id,
    )
    account_repo = StubAccountRepository()
    account_repo.items[deleted_account.id] = deleted_account
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
    assert family_invite_repo.invite is not None
    assert family_invite_repo.invite.accepted_by_account_id == result.account.id


@pytest.mark.asyncio
async def test_signup_with_invite_rejects_if_code_was_consumed_concurrently() -> None:
    family = Family(id=uuid4(), name="Семья Петровых")
    raw_token = "invite-token"
    invite = FamilyInvite(
        id=uuid4(),
        family_id=family.id,
        created_by_account_id=uuid4(),
        token_hash=hash_session_token(raw_token),
        family_role="member",
        created_at=datetime.now(UTC) - timedelta(minutes=5),
        expires_at=datetime.now(UTC) + timedelta(hours=3),
        accepted_at=None,
        accepted_by_account_id=None,
    )
    account_repo = StubAccountRepository()
    family_invite_repo = StubFamilyInviteRepository(invite)
    family_invite_repo.accept_should_succeed = False
    family_invite_repo.invite = FamilyInvite(
        id=invite.id,
        family_id=invite.family_id,
        created_by_account_id=invite.created_by_account_id,
        token_hash=invite.token_hash,
        family_role=invite.family_role,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        accepted_at=datetime.now(UTC),
        accepted_by_account_id=uuid4(),
    )
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=family_invite_repo,
    )

    with pytest.raises(ValidationError) as exc_info:
        await service.signup(
            RegisterDto(
                email="dad@example.com",
                password="password123",
                remember_me=True,
                invite_token=raw_token,
            )
        )

    assert exc_info.value.code == "FAMILY_INVITE_ALREADY_USED"


@pytest.mark.asyncio
async def test_leave_family_creates_new_family_for_member() -> None:
    family = Family(id=uuid4(), name="Семья Петровых", owner_account_id=uuid4())
    account_repo = StubAccountRepository()
    member = build_account(
        family_id=family.id,
        email="dad@example.com",
        display_name="Папа",
        family_role="member",
    )
    member.access_policy = FamilyAccessPolicy(
        all_children=False,
        child_ids=[],
        children_access="view",
        cabinet_access="none",
        pillbox_access="view",
        cabinet_push_enabled=False,
    )
    await account_repo.add(member)
    family_repo = StubFamilyRepository(family)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=family_repo,
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.leave_family(member.id)

    assert result.account.family_id != family.id
    assert result.account.family_role == "admin"
    assert result.family.id == result.account.family_id
    assert result.family.owner_account_id == member.id
    updated_member = await account_repo.get_by_id(member.id)
    assert updated_member is not None
    assert updated_member.family_id == result.family.id
    assert updated_member.family_role == "admin"
    assert updated_member.access_policy.all_children is True
    assert updated_member.access_policy.children_access == "edit"
    assert updated_member.access_policy.cabinet_access == "edit"
    assert updated_member.access_policy.pillbox_access == "edit"
    assert updated_member.access_policy.cabinet_push_enabled is True
    assert family_repo.added_entities[-1].owner_account_id == member.id


@pytest.mark.asyncio
async def test_family_owner_cannot_leave_family() -> None:
    owner = build_account(
        family_id=uuid4(),
        email="mom@example.com",
        display_name="Мама",
        family_role="admin",
    )
    family = Family(id=owner.family_id, name="Моя семья", owner_account_id=owner.id)
    account_repo = StubAccountRepository()
    await account_repo.add(owner)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ValidationError) as exc_info:
        await service.leave_family(owner.id)

    assert exc_info.value.code == "FAMILY_OWNER_CANNOT_LEAVE"


@pytest.mark.asyncio
async def test_billing_owner_cannot_leave_family() -> None:
    family_id = uuid4()
    billing_owner = build_account(
        family_id=family_id,
        email="dad@example.com",
        display_name="Папа",
        family_role="admin",
    )
    family = Family(
        id=family_id,
        name="Семья Петровых",
        owner_account_id=uuid4(),
        billing_account_id=billing_owner.id,
        plan_code="plus",
        subscription_status="active",
    )
    account_repo = StubAccountRepository()
    await account_repo.add(billing_owner)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ValidationError) as exc_info:
        await service.leave_family(billing_owner.id)

    assert exc_info.value.code == "BILLING_OWNER_TRANSFER_REQUIRED"


@pytest.mark.asyncio
async def test_signup_creates_family_owner_for_new_family() -> None:
    initial_family = Family(id=uuid4(), name="Моя семья")
    family_repo = StubFamilyRepository(initial_family)
    service = AuthService(
        account_repo=StubAccountRepository(),
        session_repo=StubSessionRepository(),
        family_repo=family_repo,
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    result = await service.signup(RegisterDto(email="mom@example.com", password="password123"))

    assert result.account.family_role == "admin"
    assert result.family.owner_account_id == result.account.id
    assert family_repo.family.owner_account_id == result.account.id
    assert family_repo.added_entities[0].owner_account_id == result.account.id


@pytest.mark.asyncio
async def test_signup_requires_unique_email() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    await account_repo.add(
        build_account(
            family_id=family.id,
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
async def test_signup_maps_duplicate_email_db_race_to_validation_error() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    service = AuthService(
        account_repo=DuplicateEmailOnAddRepository(),
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ValidationError) as exc_info:
        await service.signup(RegisterDto(email="test@example.com", password="password123"))

    assert exc_info.value.code == "ACCOUNT_EMAIL_ALREADY_EXISTS"
    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_signin_uses_email_for_new_flow() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
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
async def test_signin_rejects_legacy_login_identifier() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
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

    with pytest.raises(UnauthorizedError, match="Неверный email или пароль"):
        await service.signin(LoginDto(email="legacy_login", password="password123"))


@pytest.mark.asyncio
async def test_update_recovery_code_hashes_value() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
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
    assert updated_account.session_version == account.session_version + 1
    assert session_repo.deleted_account_ids == [account.id]


@pytest.mark.asyncio
async def test_reset_password_by_recovery_code_normalizes_spaces() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
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
async def test_change_password_updates_hash_and_kills_sessions() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    await service.change_password(
        account.id,
        ChangePasswordDto(current_password="password123", new_password="new-password-123"),
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert verify_password("new-password-123", updated_account.password_hash)
    assert updated_account.session_version == account.session_version + 1
    assert session_repo.deleted_account_ids == [account.id]


@pytest.mark.asyncio
async def test_change_password_keeps_current_session_when_refresh_token_is_provided() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    first = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    second = await service.signin(LoginDto(email="mama@example.com", password="password123"))

    await service.change_password(
        account.id,
        ChangePasswordDto(current_password="password123", new_password="new-password-123"),
        first.refresh_token,
    )

    updated_account = await account_repo.get_by_id(account.id)
    assert updated_account is not None
    assert verify_password("new-password-123", updated_account.password_hash)
    assert session_repo.deleted_account_ids == []
    assert first.refresh_token is not None
    assert second.refresh_token is not None
    assert len(session_repo.delete_other_calls) == 1
    kept_session_id = session_repo.delete_other_calls[0][1]
    assert kept_session_id in session_repo.items
    with pytest.raises(UnauthorizedError):
        await service.refresh(RefreshDto(refresh_token=second.refresh_token))
    refreshed = await service.refresh(RefreshDto(refresh_token=first.refresh_token))
    assert refreshed.refresh_token == first.refresh_token


@pytest.mark.asyncio
async def test_refresh_keeps_existing_refresh_session_valid() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    signed_in = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    refreshed = await service.refresh(RefreshDto(refresh_token=signed_in.refresh_token))

    assert refreshed.refresh_token == signed_in.refresh_token
    assert len(session_repo.items) == 1
    assert session_repo.deleted_session_ids == []


@pytest.mark.asyncio
async def test_logout_deletes_only_current_session() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    first = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    second = await service.signin(LoginDto(email="mama@example.com", password="password123"))

    assert len(session_repo.items) == 2

    await service.logout(account.id, first.refresh_token)

    assert len(session_repo.items) == 1
    assert first.refresh_token is not None
    assert second.refresh_token is not None
    remaining = await service.refresh(RefreshDto(refresh_token=second.refresh_token))
    assert remaining.refresh_token == second.refresh_token


@pytest.mark.asyncio
async def test_update_profile_ignores_email_payload() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
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


@pytest.mark.asyncio
async def test_get_current_account_uses_db_family_and_rejects_stale_session_version() -> None:
    old_family_id = uuid4()
    new_family_id = uuid4()
    family = Family(id=old_family_id, name="Старая семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=old_family_id,
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

    auth = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    access_payload = decode_access_token(auth.access_token)
    assert access_payload["family_id"] == str(old_family_id)

    updated = await account_repo.update(
        Account(**{**account.__dict__, "family_id": new_family_id, "session_version": 2})
    )
    assert updated.family_id == new_family_id

    with pytest.raises(UnauthorizedError) as exc_info:
        await service.get_current_account(auth.access_token)

    assert exc_info.value.code == "INVALID_SESSION_VERSION"


@pytest.mark.asyncio
async def test_refresh_returns_access_token_with_current_session_version_and_family() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    account = build_account(
        family_id=family.id,
        email="mama@example.com",
        display_name="Мама Аня",
        family_role="owner",
    )
    await account_repo.add(account)
    session_repo = StubSessionRepository()
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    signed_in = await service.signin(LoginDto(email="mama@example.com", password="password123"))
    await account_repo.update(
        Account(**{**account.__dict__, "family_id": family.id, "session_version": 3})
    )

    refreshed = await service.refresh(RefreshDto(refresh_token=signed_in.refresh_token))
    payload = decode_access_token(refreshed.access_token)

    assert payload["sv"] == 3
    assert payload["family_id"] == str(family.id)


@pytest.mark.asyncio
async def test_delete_family_requires_owner() -> None:
    family = Family(id=uuid4(), name="Моя семья")
    account_repo = StubAccountRepository()
    owner = build_account(
        family_id=family.id,
        email="owner@example.com",
        display_name="Владелец",
        family_role="owner",
    )
    member = build_account(
        family_id=family.id,
        email="member@example.com",
        display_name="Участник",
        family_role="member",
    )
    family.owner_account_id = owner.id
    await account_repo.add(owner)
    await account_repo.add(member)
    service = AuthService(
        account_repo=account_repo,
        session_repo=StubSessionRepository(),
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    with pytest.raises(ForbiddenError, match="Только владелец семьи может удалить семью"):
        await service.delete_family(member.id)


@pytest.mark.asyncio
async def test_delete_family_soft_deletes_accounts_even_with_active_subscription() -> None:
    family = Family(
        id=uuid4(),
        name="Моя семья",
        plan_code="plus",
        subscription_status="active",
    )
    account_repo = StubAccountRepository()
    session_repo = StubSessionRepository()
    owner = build_account(
        family_id=family.id,
        email="owner@example.com",
        display_name="Владелец",
        family_role="owner",
    )
    member = build_account(
        family_id=family.id,
        email="member@example.com",
        display_name="Участник",
        family_role="member",
    )
    family.owner_account_id = owner.id
    await account_repo.add(owner)
    await account_repo.add(member)
    service = AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=StubFamilyRepository(family),
        family_invite_repo=StubFamilyInviteRepository(None),
    )

    await service.delete_family(owner.id)

    deleted_owner = await account_repo.get_by_id(owner.id)
    deleted_member = await account_repo.get_by_id(member.id)

    assert deleted_owner is not None
    assert deleted_member is not None
    assert deleted_owner.family_role == "deleted"
    assert deleted_member.family_role == "deleted"
    assert deleted_owner.email is None
    assert deleted_member.email is None
    assert session_repo.deleted_account_ids == [owner.id, member.id]
