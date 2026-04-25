from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.administration_event import AdministrationEventCreateDto
from src.application.services.administration_service import AdministrationService
from src.domain.entities.child import Child
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.illness_episode import IllnessEpisode


class StubAdministrationRepository:
    def __init__(self) -> None:
        self.items = []

    async def get_by_id(self, id):  # noqa: ANN001
        return next((item for item in self.items if item.id == id), None)

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return [item for item in self.items if item.episode_id == episode_id]

    async def add(self, entity):  # noqa: ANN001
        self.items.append(entity)
        return entity

    async def delete(self, id):  # noqa: ANN001
        return True


class StubHouseholdRepository:
    def __init__(self, household: HouseholdMedicine) -> None:
        self.household = household

    async def get_by_id(self, id):  # noqa: ANN001
        return self.household if id == self.household.id else None


class StubEpisodeRepository:
    def __init__(self, episode: IllnessEpisode) -> None:
        self.episode = episode

    async def get_by_id(self, id):  # noqa: ANN001
        return self.episode if id == self.episode.id else None


class StubChildRepository:
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if id == self.child.id else None


@pytest.mark.asyncio
async def test_create_administration_event_stores_actor_snapshot() -> None:
    child = Child(
        id=uuid4(),
        family_id=uuid4(),
        name="Маша",
        birth_date=date(2021, 5, 1),
    )
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child.id,
        started_at=date(2026, 3, 20),
        title="ОРВИ",
        status="active",
        medication_mode="manual",
        note=None,
        closed_at=None,
        deleted_at=None,
    )
    household = HouseholdMedicine(
        id=uuid4(),
        family_id=child.family_id,
        medicine_name="Нурофен",
        medicine_form="syrup",
        medicine_category=None,
        medicine_concentration="100 mg/5 ml",
        medicine_description=None,
        medicine_dosage=None,
        pediatric_dose_mg_per_kg_min=None,
        pediatric_dose_mg_per_kg_max=None,
        pediatric_dose_note=None,
        expiry_date=date(2026, 10, 1),
        opened_at=datetime(2026, 3, 1, 10, 0, tzinfo=UTC),
        opened_shelf_days=180,
        comment=None,
    )
    service = AdministrationService(
        administration_repo=StubAdministrationRepository(),
        household_repo=StubHouseholdRepository(household),
        episode_repo=StubEpisodeRepository(episode),
        child_repo=StubChildRepository(child),
    )

    result = await service.create(
        AdministrationEventCreateDto(
            episode_id=episode.id,
            household_medicine_id=household.id,
            amount="5 мл",
        ),
        child.family_id,
        uuid4(),
        "Мама",
    )

    assert result.administered_by_name_snapshot == "Мама"
    assert result.administered_by_account_id is not None
