"""Реализация репозитория домашней аптечки."""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.infrastructure.database.models.administration_event import AdministrationEventModel
from src.infrastructure.database.models.household_medicine import HouseholdMedicineModel


class SqlHouseholdMedicineRepository(HouseholdMedicineRepository):
    """Репозиторий упаковок в аптечке на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: HouseholdMedicineModel) -> HouseholdMedicine:
        return HouseholdMedicine(
            id=m.id,
            family_id=m.family_id,
            medicine_name=m.medicine_name,
            medicine_form=m.medicine_form,
            medicine_category=m.medicine_category,
            medicine_concentration=m.medicine_concentration,
            medicine_description=m.medicine_description,
            medicine_dosage=m.medicine_dosage,
            pediatric_dose_mg_per_kg_min=m.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=m.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=m.pediatric_dose_note,
            expiry_date=m.expiry_date,
            opened_at=m.opened_at,
            opened_shelf_days=m.opened_shelf_days,
            comment=m.comment,
        )

    def _to_model(self, e: HouseholdMedicine) -> HouseholdMedicineModel:
        return HouseholdMedicineModel(
            id=e.id,
            family_id=e.family_id,
            medicine_name=e.medicine_name,
            medicine_form=e.medicine_form,
            medicine_category=e.medicine_category,
            medicine_concentration=e.medicine_concentration,
            medicine_description=e.medicine_description,
            medicine_dosage=e.medicine_dosage,
            pediatric_dose_mg_per_kg_min=e.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=e.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=e.pediatric_dose_note,
            expiry_date=e.expiry_date,
            opened_at=e.opened_at,
            opened_shelf_days=e.opened_shelf_days,
            comment=e.comment,
        )

    async def get_by_id(self, id: UUID) -> HouseholdMedicine | None:
        result = await self._session.execute(
            select(HouseholdMedicineModel).where(HouseholdMedicineModel.id == id)
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_family_id(self, family_id: UUID) -> list[HouseholdMedicine]:
        result = await self._session.execute(
            select(HouseholdMedicineModel)
            .where(HouseholdMedicineModel.family_id == family_id)
            .order_by(HouseholdMedicineModel.expiry_date)
        )
        return [self._to_entity(r) for r in result.scalars().all()]

    async def find_by_snapshot(
        self,
        family_id: UUID,
        medicine_name: str,
        medicine_shape: str,
        medicine_concentration: str | None,
    ) -> HouseholdMedicine | None:
        normalized_concentration = (medicine_concentration or "").strip().lower()
        result = await self._session.execute(
            select(HouseholdMedicineModel).where(
                HouseholdMedicineModel.family_id == family_id,
                func.lower(HouseholdMedicineModel.medicine_name) == medicine_name.strip().lower(),
                func.lower(HouseholdMedicineModel.medicine_form) == medicine_shape.strip().lower(),
                func.lower(func.coalesce(HouseholdMedicineModel.medicine_concentration, ""))
                == normalized_concentration,
            )
        )
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: HouseholdMedicine) -> HouseholdMedicine:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: HouseholdMedicine) -> HouseholdMedicine:
        result = await self._session.execute(
            select(HouseholdMedicineModel).where(HouseholdMedicineModel.id == entity.id)
        )
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"HouseholdMedicine {entity.id} not found")
        row.expiry_date = entity.expiry_date
        row.opened_at = entity.opened_at
        row.opened_shelf_days = entity.opened_shelf_days
        row.comment = entity.comment
        row.medicine_name = entity.medicine_name
        row.medicine_form = entity.medicine_form
        row.medicine_category = entity.medicine_category
        row.medicine_concentration = entity.medicine_concentration
        row.medicine_description = entity.medicine_description
        row.medicine_dosage = entity.medicine_dosage
        row.pediatric_dose_mg_per_kg_min = entity.pediatric_dose_mg_per_kg_min
        row.pediatric_dose_mg_per_kg_max = entity.pediatric_dose_mg_per_kg_max
        row.pediatric_dose_note = entity.pediatric_dose_note
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(HouseholdMedicineModel).where(HouseholdMedicineModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            # Legacy table is no longer used by the app, but old rows can still
            # block cabinet-item deletion through RESTRICT + ORM synchronization.
            await self._session.execute(
                delete(AdministrationEventModel).where(
                    AdministrationEventModel.household_medicine_id == id
                )
            )
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
