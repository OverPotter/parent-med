"""Сервис домашней аптечки."""

from uuid import UUID, uuid4

from src.application.dto.household_medicine import (
    HouseholdMedicineCreateDto,
    HouseholdMedicineResponseDto,
    HouseholdMedicineUpdateDto,
)
from src.core.exceptions import NotFoundError
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.medicine_catalog_repository import MedicineCatalogRepository


class HouseholdMedicineService:
    """Сервис упаковок в аптечке: добавление, вскрытие, список."""

    def __init__(
        self,
        household_repo: HouseholdMedicineRepository,
        family_repo: FamilyRepository,
        catalog_repo: MedicineCatalogRepository,
    ) -> None:
        self._repo = household_repo
        self._family_repo = family_repo
        self._catalog_repo = catalog_repo

    def _to_response(self, entity: HouseholdMedicine) -> HouseholdMedicineResponseDto:
        return HouseholdMedicineResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            catalog_item_id=entity.catalog_item_id,
            expiry_date=entity.expiry_date,
            opened_at=entity.opened_at,
            storage_place=entity.storage_place,
            comment=entity.comment,
        )

    async def get_by_id(self, id: UUID) -> HouseholdMedicineResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[HouseholdMedicineResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        return [self._to_response(e) for e in entities]

    async def create(self, dto: HouseholdMedicineCreateDto) -> HouseholdMedicineResponseDto:
        if await self._family_repo.get_by_id(dto.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        if await self._catalog_repo.get_by_id(dto.catalog_item_id) is None:
            raise NotFoundError("Препарат не найден в справочнике", resource="medicine_catalog")
        entity = HouseholdMedicine(
            id=uuid4(),
            family_id=dto.family_id,
            catalog_item_id=dto.catalog_item_id,
            expiry_date=dto.expiry_date,
            opened_at=dto.opened_at,
            storage_place=dto.storage_place,
            comment=dto.comment,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(
        self, id: UUID, dto: HouseholdMedicineUpdateDto
    ) -> HouseholdMedicineResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        opened_at = dto.opened_at if dto.opened_at is not None else entity.opened_at
        storage_place = dto.storage_place if dto.storage_place is not None else entity.storage_place
        comment = dto.comment if dto.comment is not None else entity.comment
        entity = HouseholdMedicine(
            id=entity.id,
            family_id=entity.family_id,
            catalog_item_id=entity.catalog_item_id,
            expiry_date=entity.expiry_date,
            opened_at=opened_at,
            storage_place=storage_place,
            comment=comment,
        )
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        await self._repo.delete(id)
