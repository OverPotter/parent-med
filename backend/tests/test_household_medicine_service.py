from datetime import date
from uuid import uuid4

import pytest

from src.application.services.household_medicine_service import HouseholdMedicineService
from src.domain.entities.household_medicine import HouseholdMedicine


class StubHouseholdMedicineRepository:
    def __init__(self, entity: HouseholdMedicine) -> None:
        self.entity = entity
        self.deleted_id = None

    async def get_by_id(self, id):  # noqa: ANN001
        return self.entity if id == self.entity.id else None

    async def get_by_family_id(self, family_id):  # noqa: ANN001
        return [self.entity] if family_id == self.entity.family_id else []

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


class StubMedicineCatalogRepository:
    async def get_by_id(self, id):  # noqa: ANN001
        return None


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
        catalog_item_id=uuid4(),
        medicine_name="Нурофен",
        medicine_form="syrup",
        medicine_concentration="100 mg/5 ml",
        medicine_description=None,
        medicine_dosage=None,
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
        catalog_repo=StubMedicineCatalogRepository(),
        administration_repo=administration_repo,
        plan_repo=plan_repo,
    )

    await service.delete(entity.id, family_id)

    assert administration_repo.calls == [(entity.id, "Нурофен")]
    assert plan_repo.calls == [(entity.id, "Нурофен")]
    assert household_repo.deleted_id == entity.id
