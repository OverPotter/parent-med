from uuid import uuid4

import pytest

from src.application.services.child_plan_access import (
    ensure_active_illness_continuation_allowed,
    ensure_child_plan_mutation_allowed,
)
from src.core.exceptions import ForbiddenError
from src.domain.entities.family import Family


class StubFamilyRepository:
    def __init__(self, family: Family | None) -> None:
        self.family = family

    async def get_by_id(self, id):  # noqa: ANN001
        if self.family is None:
            return None
        return self.family if self.family.id == id else None


@pytest.mark.asyncio
async def test_non_primary_child_mutation_is_blocked_in_free() -> None:
    family = Family(
        id=uuid4(),
        name="Family",
        free_primary_child_id=uuid4(),
        plan_code="free",
        subscription_status="inactive",
    )
    child_id = uuid4()

    with pytest.raises(ForbiddenError, match="Во Free для этого ребёнка"):
        await ensure_child_plan_mutation_allowed(
            StubFamilyRepository(family),
            family.id,
            child_id,
        )


@pytest.mark.asyncio
async def test_active_illness_continuation_is_allowed_for_non_primary_child_in_free() -> None:
    family = Family(
        id=uuid4(),
        name="Family",
        free_primary_child_id=uuid4(),
        plan_code="free",
        subscription_status="inactive",
    )
    child_id = uuid4()

    await ensure_active_illness_continuation_allowed(
        StubFamilyRepository(family),
        family.id,
        child_id,
        episode_is_active=True,
    )


@pytest.mark.asyncio
async def test_closed_illness_mutation_is_blocked_for_non_primary_child_in_free() -> None:
    family = Family(
        id=uuid4(),
        name="Family",
        free_primary_child_id=uuid4(),
        plan_code="free",
        subscription_status="inactive",
    )
    child_id = uuid4()

    with pytest.raises(ForbiddenError, match="можно завершить только уже начатое наблюдение"):
        await ensure_active_illness_continuation_allowed(
            StubFamilyRepository(family),
            family.id,
            child_id,
            episode_is_active=False,
        )
