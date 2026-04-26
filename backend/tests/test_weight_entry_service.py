from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.weight_entry import WeightEntryCreateDto
from src.application.services.weight_entry_service import WeightEntryService
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.entities.child import Child
from src.domain.entities.family import Family
from src.domain.entities.weight_entry import WeightEntry


class StubWeightEntryRepository:
    def __init__(self, entity: WeightEntry | None) -> None:
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
async def test_get_latest_requires_existing_child() -> None:
    service = WeightEntryService(
        weight_repo=StubWeightEntryRepository(None),
        child_repo=StubChildRepository(None),
    )

    with pytest.raises(NotFoundError, match="Ребёнок не найден"):
        await service.get_latest_for_child(uuid4(), uuid4())


@pytest.mark.asyncio
async def test_get_by_id_rejects_foreign_family() -> None:
    child = Child(id=uuid4(), family_id=uuid4(), name="Маша", birth_date=date(2021, 1, 1))
    entry = WeightEntry(
        id=uuid4(),
        child_id=child.id,
        value_kg=12.4,
        measured_at=datetime(2026, 3, 18, 9, 0, tzinfo=UTC),
    )
    service = WeightEntryService(
        weight_repo=StubWeightEntryRepository(entry),
        child_repo=StubChildRepository(child),
    )

    with pytest.raises(ForbiddenError, match="Нет доступа к ребёнку из другой семьи"):
        await service.get_by_id(entry.id, uuid4())


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
    service = WeightEntryService(
        weight_repo=StubWeightEntryRepository(None),
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await service.create(
            WeightEntryCreateDto(
                child_id=child.id,
                value_kg=13.2,
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
    entry = WeightEntry(
        id=uuid4(),
        child_id=child.id,
        value_kg=12.4,
        measured_at=datetime(2026, 3, 18, 9, 0, tzinfo=UTC),
    )
    service = WeightEntryService(
        weight_repo=StubWeightEntryRepository(entry),
        child_repo=StubChildRepository(child),
        family_repo=StubFamilyRepository(family),
    )

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await service.delete(entry.id, family_id)
