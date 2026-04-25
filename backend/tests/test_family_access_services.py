from datetime import UTC, date, datetime, time
from uuid import uuid4

import pytest

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child import ChildCreateDto
from src.application.dto.episode_medication_plan import EpisodeMedicationPlanCreateDto
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.application.dto.feeding_record import (
    FeedingRecordCreateDto,
    FeedingRecordStartDto,
    FeedingRecordStopDto,
)
from src.application.dto.household_medicine import HouseholdMedicineUpdateDto
from src.application.dto.illness_episode import IllnessEpisodeCreateDto
from src.application.dto.pillbox import (
    PillboxDoseLogCreateDto,
    PillboxMedicationWriteDto,
    PillboxPlanCreateDto,
    PillboxPlanUpdateDto,
)
from src.application.dto.sleep_session import SleepSessionCreateDto, SleepSessionStopDto
from src.application.services.child_service import ChildService
from src.application.services.episode_medication_plan_service import EpisodeMedicationPlanService
from src.application.services.feeding_record_service import FeedingRecordService
from src.application.services.household_medicine_service import HouseholdMedicineService
from src.application.services.illness_episode_service import IllnessEpisodeService
from src.application.services.pillbox_service import PillboxService
from src.application.services.sleep_session_service import SleepSessionService
from src.core.exceptions import ForbiddenError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.entities.feeding_record import FeedingRecord
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.entities.pillbox import PillboxMedication, PillboxPlan
from src.domain.entities.sleep_session import SleepSession


def build_account(
    *,
    family_id,
    family_role: str = "member",
    access_policy: FamilyAccessPolicyDto | None = None,
) -> AuthenticatedAccount:
    return AuthenticatedAccount(
        id=uuid4(),
        email="user@example.com",
        family_id=family_id,
        display_name="User",
        family_role=family_role,
        access_policy=access_policy or FamilyAccessPolicyDto(),
    )


class StubFamilyRepository:
    def __init__(self, family_id) -> None:  # noqa: ANN001
        self.family_id = family_id

    async def get_by_id(self, id):  # noqa: ANN001
        return object() if id == self.family_id else None


class StubChildRepository:
    def __init__(self, children: list[Child]) -> None:
        self.children = children

    async def get_by_id(self, id):  # noqa: ANN001
        return next((child for child in self.children if child.id == id), None)

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [child for child in self.children if child.family_id == family_id]

    async def add(self, entity):  # noqa: ANN001
        self.children.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.children = [child for child in self.children if child.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.children = [child for child in self.children if child.id != id]


class StubIllnessEpisodeRepository:
    def __init__(self, episodes: list[IllnessEpisode]) -> None:
        self.episodes = episodes

    async def get_by_id(self, id):  # noqa: ANN001
        return next((episode for episode in self.episodes if episode.id == id), None)

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [episode for episode in self.episodes if episode.child_id == child_id]

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        return next(
            (
                episode
                for episode in self.episodes
                if episode.child_id == child_id and episode.status == "active"
            ),
            None,
        )

    async def add(self, entity):  # noqa: ANN001
        self.episodes.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.episodes = [episode for episode in self.episodes if episode.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.episodes = [episode for episode in self.episodes if episode.id != id]


class StubAccountRepository:
    def __init__(self, family_id, members: list[object] | None = None) -> None:  # noqa: ANN001
        self.family_id = family_id
        self.members = members

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        if family_id != self.family_id:
            return []
        if self.members is not None:
            return self.members
        return [type("Member", (), {"id": uuid4()})()]


class StubHouseholdMedicineRepository:
    def __init__(self, medicines: list[HouseholdMedicine]) -> None:
        self.medicines = medicines

    async def get_by_id(self, id):  # noqa: ANN001
        return next((medicine for medicine in self.medicines if medicine.id == id), None)

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [medicine for medicine in self.medicines if medicine.family_id == family_id]

    async def add(self, entity):  # noqa: ANN001
        self.medicines.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.medicines = [item for item in self.medicines if item.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.medicines = [item for item in self.medicines if item.id != id]


class StubAdministrationRepository:
    async def clear_household_medicine_references(self, _id, _name):  # noqa: ANN001
        return None


class StubEpisodeMedicationPlanRepository:
    def __init__(self, plans: list[EpisodeMedicationPlan] | None = None) -> None:
        self.plans = plans or []

    async def clear_household_medicine_references(self, _id, _name):  # noqa: ANN001
        return None

    async def get_by_id(self, id):  # noqa: ANN001
        return next((plan for plan in self.plans if plan.id == id), None)

    async def get_by_episode_id(self, episode_id):  # noqa: ANN001
        return [plan for plan in self.plans if plan.episode_id == episode_id]

    async def get_by_episode_and_medicine(self, episode_id, household_medicine_id):  # noqa: ANN001
        return next(
            (
                plan
                for plan in self.plans
                if plan.episode_id == episode_id
                and plan.household_medicine_id == household_medicine_id
            ),
            None,
        )

    async def add(self, entity):  # noqa: ANN001
        self.plans.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != id]


class StubPillboxRepository:
    def __init__(self, plans: list[PillboxPlan]) -> None:
        self.plans = plans

    async def get_by_id(self, id):  # noqa: ANN001
        return next((plan for plan in self.plans if plan.id == id), None)

    async def list_by_family_id(self, family_id):  # noqa: ANN001
        return [plan for plan in self.plans if plan.family_id == family_id]

    async def add(self, entity):  # noqa: ANN001
        self.plans.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.plans = [plan for plan in self.plans if plan.id != id]

    async def add_dose_log(self, entity):  # noqa: ANN001
        for index, plan in enumerate(self.plans):
            if plan.id != entity.plan_id:
                continue
            updated_plan = PillboxPlan(
                id=plan.id,
                family_id=plan.family_id,
                title=plan.title,
                status=plan.status,
                member_account_ids=plan.member_account_ids,
                created_by_account_id=plan.created_by_account_id,
                created_at=plan.created_at,
                updated_at=plan.updated_at,
                medications=plan.medications,
                dose_logs=[*plan.dose_logs, entity],
            )
            self.plans[index] = updated_plan
            return entity
        return entity


class StubSleepSessionRepository:
    def __init__(self, sessions: list[SleepSession]) -> None:
        self.sessions = sessions

    async def get_by_id(self, id):  # noqa: ANN001
        return next((session for session in self.sessions if session.id == id), None)

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        return next(
            (
                session
                for session in self.sessions
                if session.child_id == child_id and session.status == "active"
            ),
            None,
        )

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [session for session in self.sessions if session.child_id == child_id]

    async def add(self, entity):  # noqa: ANN001
        self.sessions.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.sessions = [session for session in self.sessions if session.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        original_len = len(self.sessions)
        self.sessions = [session for session in self.sessions if session.id != id]
        return len(self.sessions) != original_len


class StubFeedingRecordRepository:
    def __init__(self, records: list[FeedingRecord]) -> None:
        self.records = records

    async def get_by_id(self, id):  # noqa: ANN001
        return next((record for record in self.records if record.id == id), None)

    async def get_active_by_child_id(self, child_id):  # noqa: ANN001
        return next(
            (
                record
                for record in self.records
                if record.child_id == child_id and record.status == "active"
            ),
            None,
        )

    async def get_by_child_id(self, child_id):  # noqa: ANN001
        return [record for record in self.records if record.child_id == child_id]

    async def add(self, entity):  # noqa: ANN001
        self.records.append(entity)
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.records = [record for record in self.records if record.id != entity.id] + [entity]
        return entity

    async def delete(self, id):  # noqa: ANN001
        original_len = len(self.records)
        self.records = [record for record in self.records if record.id != id]
        return len(self.records) != original_len


@pytest.mark.asyncio
async def test_child_list_is_filtered_by_selected_children() -> None:
    family_id = uuid4()
    child_a = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    child_b = Child(id=uuid4(), family_id=family_id, name="B", birth_date=None)
    service = ChildService(
        child_repo=StubChildRepository([child_a, child_b]),
        family_repo=StubFamilyRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_a.id],
            children_access="view",
        ),
    )

    result = await service.get_by_family_id_for_account(family_id, account)

    assert [child.id for child in result] == [child_a.id]


@pytest.mark.asyncio
async def test_family_admin_still_obeys_child_access_policy() -> None:
    family_id = uuid4()
    child_a = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    child_b = Child(id=uuid4(), family_id=family_id, name="B", birth_date=None)
    service = ChildService(
        child_repo=StubChildRepository([child_a, child_b]),
        family_repo=StubFamilyRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_a.id],
            children_access="view",
        ),
    )

    result = await service.get_by_family_id_for_account(family_id, account)

    assert [child.id for child in result] == [child_a.id]


@pytest.mark.asyncio
async def test_family_admin_management_child_list_ignores_personal_child_filter() -> None:
    family_id = uuid4()
    child_a = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    child_b = Child(id=uuid4(), family_id=family_id, name="B", birth_date=None)
    service = ChildService(
        child_repo=StubChildRepository([child_a, child_b]),
        family_repo=StubFamilyRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_a.id],
            children_access="view",
        ),
    )

    result = await service.get_by_family_id_for_management(family_id, account)

    assert [child.id for child in result] == [child_a.id, child_b.id]


@pytest.mark.asyncio
async def test_child_create_requires_family_admin() -> None:
    family_id = uuid4()
    service = ChildService(
        child_repo=StubChildRepository([]),
        family_repo=StubFamilyRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )

    with pytest.raises(ForbiddenError, match="администратор семьи"):
        await service.create_for_account(
            ChildCreateDto(
                family_id=family_id,
                name="Новый ребёнок",
                birth_date=None,
                baby_mode_enabled=False,
            ),
            account,
        )


@pytest.mark.asyncio
async def test_illness_create_requires_edit_access_to_child() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    service = IllnessEpisodeService(
        episode_repo=StubIllnessEpisodeRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child.id],
            children_access="view",
        ),
    )

    with pytest.raises(ForbiddenError, match="изменение данных этого ребёнка"):
        await service.create(
            IllnessEpisodeCreateDto(
                child_id=child.id,
                started_at=date.today(),
                title="ОРВИ",
                medication_mode="manual",
                note=None,
                member_account_ids=[],
            ),
            account,
        )


@pytest.mark.asyncio
async def test_illness_create_allows_selected_child_edit_access() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    service = IllnessEpisodeService(
        episode_repo=StubIllnessEpisodeRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child.id],
            children_access="edit",
        ),
    )

    result = await service.create(
        IllnessEpisodeCreateDto(
            child_id=child.id,
            started_at=date.today(),
            title="ОРВИ",
            medication_mode="manual",
            note=None,
            member_account_ids=[],
        ),
        account,
    )

    assert result.child_id == child.id


@pytest.mark.asyncio
async def test_illness_create_rejects_recipients_without_child_access() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    blocked_by_child_access_id = uuid4()
    service = IllnessEpisodeService(
        episode_repo=StubIllnessEpisodeRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": blocked_by_child_access_id,
                        "access_policy": FamilyAccessPolicyDto(
                            all_children=False,
                            child_ids=[],
                        ),
                    },
                )(),
            ],
        ),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child.id],
            children_access="edit",
        ),
    )

    with pytest.raises(ForbiddenError, match="доступа к ребёнку"):
        await service.create(
            IllnessEpisodeCreateDto(
                child_id=child.id,
                started_at=date.today(),
                title="ОРВИ",
                medication_mode="manual",
                note=None,
                member_account_ids=[blocked_by_child_access_id],
            ),
            account,
        )


@pytest.mark.asyncio
async def test_illness_create_allows_observer_recipient_with_child_view_access() -> None:
    family_id = uuid4()
    child = Child(id=uuid4(), family_id=family_id, name="A", birth_date=None)
    observer_id = uuid4()
    service = IllnessEpisodeService(
        episode_repo=StubIllnessEpisodeRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": observer_id,
                        "access_policy": FamilyAccessPolicyDto(
                            all_children=False,
                            child_ids=[child.id],
                            children_access="view",
                        ),
                    },
                )(),
            ],
        ),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child.id],
            children_access="edit",
        ),
    )

    result = await service.create(
        IllnessEpisodeCreateDto(
            child_id=child.id,
            started_at=date.today(),
            title="ОРВИ",
            medication_mode="manual",
            note=None,
            member_account_ids=[observer_id],
        ),
        account,
    )

    assert result.member_account_ids == [observer_id]


@pytest.mark.asyncio
async def test_episode_medication_plan_create_requires_child_edit_access() -> None:
    family_id = uuid4()
    child_id = uuid4()
    episode_id = uuid4()
    child = Child(id=child_id, family_id=family_id, name="A", birth_date=None)
    episode = IllnessEpisode(
        id=episode_id,
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
    service = EpisodeMedicationPlanService(
        plan_repo=StubEpisodeMedicationPlanRepository(),
        episode_repo=StubIllnessEpisodeRepository([episode]),
        household_repo=StubHouseholdMedicineRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(family_id),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_id],
            children_access="view",
        ),
    )

    with pytest.raises(ForbiddenError, match="изменение данных этого ребёнка"):
        await service.create(
            EpisodeMedicationPlanCreateDto(
                episode_id=episode_id,
                household_medicine_id=None,
                custom_medicine_name="Ибупрофен",
                dose_amount="5 мл",
                min_interval_minutes=240,
                max_doses_per_day=4,
                weight_kg=None,
                dose_mg_per_kg=None,
                notes=None,
                member_account_ids=[],
            ),
            account,
        )


@pytest.mark.asyncio
async def test_episode_medication_plan_create_rejects_recipients_without_child_access() -> None:
    family_id = uuid4()
    child_id = uuid4()
    episode_id = uuid4()
    recipient_id = uuid4()
    child = Child(id=child_id, family_id=family_id, name="A", birth_date=None)
    episode = IllnessEpisode(
        id=episode_id,
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
    service = EpisodeMedicationPlanService(
        plan_repo=StubEpisodeMedicationPlanRepository(),
        episode_repo=StubIllnessEpisodeRepository([episode]),
        household_repo=StubHouseholdMedicineRepository([]),
        child_repo=StubChildRepository([child]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": recipient_id,
                        "access_policy": FamilyAccessPolicyDto(
                            all_children=False,
                            child_ids=[],
                            children_access="view",
                        ),
                    },
                )(),
            ],
        ),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=False,
            child_ids=[child_id],
            children_access="edit",
        ),
    )

    with pytest.raises(ForbiddenError, match="доступа к ребёнку"):
        await service.create(
            EpisodeMedicationPlanCreateDto(
                episode_id=episode_id,
                household_medicine_id=None,
                custom_medicine_name="Ибупрофен",
                dose_amount="5 мл",
                min_interval_minutes=240,
                max_doses_per_day=4,
                weight_kg=None,
                dose_mg_per_kg=None,
                notes=None,
                member_account_ids=[recipient_id],
            ),
            account,
        )


@pytest.mark.asyncio
async def test_household_medicine_update_requires_cabinet_edit_access() -> None:
    family_id = uuid4()
    medicine = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
        medicine_name="Ибупрофен",
        medicine_form="сироп",
        medicine_category=None,
        medicine_concentration=None,
        medicine_description=None,
        medicine_dosage=None,
        pediatric_dose_mg_per_kg_min=None,
        pediatric_dose_mg_per_kg_max=None,
        pediatric_dose_note=None,
        expiry_date=date.today(),
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    service = HouseholdMedicineService(
        household_repo=StubHouseholdMedicineRepository([medicine]),
        family_repo=StubFamilyRepository(family_id),
        administration_repo=StubAdministrationRepository(),
        plan_repo=StubEpisodeMedicationPlanRepository(),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(cabinet_access="view"),
    )

    with pytest.raises(ForbiddenError, match="аптечке"):
        await service.update(medicine.id, account, HouseholdMedicineUpdateDto(comment="новый"))


@pytest.mark.asyncio
async def test_family_admin_can_lose_cabinet_access() -> None:
    family_id = uuid4()
    medicine = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
        medicine_name="Ибупрофен",
        medicine_form="сироп",
        medicine_category=None,
        medicine_concentration=None,
        medicine_description=None,
        medicine_dosage=None,
        pediatric_dose_mg_per_kg_min=None,
        pediatric_dose_mg_per_kg_max=None,
        pediatric_dose_note=None,
        expiry_date=date.today(),
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    service = HouseholdMedicineService(
        household_repo=StubHouseholdMedicineRepository([medicine]),
        family_repo=StubFamilyRepository(family_id),
        administration_repo=StubAdministrationRepository(),
        plan_repo=StubEpisodeMedicationPlanRepository(),
    )
    account = build_account(
        family_id=family_id,
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(cabinet_access="none"),
    )

    with pytest.raises(ForbiddenError, match="аптечке"):
        await service.get_by_family_id(account)


@pytest.mark.asyncio
async def test_pillbox_list_requires_pillbox_view_access() -> None:
    family_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(pillbox_access="none"),
    )

    with pytest.raises(ForbiddenError, match="приёмам"):
        await service.list_by_family_id(account)


@pytest.mark.asyncio
async def test_family_admin_can_lose_pillbox_access() -> None:
    family_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        family_role="admin",
        access_policy=FamilyAccessPolicyDto(pillbox_access="none"),
    )

    with pytest.raises(ForbiddenError, match="приёмам"):
        await service.list_by_family_id(account)


@pytest.mark.asyncio
async def test_pillbox_create_requires_edit_access() -> None:
    family_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(pillbox_access="view"),
    )

    with pytest.raises(ForbiddenError, match="приёмам"):
        await service.create(
            PillboxPlanCreateDto(
                title="Курс",
                member_account_ids=[],
                medications=[
                    PillboxMedicationWriteDto(
                        household_medicine_id=None,
                        custom_medicine_name="Ибупрофен",
                        dose_amount="5 мл",
                        meal_rule="after_meal",
                        repeat_days=[1, 2, 3],
                        times=[time(9, 0)],
                        course_mode="continuous",
                        course_start_date=None,
                        course_end_date=None,
                        position=0,
                    )
                ],
            ),
            account.id,
            account,
        )


@pytest.mark.asyncio
async def test_pillbox_create_rejects_act_access() -> None:
    family_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(pillbox_access="act"),
    )

    with pytest.raises(ForbiddenError, match="приёмам"):
        await service.create(
            PillboxPlanCreateDto(
                title="Курс",
                member_account_ids=[],
                medications=[
                    PillboxMedicationWriteDto(
                        household_medicine_id=None,
                        custom_medicine_name="Ибупрофен",
                        dose_amount="5 мл",
                        meal_rule="after_meal",
                        repeat_days=[1, 2, 3],
                        times=[time(9, 0)],
                        course_mode="continuous",
                        course_start_date=None,
                        course_end_date=None,
                        position=0,
                    )
                ],
            ),
            account.id,
            account,
        )


@pytest.mark.asyncio
async def test_pillbox_create_rejects_children_view_even_with_edit_access() -> None:
    family_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="view", pillbox_access="edit"),
    )

    with pytest.raises(ForbiddenError, match="нужен доступ к детям"):
        await service.create(
            PillboxPlanCreateDto(
                title="Курс",
                member_account_ids=[],
                medications=[
                    PillboxMedicationWriteDto(
                        household_medicine_id=None,
                        custom_medicine_name="Ибупрофен",
                        dose_amount="5 мл",
                        meal_rule="after_meal",
                        repeat_days=[1, 2, 3],
                        times=[time(9, 0)],
                        course_mode="continuous",
                        course_start_date=None,
                        course_end_date=None,
                        position=0,
                    )
                ],
            ),
            account.id,
            account,
        )


@pytest.mark.asyncio
async def test_pillbox_create_rejects_recipients_without_pillbox_access() -> None:
    family_id = uuid4()
    blocked_member_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": blocked_member_id,
                        "access_policy": FamilyAccessPolicyDto(pillbox_access="none"),
                    },
                )(),
            ],
        ),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit", pillbox_access="edit"),
    )

    with pytest.raises(ValidationError, match="доступа к приёмам"):
        await service.create(
            PillboxPlanCreateDto(
                title="Курс",
                member_account_ids=[blocked_member_id],
                medications=[
                    PillboxMedicationWriteDto(
                        household_medicine_id=None,
                        custom_medicine_name="Ибупрофен",
                        dose_amount="5 мл",
                        meal_rule="after_meal",
                        repeat_days=[1, 2, 3],
                        times=[time(9, 0)],
                        course_mode="continuous",
                        course_start_date=None,
                        course_end_date=None,
                        position=0,
                    )
                ],
            ),
            account.id,
            account,
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("recipient_access", "expected_allowed"),
    [
        ("view", True),
        ("act", True),
        ("edit", True),
        ("none", False),
    ],
)
async def test_pillbox_create_recipient_matrix(
    recipient_access: str,
    expected_allowed: bool,
) -> None:
    family_id = uuid4()
    recipient_id = uuid4()
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": recipient_id,
                        "access_policy": FamilyAccessPolicyDto(pillbox_access=recipient_access),
                    },
                )(),
            ],
        ),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit", pillbox_access="edit"),
    )
    dto = PillboxPlanCreateDto(
        title="Курс",
        member_account_ids=[recipient_id],
        medications=[
            PillboxMedicationWriteDto(
                household_medicine_id=None,
                custom_medicine_name="Ибупрофен",
                dose_amount="5 мл",
                meal_rule="after_meal",
                repeat_days=[1, 2, 3],
                times=[time(9, 0)],
                course_mode="continuous",
                course_start_date=None,
                course_end_date=None,
                position=0,
            )
        ],
    )

    if expected_allowed:
        result = await service.create(dto, account.id, account)
        assert result.member_account_ids == [recipient_id]
        return

    with pytest.raises(ValidationError, match="доступа к приёмам"):
        await service.create(dto, account.id, account)


@pytest.mark.asyncio
async def test_pillbox_create_defaults_empty_recipients_to_current_account() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit", pillbox_access="edit"),
    )
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": account.id,
                        "access_policy": FamilyAccessPolicyDto(pillbox_access="edit"),
                    },
                )(),
            ],
        ),
        household_repo=StubHouseholdMedicineRepository([]),
    )

    result = await service.create(
        PillboxPlanCreateDto(
            title="Курс",
            member_account_ids=[],
            medications=[
                PillboxMedicationWriteDto(
                    household_medicine_id=None,
                    custom_medicine_name="Ибупрофен",
                    dose_amount="5 мл",
                    meal_rule="after_meal",
                    repeat_days=[1, 2, 3],
                    times=[time(9, 0)],
                    course_mode="continuous",
                    course_start_date=None,
                    course_end_date=None,
                    position=0,
                )
            ],
        ),
        account.id,
        account,
    )

    assert result.member_account_ids == [account.id]


@pytest.mark.asyncio
async def test_pillbox_update_defaults_empty_recipients_to_current_account() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit", pillbox_access="edit"),
    )
    plan_id = uuid4()
    now = datetime.now(UTC)
    existing_plan = PillboxPlan(
        id=plan_id,
        family_id=family_id,
        title="Курс",
        status="active",
        member_account_ids=[uuid4()],
        created_by_account_id=account.id,
        created_at=now,
        updated_at=now,
        medications=[
            PillboxMedication(
                id=uuid4(),
                plan_id=plan_id,
                household_medicine_id=None,
                custom_medicine_name="Ибупрофен",
                dose_amount="5 мл",
                meal_rule="after_meal",
                repeat_days=[1, 2, 3],
                times=[time(9, 0)],
                course_mode="continuous",
                course_start_date=None,
                course_end_date=None,
                position=0,
                created_at=now,
                updated_at=now,
            )
        ],
        dose_logs=[],
    )
    service = PillboxService(
        pillbox_repo=StubPillboxRepository([existing_plan]),
        account_repo=StubAccountRepository(
            family_id,
            members=[
                type(
                    "Member",
                    (),
                    {
                        "id": account.id,
                        "access_policy": FamilyAccessPolicyDto(pillbox_access="edit"),
                    },
                )(),
            ],
        ),
        household_repo=StubHouseholdMedicineRepository([]),
    )

    result = await service.update(
        plan_id,
        PillboxPlanUpdateDto(
            title="Курс",
            status="active",
            member_account_ids=[],
            medications=[
                PillboxMedicationWriteDto(
                    id=existing_plan.medications[0].id,
                    household_medicine_id=None,
                    custom_medicine_name="Ибупрофен",
                    dose_amount="5 мл",
                    meal_rule="after_meal",
                    repeat_days=[1, 2, 3],
                    times=[time(9, 0)],
                    course_mode="continuous",
                    course_start_date=None,
                    course_end_date=None,
                    position=0,
                )
            ],
        ),
        account.id,
        account,
    )

    assert result.member_account_ids == [account.id]


@pytest.mark.asyncio
async def test_pillbox_log_dose_allows_act_access() -> None:
    family_id = uuid4()
    plan_id = uuid4()
    medication_id = uuid4()
    scheduled_for = datetime(2026, 4, 20, 5, 0, tzinfo=UTC)
    now = datetime(2026, 4, 19, 8, 0, tzinfo=UTC)
    service = PillboxService(
        pillbox_repo=StubPillboxRepository(
            [
                PillboxPlan(
                    id=plan_id,
                    family_id=family_id,
                    title="Курс",
                    status="active",
                    member_account_ids=[],
                    created_by_account_id=uuid4(),
                    created_at=now,
                    updated_at=now,
                    medications=[
                        PillboxMedication(
                            id=medication_id,
                            plan_id=plan_id,
                            household_medicine_id=None,
                            custom_medicine_name="Ибупрофен",
                            dose_amount="5 мл",
                            meal_rule="after_meal",
                            repeat_days=[1],
                            times=[time(8, 0)],
                            course_mode="continuous",
                            course_start_date=None,
                            course_end_date=None,
                            position=0,
                            created_at=now,
                            updated_at=now,
                        )
                    ],
                    dose_logs=[],
                )
            ]
        ),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(pillbox_access="act"),
    )

    summary = await service.log_dose(
        plan_id=plan_id,
        medication_id=medication_id,
        dto=PillboxDoseLogCreateDto(scheduled_for=scheduled_for, source="manual"),
        current_account_id=account.id,
        current_account_display_name=account.display_name,
        current_account=account,
    )

    assert summary.id == plan_id


@pytest.mark.asyncio
async def test_pillbox_log_dose_rejects_view_only_access() -> None:
    family_id = uuid4()
    plan_id = uuid4()
    medication_id = uuid4()
    scheduled_for = datetime(2026, 4, 20, 5, 0, tzinfo=UTC)
    now = datetime(2026, 4, 19, 8, 0, tzinfo=UTC)
    service = PillboxService(
        pillbox_repo=StubPillboxRepository(
            [
                PillboxPlan(
                    id=plan_id,
                    family_id=family_id,
                    title="Курс",
                    status="active",
                    member_account_ids=[],
                    created_by_account_id=uuid4(),
                    created_at=now,
                    updated_at=now,
                    medications=[
                        PillboxMedication(
                            id=medication_id,
                            plan_id=plan_id,
                            household_medicine_id=None,
                            custom_medicine_name="Ибупрофен",
                            dose_amount="5 мл",
                            meal_rule="after_meal",
                            repeat_days=[1],
                            times=[time(8, 0)],
                            course_mode="continuous",
                            course_start_date=None,
                            course_end_date=None,
                            position=0,
                            created_at=now,
                            updated_at=now,
                        )
                    ],
                    dose_logs=[],
                )
            ]
        ),
        account_repo=StubAccountRepository(family_id),
        household_repo=StubHouseholdMedicineRepository([]),
    )
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(pillbox_access="view"),
    )

    with pytest.raises(ForbiddenError, match="приёмам"):
        await service.log_dose(
            plan_id=plan_id,
            medication_id=medication_id,
            dto=PillboxDoseLogCreateDto(scheduled_for=scheduled_for, source="manual"),
            current_account_id=account.id,
            current_account_display_name=account.display_name,
            current_account=account,
        )


@pytest.mark.asyncio
async def test_sleep_stop_requires_session_initiator() -> None:
    family_id = uuid4()
    owner_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    other_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    session = SleepSession(
        id=uuid4(),
        child_id=child.id,
        started_at=datetime.now(UTC),
        ended_at=None,
        status="active",
        created_by_account_id=owner_account.id,
    )
    service = SleepSessionService(
        sleep_repo=StubSleepSessionRepository([session]),
        child_repo=StubChildRepository([child]),
    )

    with pytest.raises(ForbiddenError, match="только тот, кто его запустил"):
        await service.stop(session.id, SleepSessionStopDto(), other_account)


@pytest.mark.asyncio
async def test_sleep_start_allows_children_act_access() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=True,
            children_access="act",
        ),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    service = SleepSessionService(
        sleep_repo=StubSleepSessionRepository([]),
        child_repo=StubChildRepository([child]),
    )

    result = await service.start(
        SleepSessionCreateDto(child_id=child.id),
        account,
    )

    assert result.child_id == child.id


@pytest.mark.asyncio
async def test_sleep_delete_requires_session_initiator_for_active_session() -> None:
    family_id = uuid4()
    owner_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    other_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    session = SleepSession(
        id=uuid4(),
        child_id=child.id,
        started_at=datetime.now(UTC),
        ended_at=None,
        status="active",
        created_by_account_id=owner_account.id,
    )
    service = SleepSessionService(
        sleep_repo=StubSleepSessionRepository([session]),
        child_repo=StubChildRepository([child]),
    )

    with pytest.raises(ForbiddenError, match="только тот, кто его запустил"):
        await service.delete(session.id, other_account)


@pytest.mark.asyncio
async def test_feeding_stop_requires_record_initiator() -> None:
    family_id = uuid4()
    owner_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    other_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    record = FeedingRecord(
        id=uuid4(),
        child_id=child.id,
        feeding_type="breast",
        breast_side="left",
        is_expressed=False,
        formula_volume_ml=None,
        recorded_at=datetime.now(UTC),
        started_at=datetime.now(UTC),
        ended_at=None,
        duration_minutes=None,
        status="active",
        note=None,
        created_by_account_id=owner_account.id,
    )
    service = FeedingRecordService(
        feeding_repo=StubFeedingRecordRepository([record]),
        child_repo=StubChildRepository([child]),
    )

    with pytest.raises(ForbiddenError, match="только тот, кто его запустил"):
        await service.stop(record.id, FeedingRecordStopDto(), other_account)


@pytest.mark.asyncio
async def test_feeding_create_allows_children_act_access() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(
            all_children=True,
            children_access="act",
        ),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    service = FeedingRecordService(
        feeding_repo=StubFeedingRecordRepository([]),
        child_repo=StubChildRepository([child]),
    )

    result = await service.create(
        FeedingRecordCreateDto(
            child_id=child.id,
            feeding_type="breast",
            breast_side="left",
            is_expressed=False,
            formula_volume_ml=None,
            duration_minutes=None,
            recorded_at=None,
            note=None,
        ),
        account,
    )

    assert result.child_id == child.id


@pytest.mark.asyncio
async def test_feeding_start_uses_device_timestamp_when_provided() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    service = FeedingRecordService(
        feeding_repo=StubFeedingRecordRepository([]),
        child_repo=StubChildRepository([child]),
    )
    started_at = datetime(2026, 4, 23, 7, 15, tzinfo=UTC)

    result = await service.start(
        FeedingRecordStartDto(
            child_id=child.id,
            feeding_type="breast",
            breast_side="left",
            is_expressed=False,
            formula_volume_ml=None,
            recorded_at=started_at,
            started_at=started_at,
            note=None,
        ),
        account,
    )

    assert result.started_at == started_at
    assert result.recorded_at == started_at


@pytest.mark.asyncio
async def test_feeding_stop_uses_device_timestamp_when_provided() -> None:
    family_id = uuid4()
    account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    started_at = datetime(2026, 4, 23, 7, 15, tzinfo=UTC)
    ended_at = datetime(2026, 4, 23, 7, 42, tzinfo=UTC)
    record = FeedingRecord(
        id=uuid4(),
        child_id=child.id,
        feeding_type="breast",
        breast_side="left",
        is_expressed=False,
        formula_volume_ml=None,
        recorded_at=started_at,
        started_at=started_at,
        ended_at=None,
        duration_minutes=None,
        status="active",
        note=None,
        created_by_account_id=account.id,
    )
    service = FeedingRecordService(
        feeding_repo=StubFeedingRecordRepository([record]),
        child_repo=StubChildRepository([child]),
    )

    result = await service.stop(
        record.id,
        FeedingRecordStopDto(ended_at=ended_at),
        account,
    )

    assert result.ended_at == ended_at
    assert result.duration_minutes == 27


@pytest.mark.asyncio
async def test_feeding_delete_requires_record_initiator_for_active_record() -> None:
    family_id = uuid4()
    owner_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    other_account = build_account(
        family_id=family_id,
        access_policy=FamilyAccessPolicyDto(children_access="edit"),
    )
    child = Child(
        id=uuid4(),
        family_id=family_id,
        name="Миша",
        birth_date=None,
        baby_mode_enabled=True,
    )
    record = FeedingRecord(
        id=uuid4(),
        child_id=child.id,
        feeding_type="breast",
        breast_side="left",
        is_expressed=False,
        formula_volume_ml=None,
        recorded_at=datetime.now(UTC),
        started_at=datetime.now(UTC),
        ended_at=None,
        duration_minutes=None,
        status="active",
        note=None,
        created_by_account_id=owner_account.id,
    )
    service = FeedingRecordService(
        feeding_repo=StubFeedingRecordRepository([record]),
        child_repo=StubChildRepository([child]),
    )

    with pytest.raises(ForbiddenError, match="только тот, кто его запустил"):
        await service.delete(record.id, other_account)
