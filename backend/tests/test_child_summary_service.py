from datetime import UTC, date, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.application.services.child_summary_service import ChildSummaryService
from src.domain.entities.child import Child
from src.domain.entities.family import Family


class StubChildRepository:
    def __init__(self, children: list[Child]) -> None:
        self.children = children

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [child for child in self.children if child.family_id == family_id]


class StubFamilyRepository:
    def __init__(self, family: Family | None) -> None:
        self.family = family

    async def get_by_id(self, family_id):  # noqa: ANN001
        if self.family and self.family.id == family_id:
            return self.family
        return None


class StubSessionRepository:
    def __init__(self, by_child_id: dict) -> None:  # noqa: ANN001
        self.by_child_id = by_child_id

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        return self.by_child_id.get(child_id)


class StubLatestRepository:
    def __init__(self, by_child_id: dict) -> None:  # noqa: ANN001
        self.by_child_id = by_child_id

    async def get_latest_by_child_id(self, child_id):  # noqa: ANN001
        return self.by_child_id.get(child_id)


def make_account(*, family_id, child_ids=None) -> AuthenticatedAccount:  # noqa: ANN001
    return AuthenticatedAccount(
        id=uuid4(),
        email="parent@example.com",
        family_id=family_id,
        display_name="Parent",
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(
            all_children=child_ids is None,
            child_ids=child_ids or [],
            children_access="edit",
            cabinet_access="edit",
            pillbox_access="edit",
        ),
    )


def make_service(
    *,
    children: list[Child],
    family: Family | None,
    active_sleep_by_child_id: dict | None = None,  # noqa: ANN401
    active_feeding_by_child_id: dict | None = None,  # noqa: ANN401
    latest_weight_by_child_id: dict | None = None,  # noqa: ANN401
    latest_height_by_child_id: dict | None = None,  # noqa: ANN401
) -> ChildSummaryService:
    return ChildSummaryService(
        child_repo=StubChildRepository(children),
        family_repo=StubFamilyRepository(family),
        sleep_repo=StubSessionRepository(active_sleep_by_child_id or {}),
        feeding_repo=StubSessionRepository(active_feeding_by_child_id or {}),
        weight_repo=StubLatestRepository(latest_weight_by_child_id or {}),
        height_repo=StubLatestRepository(latest_height_by_child_id or {}),
    )


@pytest.mark.asyncio
async def test_list_for_family_for_account_builds_child_summary() -> None:
    family = Family(id=uuid4(), name="Family")
    child = Child(
        id=uuid4(),
        family_id=family.id,
        name="Mila",
        birth_date=date(2024, 5, 1),
        baby_mode_enabled=True,
        allergies="Peanut",
        notes="Sleeps lightly",
        avatar_key="girl_headband",
        gender="girl",
    )
    started_at = datetime(2026, 5, 10, 8, 30, tzinfo=UTC)
    service = make_service(
        children=[child],
        family=family,
        active_sleep_by_child_id={
            child.id: SimpleNamespace(id=uuid4(), started_at=started_at),
        },
        active_feeding_by_child_id={
            child.id: SimpleNamespace(
                id=uuid4(),
                started_at=None,
                recorded_at=started_at,
            ),
        },
        latest_weight_by_child_id={
            child.id: SimpleNamespace(value_kg=11.2),
        },
        latest_height_by_child_id={
            child.id: SimpleNamespace(value_cm=84.0),
        },
    )

    result = await service.list_for_family_for_account(
        family.id,
        make_account(family_id=family.id),
    )

    assert len(result) == 1
    summary = result[0]
    assert summary.id == child.id
    assert summary.name == "Mila"
    assert summary.baby_mode_enabled is True
    assert summary.avatar_key == "girl_headband"
    assert summary.gender == "girl"
    assert summary.allergies == "Peanut"
    assert summary.notes == "Sleeps lightly"
    assert summary.latest_weight_kg == 11.2
    assert summary.latest_height_cm == 84.0
    assert summary.active_sleep_session is not None
    assert summary.active_sleep_session.started_at == started_at
    assert summary.active_feeding_record is not None
    assert summary.active_feeding_record.started_at == started_at


@pytest.mark.asyncio
async def test_list_for_family_for_account_filters_children_by_access_scope() -> None:
    family = Family(id=uuid4(), name="Family")
    visible_child = Child(
        id=uuid4(),
        family_id=family.id,
        name="Mila",
        birth_date=None,
    )
    hidden_child = Child(
        id=uuid4(),
        family_id=family.id,
        name="Leo",
        birth_date=None,
    )
    service = make_service(
        children=[visible_child, hidden_child],
        family=family,
    )

    result = await service.list_for_family_for_account(
        family.id,
        make_account(family_id=family.id, child_ids=[visible_child.id]),
    )

    assert [item.id for item in result] == [visible_child.id]
