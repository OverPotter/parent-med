from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from src.application.dto.family_invite import FamilyInviteCreateDto
from src.application.services.family_invite_service import FamilyInviteService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.family import Family
from src.domain.entities.family_access import build_default_family_access_policy
from src.domain.entities.family_invite import FamilyInvite


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if id == self.family.id else None


class StubFamilyInviteRepository:
    def __init__(self) -> None:
        self.items: list[FamilyInvite] = []
        self.deleted_family_calls: list[object] = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def get_by_token_hash(self, token_hash):  # noqa: ANN001
        return next((item for item in self.items if item.token_hash == token_hash), None)

    async def add(self, entity: FamilyInvite) -> FamilyInvite:
        self.items.append(entity)
        return entity

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        self.items = [item for item in self.items if item.id != entity.id]
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True

    async def delete_for_family(self, family_id):  # noqa: ANN001
        self.deleted_family_calls.append(family_id)
        before = len(self.items)
        self.items = [item for item in self.items if item.family_id != family_id]
        return before - len(self.items)

    async def accept_if_active(self, invite_id, account_id, accepted_at):  # noqa: ANN001
        for index, item in enumerate(self.items):
            if item.id != invite_id or item.accepted_at is not None or item.expires_at <= accepted_at:
                continue
            self.items[index] = FamilyInvite(
                id=item.id,
                family_id=item.family_id,
                created_by_account_id=item.created_by_account_id,
                token_hash=item.token_hash,
                family_role=item.family_role,
                created_at=item.created_at,
                expires_at=item.expires_at,
                accepted_at=accepted_at,
                accepted_by_account_id=account_id,
            )
            return True
        return False


class StubAccountRepository:
    def __init__(self) -> None:
        self.items: dict[object, Account] = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)


@pytest.mark.asyncio
async def test_create_and_preview_family_invite() -> None:
    started_at = datetime.now(UTC)
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    repo = StubFamilyInviteRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=repo,
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    preview = await service.get_preview(created.token)

    assert created.family_name == "Семья Петровых"
    assert created.family_role == "member"
    assert preview.family_name == "Семья Петровых"
    assert preview.family_role == "member"
    assert repo.deleted_family_calls == [family.id]
    ttl_seconds = (created.expires_at - started_at).total_seconds()
    assert ttl_seconds == pytest.approx(timedelta(hours=3).total_seconds(), abs=5)


@pytest.mark.asyncio
async def test_create_family_invite_generates_fresh_token_each_time() -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    repo = StubFamilyInviteRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=repo,
    )

    first = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    second = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )

    assert first.token != second.token
    assert len(repo.items) == 1


@pytest.mark.asyncio
async def test_create_family_invite_uses_short_human_readable_token_locally(monkeypatch) -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    repo = StubFamilyInviteRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=repo,
    )

    from src.application.services import family_invite_service as family_invite_service_module

    monkeypatch.setattr(
        type(family_invite_service_module.settings),
        "is_local_environment",
        property(lambda self: True),
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )

    assert len(created.token) == FamilyInviteService.DEV_INVITE_TOKEN_LENGTH
    assert created.token.isalnum()
    assert created.token.upper() == created.token
    assert not (set(created.token) & {"0", "O", "1", "I"})


@pytest.mark.asyncio
async def test_create_invite_rotates_previous_family_codes() -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    repo = StubFamilyInviteRepository()
    now = datetime.now(UTC)
    repo.items = [
        FamilyInvite(
            id=uuid4(),
            family_id=family.id,
            created_by_account_id=owner_id,
            token_hash="old-expired",
            family_role="member",
            created_at=now - timedelta(hours=4),
            expires_at=now - timedelta(minutes=1),
            accepted_at=None,
            accepted_by_account_id=None,
        ),
        FamilyInvite(
            id=uuid4(),
            family_id=family.id,
            created_by_account_id=owner_id,
            token_hash="old-used",
            family_role="member",
            created_at=now - timedelta(hours=1),
            expires_at=now + timedelta(hours=2),
            accepted_at=now - timedelta(minutes=10),
            accepted_by_account_id=uuid4(),
        ),
        FamilyInvite(
            id=uuid4(),
            family_id=family.id,
            created_by_account_id=owner_id,
            token_hash="old-active",
            family_role="member",
            created_at=now - timedelta(minutes=10),
            expires_at=now + timedelta(hours=2),
            accepted_at=None,
            accepted_by_account_id=None,
        ),
    ]
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=repo,
    )

    await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )

    assert len(repo.items) == 1
    assert repo.items[0].token_hash not in {"old-expired", "old-used", "old-active"}


async def test_preview_reopens_invite_when_accepted_account_was_deleted() -> None:
    owner_id = uuid4()
    accepted_account_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    invite_repo = StubFamilyInviteRepository()
    account_repo = StubAccountRepository()
    account_repo.items[accepted_account_id] = Account(
        id=accepted_account_id,
        email=None,
        password_hash="deleted",
        family_id=family.id,
        display_name="Deleted user",
        family_role="deleted",
        push_before_reminder_minutes=10,
        cabinet_notify_10_days=True,
        cabinet_notify_7_days=True,
        cabinet_notify_3_days=True,
        cabinet_notify_1_day=True,
        created_at=datetime.now(UTC),
        recovery_code_hash=None,
        children_push_enabled=True,
        pillbox_push_enabled=True,
        pillbox_push_before_reminder_minutes=10,
        relationship_label=None,
        phone=None,
        preferred_language="ru",
        access_policy=build_default_family_access_policy(),
    )
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=account_repo,
        invite_repo=invite_repo,
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    invite = invite_repo.items[0]
    invite.accepted_at = invite.created_at
    invite.accepted_by_account_id = accepted_account_id

    preview = await service.get_preview(created.token)

    assert preview.family_id == family.id
    assert invite_repo.items[0].accepted_at is None
    assert invite_repo.items[0].accepted_by_account_id is None


@pytest.mark.asyncio
async def test_create_invite_requires_owner_role() -> None:
    owner_id = uuid4()
    family = Family(id=uuid4(), name="Семья Петровых", owner_account_id=owner_id)
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=StubFamilyInviteRepository(),
    )

    with pytest.raises(ForbiddenError, match="Только владелец семьи может приглашать"):
        await service.create_for_account(
            family_id=family.id,
            current_account_id=uuid4(),
            dto=FamilyInviteCreateDto(family_role="member"),
        )


@pytest.mark.asyncio
async def test_create_invite_requires_plus_plan() -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="free",
        subscription_status="inactive",
    )
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=StubFamilyInviteRepository(),
    )

    with pytest.raises(ValidationError, match="только в Plus"):
        await service.create_for_account(
            family_id=family.id,
            current_account_id=owner_id,
            dto=FamilyInviteCreateDto(family_role="member"),
        )
