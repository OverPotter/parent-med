from datetime import date
from uuid import uuid4

import pytest

from src.application.dto.child import ChildCreateDto
from src.application.services.child_service import ChildService
from src.core.exceptions import ValidationError
from src.domain.entities.child import Child


class StubChildRepository:
    def __init__(self) -> None:
        self.created: Child | None = None

    async def get_by_id(self, id):  # noqa: ANN001
        return None

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return []

    async def add(self, entity: Child) -> Child:
        self.created = entity
        return entity

    async def update(self, entity: Child) -> Child:
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubFamilyRepository:
    async def get_by_id(self, id):  # noqa: ANN001
        return object()


def make_service() -> ChildService:
    return ChildService(
        child_repo=StubChildRepository(),
        family_repo=StubFamilyRepository(),
    )


def test_format_age_label_for_toddler() -> None:
    service = make_service()

    assert service._format_age_label(date(2023, 1, 10), today=date(2026, 3, 18)) == "3 года 2 мес."


def test_format_age_label_for_infant() -> None:
    service = make_service()

    assert service._format_age_label(date(2025, 12, 18), today=date(2026, 3, 18)) == "3 мес."


@pytest.mark.asyncio
async def test_create_rejects_future_birth_date() -> None:
    service = make_service()

    with pytest.raises(ValidationError, match="Дата рождения не может быть в будущем"):
        await service.create(
            ChildCreateDto(
                family_id=uuid4(),
                name="Миша",
                birth_date=date(2099, 1, 1),
            )
        )
