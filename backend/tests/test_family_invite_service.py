from uuid import uuid4

import pytest

from src.application.dto.family_invite import FamilyInviteCreateDto
from src.application.services.family_invite_service import FamilyInviteService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.family import Family
from src.domain.entities.family_invite import FamilyInvite


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

    async def add(self, entity: FamilyInvite) -> FamilyInvite:
        self.items.append(entity)
        return entity

    async def update(self, entity: FamilyInvite) -> FamilyInvite:
        self.items = [item for item in self.items if item.id != entity.id]
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


@pytest.mark.asyncio
async def test_create_and_preview_family_invite() -> None:
    family = Family(id=uuid4(), name="Семья Петровых", plan_code="plus", subscription_status="active")
    repo = StubFamilyInviteRepository()
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        invite_repo=repo,
    )

    created = await service.create_for_account(
        family_id=family.id,
        current_account_id=uuid4(),
        current_family_role="owner",
        dto=FamilyInviteCreateDto(family_role="member"),
    )
    preview = await service.get_preview(created.token)

    assert created.family_name == "Семья Петровых"
    assert created.family_role == "member"
    assert preview.family_name == "Семья Петровых"
    assert preview.family_role == "member"


@pytest.mark.asyncio
async def test_create_invite_requires_owner_role() -> None:
    family = Family(id=uuid4(), name="Семья Петровых")
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        invite_repo=StubFamilyInviteRepository(),
    )

    with pytest.raises(ForbiddenError, match="Только администратор семьи может приглашать"):
        await service.create_for_account(
            family_id=family.id,
            current_account_id=uuid4(),
            current_family_role="adult",
            dto=FamilyInviteCreateDto(family_role="member"),
        )


@pytest.mark.asyncio
async def test_create_invite_requires_plus_plan() -> None:
    family = Family(id=uuid4(), name="Семья Петровых", plan_code="free", subscription_status="inactive")
    service = FamilyInviteService(
        family_repo=StubFamilyRepository(family),
        invite_repo=StubFamilyInviteRepository(),
    )

    with pytest.raises(ValidationError, match="только в Plus"):
        await service.create_for_account(
            family_id=family.id,
            current_account_id=uuid4(),
            current_family_role="owner",
            dto=FamilyInviteCreateDto(family_role="member"),
        )
