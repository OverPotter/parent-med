"""Сервис домашней аптечки."""

from datetime import date
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.household_medicine import (
    HouseholdMedicineCreateDto,
    HouseholdMedicineResponseDto,
    HouseholdMedicineUpdateDto,
)
from src.application.services.access_control import coerce_account_context, ensure_module_access
from src.application.services.safety_engine import calculate_household_medicine_status
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.episode_medication_plan_repository import (
    EpisodeMedicationPlanRepository,
)
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository

HOUSEHOLD_MEDICINE_ALREADY_EXISTS_MESSAGE = (
    "Такой препарат уже есть в аптечке. Обновите существующую упаковку или "
    "используйте «Новая упаковка»."
)


class HouseholdMedicineService:
    """Сервис упаковок в аптечке: добавление, вскрытие, список."""

    def __init__(
        self,
        household_repo: HouseholdMedicineRepository,
        family_repo: FamilyRepository,
        administration_repo: AdministrationEventRepository,
        plan_repo: EpisodeMedicationPlanRepository,
    ) -> None:
        self._repo = household_repo
        self._family_repo = family_repo
        self._administration_repo = administration_repo
        self._plan_repo = plan_repo

    async def _to_response(self, entity: HouseholdMedicine) -> HouseholdMedicineResponseDto:
        status = calculate_household_medicine_status(entity)
        return HouseholdMedicineResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            medicine_name=entity.medicine_name,
            medicine_form=entity.medicine_form,
            medicine_category=entity.medicine_category,
            medicine_concentration=entity.medicine_concentration,
            medicine_description=entity.medicine_description,
            medicine_dosage=entity.medicine_dosage,
            pediatric_dose_mg_per_kg_min=entity.pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=entity.pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=entity.pediatric_dose_note,
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

    async def get_by_id(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
    ) -> HouseholdMedicineResponseDto:
        current_account = coerce_account_context(current_account)
        ensure_module_access(current_account, "cabinet", "view")
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if entity.family_id != current_account.family_id:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        return await self._to_response(entity)

    async def get_by_family_id(
        self,
        current_account: AuthenticatedAccount,
    ) -> list[HouseholdMedicineResponseDto]:
        current_account = coerce_account_context(current_account)
        ensure_module_access(current_account, "cabinet", "view")
        if await self._family_repo.get_by_id(current_account.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(current_account.family_id)
        entities = sorted(
            entities,
            key=lambda item: (
                calculate_household_medicine_status(item)["status"].priority,
                item.expiry_date,
            ),
        )
        return [await self._to_response(e) for e in entities]

    async def create(
        self,
        current_account: AuthenticatedAccount,
        dto: HouseholdMedicineCreateDto,
    ) -> HouseholdMedicineResponseDto:
        current_account = coerce_account_context(current_account)
        ensure_module_access(current_account, "cabinet", "edit")
        if await self._family_repo.get_by_id(current_account.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        if dto.opened_at is not None and dto.opened_at.date() > date.today():
            raise ValidationError(
                "Дата вскрытия не может быть в будущем", code="OPENED_AT_IN_FUTURE"
            )
        medicine_name = (dto.medicine_name or "").strip()
        medicine_category = (dto.medicine_category or "").strip() or None
        medicine_form = (dto.medicine_form or "").strip() or medicine_category or ""
        if not medicine_name or not medicine_form:
            raise ValidationError(
                "Нужно указать название и форму или категорию препарата",
                code="MEDICINE_NAME_AND_FORM_REQUIRED",
            )
        medicine_concentration = dto.medicine_concentration
        medicine_description = dto.medicine_description
        medicine_dosage = dto.medicine_dosage
        pediatric_dose_mg_per_kg_min = dto.pediatric_dose_mg_per_kg_min
        pediatric_dose_mg_per_kg_max = dto.pediatric_dose_mg_per_kg_max
        pediatric_dose_note = dto.pediatric_dose_note
        opened_shelf_days = dto.opened_shelf_days

        existing_medicine = await self._repo.find_by_snapshot(
            current_account.family_id,
            medicine_name,
            medicine_form,
            medicine_concentration,
        )
        if existing_medicine is not None:
            raise ValidationError(
                HOUSEHOLD_MEDICINE_ALREADY_EXISTS_MESSAGE,
                code="HOUSEHOLD_MEDICINE_ALREADY_EXISTS",
            )
        entity = HouseholdMedicine(
            id=uuid4(),
            family_id=current_account.family_id,
            medicine_name=medicine_name,
            medicine_form=medicine_form,
            medicine_category=medicine_category,
            medicine_concentration=medicine_concentration,
            medicine_description=medicine_description,
            medicine_dosage=medicine_dosage,
            pediatric_dose_mg_per_kg_min=pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=pediatric_dose_note,
            expiry_date=dto.expiry_date,
            opened_at=dto.opened_at,
            opened_shelf_days=opened_shelf_days,
            comment=dto.comment,
        )
        created = await self._repo.add(entity)
        return await self._to_response(created)

    async def update(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
        dto: HouseholdMedicineUpdateDto,
    ) -> HouseholdMedicineResponseDto:
        current_account = coerce_account_context(current_account)
        ensure_module_access(current_account, "cabinet", "edit")
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if entity.family_id != current_account.family_id:
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
        medicine_category = entity.medicine_category
        medicine_concentration = entity.medicine_concentration
        medicine_description = entity.medicine_description
        medicine_dosage = entity.medicine_dosage
        pediatric_dose_mg_per_kg_min = entity.pediatric_dose_mg_per_kg_min
        pediatric_dose_mg_per_kg_max = entity.pediatric_dose_mg_per_kg_max
        pediatric_dose_note = entity.pediatric_dose_note

        pediatric_dose_mg_per_kg_min = (
            dto.pediatric_dose_mg_per_kg_min
            if "pediatric_dose_mg_per_kg_min" in fields_set
            else entity.pediatric_dose_mg_per_kg_min
        )
        pediatric_dose_mg_per_kg_max = (
            dto.pediatric_dose_mg_per_kg_max
            if "pediatric_dose_mg_per_kg_max" in fields_set
            else entity.pediatric_dose_mg_per_kg_max
        )
        pediatric_dose_note = (
            dto.pediatric_dose_note
            if "pediatric_dose_note" in fields_set
            else entity.pediatric_dose_note
        )

        medicine_name = dto.medicine_name if "medicine_name" in fields_set else entity.medicine_name
        medicine_category = (
            dto.medicine_category if "medicine_category" in fields_set else entity.medicine_category
        )
        medicine_form = dto.medicine_form if "medicine_form" in fields_set else entity.medicine_form
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

        resolved_category = (medicine_category or "").strip() or None
        resolved_form = (medicine_form or "").strip() or resolved_category or ""
        if not (medicine_name or "").strip() or not resolved_form:
            raise ValidationError(
                "Нужно указать название и форму или категорию препарата",
                code="MEDICINE_NAME_AND_FORM_REQUIRED",
            )
        duplicate = await self._repo.find_by_snapshot(
            current_account.family_id,
            (medicine_name or "").strip(),
            resolved_form,
            medicine_concentration,
        )
        if duplicate is not None and duplicate.id != entity.id:
            raise ValidationError(
                HOUSEHOLD_MEDICINE_ALREADY_EXISTS_MESSAGE,
                code="HOUSEHOLD_MEDICINE_ALREADY_EXISTS",
            )

        if opened_at is not None and opened_at.date() > date.today():
            raise ValidationError(
                "Дата вскрытия не может быть в будущем", code="OPENED_AT_IN_FUTURE"
            )
        entity = HouseholdMedicine(
            id=entity.id,
            family_id=entity.family_id,
            medicine_name=(medicine_name or "").strip(),
            medicine_form=resolved_form,
            medicine_category=resolved_category,
            medicine_concentration=medicine_concentration,
            medicine_description=medicine_description,
            medicine_dosage=medicine_dosage,
            pediatric_dose_mg_per_kg_min=pediatric_dose_mg_per_kg_min,
            pediatric_dose_mg_per_kg_max=pediatric_dose_mg_per_kg_max,
            pediatric_dose_note=pediatric_dose_note,
            expiry_date=expiry_date,
            opened_at=opened_at,
            opened_shelf_days=opened_shelf_days,
            comment=comment,
        )
        updated = await self._repo.update(entity)
        return await self._to_response(updated)

    async def delete(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        current_account = coerce_account_context(current_account)
        ensure_module_access(current_account, "cabinet", "edit")
        entity = await self._repo.get_by_id(id)
        if entity is None or entity.family_id != current_account.family_id:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        fallback_medicine_name = entity.medicine_name.strip()
        await self._administration_repo.clear_household_medicine_references(
            id,
            fallback_medicine_name,
        )
        await self._plan_repo.clear_household_medicine_references(
            id,
            fallback_medicine_name,
        )
        await self._repo.delete(id)
