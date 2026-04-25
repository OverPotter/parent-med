from datetime import date
from uuid import uuid4

import pytest

from src.application.dto.child import ChildCreateDto
from src.application.services.child_service import ChildService
from src.core.exceptions import ValidationError
from src.domain.entities.child import Child
from src.domain.entities.family import Family


class StubChildRepository:
    def __init__(self, children: list[Child] | None = None) -> None:
        self.created: Child | None = None
        self.children = children or []

    async def get_by_id(self, id):  # noqa: ANN001
        return None

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [child for child in self.children if child.family_id == family_id]

    async def add(self, entity: Child) -> Child:
        self.created = entity
        self.children.append(entity)
        return entity

    async def update(self, entity: Child) -> Child:
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubFamilyRepository:
    def __init__(self, family: Family | None = None) -> None:
        self.family = family or Family(id=uuid4(), name="Family")

    async def get_by_id(self, id):  # noqa: ANN001
        return self.family if self.family.id == id else None


def make_service(
    *,
    children: list[Child] | None = None,
    family: Family | None = None,
) -> ChildService:
    return ChildService(
        child_repo=StubChildRepository(children),
        family_repo=StubFamilyRepository(family),
    )


def test_format_age_label_for_toddler() -> None:
    service = make_service()

    assert service._format_age_label(date(2023, 1, 10), today=date(2026, 3, 18)) == "3 года 2 мес."


def test_format_age_label_for_infant() -> None:
    service = make_service()

    assert service._format_age_label(date(2025, 12, 18), today=date(2026, 3, 18)) == "3 мес."


@pytest.mark.asyncio
async def test_create_rejects_future_birth_date() -> None:
    family = Family(id=uuid4(), name="Family")
    service = make_service(family=family)

    with pytest.raises(ValidationError, match="Дата рождения не может быть в будущем"):
        await service.create(
            ChildCreateDto(
                family_id=family.id,
                name="Миша",
                birth_date=date(2099, 1, 1),
            )
        )


@pytest.mark.asyncio
async def test_create_keeps_profile_fields() -> None:
    family = Family(id=uuid4(), name="Family")
    repo = StubChildRepository()
    service = ChildService(
        child_repo=repo,
        family_repo=StubFamilyRepository(family),
    )

    result = await service.create(
        ChildCreateDto(
            family_id=family.id,
            name="Миша",
            institution_name="Детский сад №7",
            institution_phone="+375291112233",
            doctor_name="Иванова",
            doctor_phone="+375291234567",
            allergies="Пенициллин",
            notes="Забирать до 18:00",
        )
    )

    assert repo.created is not None
    assert repo.created.institution_name == "Детский сад №7"
    assert repo.created.doctor_phone == "+375291234567"
    assert result.allergies == "Пенициллин"


@pytest.mark.asyncio
async def test_create_rejects_second_child_for_free_plan() -> None:
    family = Family(id=uuid4(), name="Family", plan_code="free", subscription_status="inactive")
    existing_child = Child(id=uuid4(), family_id=family.id, name="Миша", birth_date=None)
    service = make_service(children=[existing_child], family=family)

    with pytest.raises(ValidationError, match="один ребёнок"):
        await service.create(
            ChildCreateDto(
                family_id=family.id,
                name="Маша",
                birth_date=None,
            )
        )
