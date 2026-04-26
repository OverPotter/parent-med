from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.height_entry import HeightEntryCreateDto
from src.application.services.height_entry_service import HeightEntryService
from src.core.exceptions import ForbiddenError
from src.domain.entities.child import Child
from src.domain.entities.family import Family
from src.domain.entities.height_entry import HeightEntry


class StubHeightEntryRepository:
    def __init__(self, entity: HeightEntry | None) -> None:
        self.entity = entity

    async def get_by_id(self, id):  # noqa: ANN001
        return self.entity if self.entity and id == self.entity.id else None

    async def get_latest_by_child_id(self, child_id):  # noqa: ANN001
        if self.entity and self.entity.child_id == child_id:
            return self.entity
        return None

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        if self.entity and self.entity.child_id == child_id:
            return [self.entity]
        return []

    async def add(self, entity):  # noqa: ANN001
        self.entity = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubChildRepository:
    def __init__(self, child: Child | None) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if self.child and self.child.id == id else None


class StubFamilyRepository:
    def __init__(self, family: Family | None) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        if self.family is None:
            return None
        return self.family if self.family.id == id else None


@pytest.mark.asyncio
async def test_create_is_blocked_for_non_primary_child_in_free_family() -> None:
    family_id = uuid4()
    primary_child_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Маша", birth_date=date(2021, 1, 1))
    family = Family(
        id=family_id,
        name="Family",
        free_primary_child_id=primary_child_id,
        plan_code="free",
        subscription_status="inactive",
    )
    service = HeightEntryService(
        height_repo=StubHeightEntryRepository(None),
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await service.create(
            HeightEntryCreateDto(
                child_id=child.id,
                value_cm=91.5,
                measured_at=datetime(2026, 4, 25, 12, 0, tzinfo=UTC),
            ),
            family_id,
        )


@pytest.mark.asyncio
async def test_delete_is_blocked_for_non_primary_child_in_free_family() -> None:
    family_id = uuid4()
    primary_child_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="Маша", birth_date=date(2021, 1, 1))
    family = Family(
        id=family_id,
        name="Family",
        free_primary_child_id=primary_child_id,
        plan_code="free",
        subscription_status="inactive",
    )
    entry = HeightEntry(
        id=uuid4(),
        child_id=child.id,
        value_cm=90.1,
        measured_at=datetime(2026, 3, 18, 9, 0, tzinfo=UTC),
    )
    service = HeightEntryService(
        height_repo=StubHeightEntryRepository(entry),
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await service.delete(entry.id, family_id)
