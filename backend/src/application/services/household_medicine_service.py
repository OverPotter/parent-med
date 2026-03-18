"""Сервис домашней аптечки."""

from datetime import date
from uuid import UUID, uuid4

from src.application.dto.household_medicine import (
    HouseholdMedicineCreateDto,
    HouseholdMedicineResponseDto,
    HouseholdMedicineUpdateDto,
)
from src.application.services.safety_engine import calculate_household_medicine_status
from src.core.exceptions import NotFoundError, ValidationError
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

    async def _to_response(self, entity: HouseholdMedicine) -> HouseholdMedicineResponseDto:
        status = calculate_household_medicine_status(entity)
        return HouseholdMedicineResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            catalog_item_id=entity.catalog_item_id,
            medicine_name=entity.medicine_name,
            medicine_form=entity.medicine_form,
            medicine_concentration=entity.medicine_concentration,
            medicine_description=entity.medicine_description,
            medicine_dosage=entity.medicine_dosage,
            expiry_date=entity.expiry_date,
            opened_at=entity.opened_at,
            opened_shelf_days=entity.opened_shelf_days,
            effective_opened_shelf_days=(
                int(status["effective_opened_shelf_days"])
                if isinstance(status["effective_opened_shelf_days"], int)
                else None
            ),
            comment=entity.comment,
            status=status["status"].value,
            status_label=status["status_label"],
            expiry_alert_date=(
                status["expiry_alert_date"]
                if isinstance(status["expiry_alert_date"], date)
                else None
            ),
            expires_in_days=int(status["expires_in_days"]),
            opened_expires_at=(
                status["opened_expires_at"]
                if isinstance(status["opened_expires_at"], date)
                else None
            ),
            opened_expires_in_days=(
                int(status["opened_expires_in_days"])
                if isinstance(status["opened_expires_in_days"], int)
                else None
            ),
        )

    async def get_by_id(self, id: UUID, family_id: UUID) -> HouseholdMedicineResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if entity.family_id != family_id:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        return await self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[HouseholdMedicineResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        entities = sorted(
            entities,
            key=lambda item: (
                calculate_household_medicine_status(item)["status"].priority,
                item.expiry_date,
            ),
        )
        return [await self._to_response(e) for e in entities]

    async def create(
        self, family_id: UUID, dto: HouseholdMedicineCreateDto
    ) -> HouseholdMedicineResponseDto:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        if dto.opened_at is not None and dto.opened_at.date() > date.today():
            raise ValidationError(
                "Дата вскрытия не может быть в будущем", code="OPENED_AT_IN_FUTURE"
            )
        if dto.catalog_item_id is not None:
            catalog_item = await self._catalog_repo.get_by_id(dto.catalog_item_id)
            if catalog_item is None:
                raise NotFoundError("Препарат не найден в справочнике", resource="medicine_catalog")
            catalog_item_id = catalog_item.id
            medicine_name = catalog_item.name
            medicine_form = catalog_item.form
            medicine_concentration = catalog_item.concentration
            medicine_description = catalog_item.description
            medicine_dosage = catalog_item.dosage
            opened_shelf_days = dto.opened_shelf_days or catalog_item.default_opened_shelf_days
        else:
            catalog_item_id = None
            medicine_name = (dto.medicine_name or "").strip()
            medicine_form = (dto.medicine_form or "").strip()
            if not medicine_name or not medicine_form:
                raise ValidationError(
                    "Для своего препарата нужно указать название и форму",
                    code="MEDICINE_NAME_AND_FORM_REQUIRED",
                )
            medicine_concentration = dto.medicine_concentration
            medicine_description = dto.medicine_description
            medicine_dosage = dto.medicine_dosage
            opened_shelf_days = dto.opened_shelf_days
        entity = HouseholdMedicine(
            id=uuid4(),
            family_id=family_id,
            catalog_item_id=catalog_item_id,
            medicine_name=medicine_name,
            medicine_form=medicine_form,
            medicine_concentration=medicine_concentration,
            medicine_description=medicine_description,
            medicine_dosage=medicine_dosage,
            expiry_date=dto.expiry_date,
            opened_at=dto.opened_at,
            opened_shelf_days=opened_shelf_days,
            comment=dto.comment,
        )
        created = await self._repo.add(entity)
        return await self._to_response(created)

    async def update(
        self, id: UUID, family_id: UUID, dto: HouseholdMedicineUpdateDto
    ) -> HouseholdMedicineResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if entity.family_id != family_id:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        fields_set = dto.model_fields_set
        expiry_date = dto.expiry_date if "expiry_date" in fields_set else entity.expiry_date
        opened_at = dto.opened_at if "opened_at" in fields_set else entity.opened_at
        opened_shelf_days = (
            dto.opened_shelf_days if "opened_shelf_days" in fields_set else entity.opened_shelf_days
        )
        comment = dto.comment if "comment" in fields_set else entity.comment
        medicine_name = entity.medicine_name
        medicine_form = entity.medicine_form
        medicine_concentration = entity.medicine_concentration
        medicine_description = entity.medicine_description
        medicine_dosage = entity.medicine_dosage

        if entity.catalog_item_id is None:
            medicine_name = (
                dto.medicine_name if "medicine_name" in fields_set else entity.medicine_name
            )
            medicine_form = (
                dto.medicine_form if "medicine_form" in fields_set else entity.medicine_form
            )
            medicine_concentration = (
                dto.medicine_concentration
                if "medicine_concentration" in fields_set
                else entity.medicine_concentration
            )
            medicine_description = (
                dto.medicine_description
                if "medicine_description" in fields_set
                else entity.medicine_description
            )
            medicine_dosage = (
                dto.medicine_dosage if "medicine_dosage" in fields_set else entity.medicine_dosage
            )

            if not (medicine_name or "").strip() or not (medicine_form or "").strip():
                raise ValidationError(
                    "Для своего препарата нужно указать название и форму",
                    code="MEDICINE_NAME_AND_FORM_REQUIRED",
                )

        if opened_at is not None and opened_at.date() > date.today():
            raise ValidationError(
                "Дата вскрытия не может быть в будущем", code="OPENED_AT_IN_FUTURE"
            )
        entity = HouseholdMedicine(
            id=entity.id,
            family_id=entity.family_id,
            catalog_item_id=entity.catalog_item_id,
            medicine_name=(medicine_name or "").strip(),
            medicine_form=(medicine_form or "").strip(),
            medicine_concentration=medicine_concentration,
            medicine_description=medicine_description,
            medicine_dosage=medicine_dosage,
            expiry_date=expiry_date,
            opened_at=opened_at,
            opened_shelf_days=opened_shelf_days,
            comment=comment,
        )
        updated = await self._repo.update(entity)
        return await self._to_response(updated)

    async def delete(self, id: UUID, family_id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if entity is None or entity.family_id != family_id:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        await self._repo.delete(id)
