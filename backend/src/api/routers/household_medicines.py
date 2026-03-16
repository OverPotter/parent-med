"""Роуты: домашняя аптечка."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_household_medicine_service
from src.application.dto.household_medicine import (
    HouseholdMedicineCreateDto,
    HouseholdMedicineResponseDto,
    HouseholdMedicineUpdateDto,
)
from src.application.services.household_medicine_service import HouseholdMedicineService

router = APIRouter(prefix="/household-medicines", tags=["household-medicines"])


@router.get("/{medicine_id}", response_model=HouseholdMedicineResponseDto)
async def get_household_medicine(
    medicine_id: UUID,
    service: HouseholdMedicineService = Depends(get_household_medicine_service),
) -> HouseholdMedicineResponseDto:
    """Получить упаковку по id."""
    return await service.get_by_id(medicine_id)


@router.get("", response_model=list[HouseholdMedicineResponseDto])
async def list_household_medicines(
    family_id: UUID,
    service: HouseholdMedicineService = Depends(get_household_medicine_service),
) -> list[HouseholdMedicineResponseDto]:
    """Список упаковок в аптечке семьи."""
    return await service.get_by_family_id(family_id)


@router.post("", response_model=HouseholdMedicineResponseDto, status_code=201)
async def create_household_medicine(
    dto: HouseholdMedicineCreateDto,
    service: HouseholdMedicineService = Depends(get_household_medicine_service),
) -> HouseholdMedicineResponseDto:
    """Добавить упаковку в аптечку (ручное добавление)."""
    return await service.create(dto)


@router.patch("/{medicine_id}", response_model=HouseholdMedicineResponseDto)
async def update_household_medicine(
    medicine_id: UUID,
    dto: HouseholdMedicineUpdateDto,
    service: HouseholdMedicineService = Depends(get_household_medicine_service),
) -> HouseholdMedicineResponseDto:
    """Обновить упаковку (вскрытие, место, комментарий)."""
    return await service.update(medicine_id, dto)


@router.delete("/{medicine_id}", status_code=204)
async def delete_household_medicine(
    medicine_id: UUID,
    service: HouseholdMedicineService = Depends(get_household_medicine_service),
) -> None:
    """Удалить упаковку из аптечки."""
    await service.delete(medicine_id)
