from datetime import UTC, date, datetime
from uuid import uuid4

import pytest

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.episode_medication_plan import (
    EpisodeMedicationPlanCreateDto,
    EpisodeMedicationPlanUpdateDto,
)
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.application.services.episode_medication_plan_service import EpisodeMedicationPlanService
from src.domain.entities.child import Child
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.illness_episode import IllnessEpisode


class StubEpisodeMedicationPlanRepository:
    def __init__(self) -> None:
        self.entities: dict = {}

    async def get_by_id(self, id):  # noqa: ANN001
        return self.entities.get(id)

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return [entity for entity in self.entities.values() if entity.episode_id == episode_id]

    async def get_by_episode_and_medicine(self, episode_id, household_medicine_id):  # noqa: ANN001
        for entity in self.entities.values():
            if (
                entity.episode_id == episode_id
                and entity.household_medicine_id == household_medicine_id
            ):
                return entity
        return None

    async def add(self, entity):  # noqa: ANN001
        self.entities[entity.id] = entity
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.entities[entity.id] = entity
        return entity


class StubIllnessEpisodeRepository:
    def __init__(self, episode: IllnessEpisode) -> None:
        self.episode = episode

    async def get_by_id(self, id):  # noqa: ANN001
        return self.episode if id == self.episode.id else None


class StubHouseholdMedicineRepository:
    def __init__(self, medicine: HouseholdMedicine) -> None:
        self.medicine = medicine

    async def get_by_id(self, id):  # noqa: ANN001
        return self.medicine if id == self.medicine.id else None


class StubChildRepository:
    def __init__(self, child: Child) -> None:
        self.child = child

    async def get_by_id(self, id):  # noqa: ANN001
        return self.child if id == self.child.id else None


class StubAccountRepository:
    def __init__(self, account_id) -> None:  # noqa: ANN001
        self.account_id = account_id

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [
            type(
                "Member",
                (),
                {
                    "id": self.account_id,
                    "access_policy": FamilyAccessPolicyDto(
                        all_children=True,
                        children_access="edit",
                    ),
                },
            )()
        ]


def build_account(family_id, child_id) -> AuthenticatedAccount:  # noqa: ANN001
    return AuthenticatedAccount(
        id=uuid4(),
        login="parent",
        email="parent@example.com",
        family_id=family_id,
        display_name="Parent",
        family_role="owner",
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_id],
            children_access="edit",
        ),
    )


def build_service() -> tuple[
    EpisodeMedicationPlanService,
    StubEpisodeMedicationPlanRepository,
    HouseholdMedicine,
    AuthenticatedAccount,
    IllnessEpisode,
]:
    family_id = uuid4()
    child_id = uuid4()
    episode = IllnessEpisode(
        id=uuid4(),
        child_id=child_id,
        started_at=date.today(),
        title="ОРВИ",
        status="active",
        medication_mode="guided",
        note=None,
        member_account_ids=[],
        closed_at=None,
        deleted_at=None,
    )
    child = Child(id=child_id, family_id=family_id, name="Kid", birth_date=None)
    medicine = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
        medicine_name="Ибупрофен детский",
        medicine_form="суспензия",
        medicine_category=None,
        medicine_concentration="100 мг / 5 мл",
        medicine_description=None,
        medicine_dosage="10 мг/кг",
        pediatric_dose_mg_per_kg_min=10.0,
        pediatric_dose_mg_per_kg_max=10.0,
        pediatric_dose_note="Типичный ориентир",
        expiry_date=date(2027, 1, 1),
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    account = build_account(family_id, child_id)
    repo = StubEpisodeMedicationPlanRepository()
    service = EpisodeMedicationPlanService(
        plan_repo=repo,
        episode_repo=StubIllnessEpisodeRepository(episode),
        household_repo=StubHouseholdMedicineRepository(medicine),
        child_repo=StubChildRepository(child),
        account_repo=StubAccountRepository(account.id),
    )
    return service, repo, medicine, account, episode


@pytest.mark.asyncio
async def test_create_persists_calculation_fields_without_replacing_final_dose() -> None:
    service, _, medicine, account, episode = build_service()

    result = await service.create(
        EpisodeMedicationPlanCreateDto(
            episode_id=episode.id,
            household_medicine_id=medicine.id,
            custom_medicine_name=None,
            dose_amount="9 мл",
            min_interval_minutes=360,
            max_doses_per_day=4,
            weight_kg=18.4,
            dose_mg_per_kg=10.0,
            calculated_dose_mg=184.0,
            calculated_dose_value=9.2,
            calculated_dose_unit="ml",
            dose_calc_mode="mg_ml",
            dose_calc_warning="Проверьте дозу по упаковке.",
            manual_dose_override=True,
            notes=None,
            member_account_ids=[],
        ),
        account,
    )

    assert result.dose_amount == "9 мл"
    assert result.calculated_dose_mg == 184.0
    assert result.calculated_dose_value == 9.2
    assert result.calculated_dose_unit == "ml"
    assert result.dose_calc_mode == "mg_ml"
    assert result.dose_calc_warning == "Проверьте дозу по упаковке."
    assert result.manual_dose_override is True


@pytest.mark.asyncio
async def test_update_allows_clearing_calculation_warning_and_override() -> None:
    service, repo, medicine, account, episode = build_service()
    created = EpisodeMedicationPlan(
        id=uuid4(),
        episode_id=episode.id,
        household_medicine_id=medicine.id,
        custom_medicine_name=None,
        dose_amount="9 мл",
        min_interval_minutes=360,
        max_doses_per_day=4,
        weight_kg=18.4,
        dose_mg_per_kg=10.0,
        calculated_dose_mg=184.0,
        calculated_dose_value=9.2,
        calculated_dose_unit="ml",
        dose_calc_mode="mg_ml",
        dose_calc_warning="Проверьте дозу.",
        manual_dose_override=True,
        notes=None,
        member_account_ids=[],
        reminders_enabled=True,
        reminder_before_minutes=10,
        notify_at_due=True,
        last_before_notification_for_at=None,
        last_due_notification_for_at=None,
        last_overdue_notification_for_at=None,
        created_at=datetime.now(UTC),
    )
    repo.entities[created.id] = created

    result = await service.update(
        created.id,
        EpisodeMedicationPlanUpdateDto(
            dose_amount="9.2 мл",
            calculated_dose_value=9.2,
            dose_calc_warning=None,
            manual_dose_override=False,
        ),
        account,
    )

    assert result.dose_amount == "9.2 мл"
    assert result.calculated_dose_value == 9.2
    assert result.dose_calc_warning is None
    assert result.manual_dose_override is False
