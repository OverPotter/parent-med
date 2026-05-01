from datetime import UTC, datetime
from uuid import uuid4

import pytest

from src.application.dto.family_invite import FamilyInviteCreateDto
from src.application.services.family_invite_service import FamilyInviteService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.account import Account
from src.domain.entities.family_access import build_default_family_access_policy
from src.domain.entities.family import Family
from src.domain.entities.family_invite import FamilyInvite
from src.domain.entities.family_invite_handoff import FamilyInviteHandoff


class StubFamilyRepository:
    def __init__(self, family: Family) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if id == self.family.id else None


class StubFamilyInviteRepository:
    def __init__(self) -> None:
        self.items: list[FamilyInvite] = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def get_by_token_hash(self, token_hash):  # noqa: ANN001
        return next((item for item in self.items if item.token_hash == token_hash), None)

    async def get_latest_active(self) -> FamilyInvite | None:
        if not self.items:
            return None
        active = [item for item in self.items if item.accepted_at is None]
        return sorted(active, key=lambda item: item.created_at, reverse=True)[0] if active else None

    async def add(self, entity: FamilyInvite) -> FamilyInvite:
        self.items.append(entity)
        return entity

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        self.items = [item for item in self.items if item.id != entity.id]
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubFamilyInviteHandoffRepository:
    def __init__(self) -> None:
        self.items: list[FamilyInviteHandoff] = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def get_by_handoff_token_hash(self, handoff_token_hash):  # noqa: ANN001
        return next((item for item in self.items if item.handoff_token_hash == handoff_token_hash), None)

    async def add(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        self.items.append(entity)
        return entity

    async def update(self, entity: FamilyInviteHandoff) -> FamilyInviteHandoff:
        self.items = [item for item in self.items if item.id != entity.id]
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubAccountRepository:
    def __init__(self) -> None:
        self.items: dict[object, Account] = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.items.get(id)


@pytest.mark.asyncio
async def test_create_and_preview_family_invite() -> None:
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
        handoff_repo=StubFamilyInviteHandoffRepository(),
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
        handoff_repo=StubFamilyInviteHandoffRepository(),
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
    assert first.invite_path != second.invite_path
    assert len(repo.items) == 2


@pytest.mark.asyncio
async def test_create_and_resolve_family_invite_handoff() -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    invite_repo = StubFamilyInviteRepository()
    handoff_repo = StubFamilyInviteHandoffRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=invite_repo,
        handoff_repo=handoff_repo,
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    handoff = await service.create_handoff(created.token)
    resolved = await service.resolve_handoff(handoff.handoff_id)

    assert handoff.handoff_path.startswith("/join-family-handoff?hid=")
    assert resolved.family_id == family.id
    assert len(handoff_repo.items) == 1
    assert handoff_repo.items[0].invite_id == invite_repo.items[0].id
    assert handoff_repo.items[0].consumed_at is None


@pytest.mark.asyncio
async def test_family_invite_handoff_is_single_use() -> None:
    owner_id = uuid4()
    family = Family(
        id=uuid4(),
        name="Семья Петровых",
        owner_account_id=owner_id,
        plan_code="plus",
        subscription_status="active",
    )
    invite_repo = StubFamilyInviteRepository()
    handoff_repo = StubFamilyInviteHandoffRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        account_repo=StubAccountRepository(),
        invite_repo=invite_repo,
        handoff_repo=handoff_repo,
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=owner_id,
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    handoff = await service.create_handoff(created.token)
    handoff_repo.items[0].consumed_at = datetime.now(UTC)

    with pytest.raises(ValidationError, match="handoff already used"):
        await service.resolve_handoff(handoff.handoff_id)


@pytest.mark.asyncio
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
        handoff_repo=StubFamilyInviteHandoffRepository(),
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
        handoff_repo=StubFamilyInviteHandoffRepository(),
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
        handoff_repo=StubFamilyInviteHandoffRepository(),
    )

    with pytest.raises(ValidationError, match="только в Plus"):
        await service.create_for_account(
            family_id=family.id,
            current_account_id=owner_id,
            dto=FamilyInviteCreateDto(family_role="member"),
        )
