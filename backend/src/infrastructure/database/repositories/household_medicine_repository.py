"""Реализация репозитория домашней аптечки."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.infrastructure.database.models.household_medicine import HouseholdMedicineModel


class SqlHouseholdMedicineRepository(HouseholdMedicineRepository):
    """Репозиторий упаковок в аптечке на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: HouseholdMedicineModel) -> HouseholdMedicine:
        return HouseholdMedicine(
            id=m.id,
            family_id=m.family_id,
            catalog_item_id=m.catalog_item_id,
            expiry_date=m.expiry_date,
            opened_at=m.opened_at,
            storage_place=m.storage_place,
            comment=m.comment,
        )

    def _to_model(self, e: HouseholdMedicine) -> HouseholdMedicineModel:
        return HouseholdMedicineModel(
            id=e.id,
            family_id=e.family_id,
            catalog_item_id=e.catalog_item_id,
            expiry_date=e.expiry_date,
            opened_at=e.opened_at,
            storage_place=e.storage_place,
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
        row.storage_place = entity.storage_place
        row.comment = entity.comment
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(
            select(HouseholdMedicineModel).where(HouseholdMedicineModel.id == id)
        )
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
