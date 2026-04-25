from datetime import date
from uuid import uuid4

import pytest

from src.application.dto.household_medicine import (
    HouseholdMedicineCreateDto,
    HouseholdMedicineUpdateDto,
)
from src.application.services.household_medicine_service import HouseholdMedicineService
from src.core.exceptions import ValidationError
from src.domain.entities.household_medicine import HouseholdMedicine


class StubHouseholdMedicineRepository:
    def __init__(self, entity: HouseholdMedicine) -> None:
        self.entity = entity
        self.deleted_id = None

    async def get_by_id(self, id):  # noqa: ANN001
        return self.entity if id == self.entity.id else None

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [self.entity] if family_id == self.entity.family_id else []

    async def find_by_snapshot(  # noqa: ANN001
        self,
        family_id,
        medicine_name,
        medicine_form,
        medicine_concentration,
    ):
        if family_id != self.entity.family_id:
            return None
        if self.entity.medicine_name.strip().lower() != medicine_name.strip().lower():
            return None
        if self.entity.medicine_form.strip().lower() != medicine_form.strip().lower():
            return None
        existing_concentration = (self.entity.medicine_concentration or "").strip()
        requested_concentration = (medicine_concentration or "").strip()
        if existing_concentration != requested_concentration:
            return None
        return self.entity

    async def add(self, entity):  # noqa: ANN001
        self.entity = entity
        return entity

    async def update(self, entity):  # noqa: ANN001
        self.entity = entity
        return entity

    async def delete(self, id):  # noqa: ANN001
        self.deleted_id = id
        return True


class StubFamilyRepository:
    async def get_by_id(self, id):  # noqa: ANN001
        return object()


class StubAdministrationRepository:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def clear_household_medicine_references(  # noqa: ANN001
        self,
        household_medicine_id,
        fallback_medicine_name,
    ):
        self.calls.append((household_medicine_id, fallback_medicine_name))


class StubPlanRepository:
    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def clear_household_medicine_references(  # noqa: ANN001
        self,
        household_medicine_id,
        fallback_medicine_name,
    ):
        self.calls.append((household_medicine_id, fallback_medicine_name))


@pytest.mark.asyncio
async def test_delete_clears_links_before_removing_medicine() -> None:
    family_id = uuid4()
    entity = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
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
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    household_repo = StubHouseholdMedicineRepository(entity)
    administration_repo = StubAdministrationRepository()
    plan_repo = StubPlanRepository()
    service = HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=StubFamilyRepository(),
        administration_repo=administration_repo,
        plan_repo=plan_repo,
    )

    await service.delete(entity.id, family_id)

    assert administration_repo.calls == [(entity.id, "Нурофен")]
    assert plan_repo.calls == [(entity.id, "Нурофен")]
    assert household_repo.deleted_id == entity.id


@pytest.mark.asyncio
async def test_create_keeps_structured_pediatric_dose_snapshot_for_manual_catalog_copy() -> None:
    family_id = uuid4()
    entity = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
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
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    household_repo = StubHouseholdMedicineRepository(entity)
    service = HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=StubFamilyRepository(),
        administration_repo=StubAdministrationRepository(),
        plan_repo=StubPlanRepository(),
    )

    created = await service.create(
        family_id,
        HouseholdMedicineCreateDto(
            medicine_name="Парацетамол детский",
            medicine_form="суспензия",
            medicine_concentration="120 мг/5 мл",
            medicine_description="Для жара и боли",
            medicine_dosage="Справочная подсказка",
            pediatric_dose_mg_per_kg_min=10.0,
            pediatric_dose_mg_per_kg_max=15.0,
            pediatric_dose_note="10-15 мг/кг на приём",
            expiry_date=date(2027, 1, 1),
            opened_at=None,
            opened_shelf_days=None,
            comment=None,
        ),
    )

    assert created.pediatric_dose_mg_per_kg_min == 10.0
    assert created.pediatric_dose_mg_per_kg_max == 15.0
    assert created.pediatric_dose_note == "10-15 мг/кг на приём"


@pytest.mark.asyncio
async def test_create_rejects_duplicate_medicine_snapshot() -> None:
    family_id = uuid4()
    existing = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
        medicine_name="Ибупрофен детский",
        medicine_form="суспензия",
        medicine_category=None,
        medicine_concentration="100 мг/5 мл",
        medicine_description="Для жара и боли",
        medicine_dosage="По инструкции",
        pediatric_dose_mg_per_kg_min=None,
        pediatric_dose_mg_per_kg_max=None,
        pediatric_dose_note=None,
        expiry_date=date(2026, 10, 1),
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    household_repo = StubHouseholdMedicineRepository(existing)
    service = HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=StubFamilyRepository(),
        administration_repo=StubAdministrationRepository(),
        plan_repo=StubPlanRepository(),
    )

    with pytest.raises(ValidationError, match="уже есть в аптечке"):
        await service.create(
            family_id,
            HouseholdMedicineCreateDto(
                medicine_name="Ибупрофен детский",
                medicine_form="суспензия",
                medicine_concentration="100 мг/5 мл",
                medicine_description="Для жара и боли",
                medicine_dosage="По инструкции",
                pediatric_dose_mg_per_kg_min=None,
                pediatric_dose_mg_per_kg_max=None,
                pediatric_dose_note=None,
                expiry_date=date(2027, 1, 1),
                opened_at=None,
                opened_shelf_days=None,
                comment=None,
            ),
        )


@pytest.mark.asyncio
async def test_update_allows_setting_calc_dose_for_catalog_medicine() -> None:
    family_id = uuid4()
    existing = HouseholdMedicine(
        id=uuid4(),
        family_id=family_id,
        medicine_name="Парацетамол",
        medicine_form="таблетки",
        medicine_category=None,
        medicine_concentration="500 мг",
        medicine_description="Для жара и боли",
        medicine_dosage="По инструкции",
        pediatric_dose_mg_per_kg_min=None,
        pediatric_dose_mg_per_kg_max=None,
        pediatric_dose_note=None,
        expiry_date=date(2026, 10, 1),
        opened_at=None,
        opened_shelf_days=None,
        comment=None,
    )
    household_repo = StubHouseholdMedicineRepository(existing)
    service = HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=StubFamilyRepository(),
        administration_repo=StubAdministrationRepository(),
        plan_repo=StubPlanRepository(),
    )

    updated = await service.update(
        existing.id,
        family_id,
        HouseholdMedicineUpdateDto(
            pediatric_dose_mg_per_kg_min=10.0,
            pediatric_dose_mg_per_kg_max=15.0,
        ),
    )

    assert updated.pediatric_dose_mg_per_kg_min == 10.0
    assert updated.pediatric_dose_mg_per_kg_max == 15.0
