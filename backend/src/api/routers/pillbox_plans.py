"""Роуты семейной таблетницы."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_pillbox_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.pillbox import (
    PillboxDoseLogCreateDto,
    PillboxPlanCreateDto,
    PillboxPlanResponseDto,
    PillboxPlanSummaryDto,
    PillboxPlanUpdateDto,
)
from src.application.services.pillbox_service import PillboxService

router = APIRouter(prefix="/pillbox-plans", tags=["pillbox-plans"])


@router.get("", response_model=list[PillboxPlanSummaryDto])
async def list_pillbox_plans(
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> list[PillboxPlanSummaryDto]:
    """Все family-level планы таблетницы."""
    return await service.list_by_family_id(
        current_account.family_id,
        current_account.preferred_language,
    )


@router.get("/{plan_id}", response_model=PillboxPlanResponseDto)
async def get_pillbox_plan(
    plan_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> PillboxPlanResponseDto:
    """Получить полный plan detail."""
    return await service.get_by_id(plan_id, current_account.family_id)


@router.post("", response_model=PillboxPlanResponseDto, status_code=201)
async def create_pillbox_plan(
    dto: PillboxPlanCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> PillboxPlanResponseDto:
    """Создать семейный pillbox plan."""
    return await service.create(dto, current_account.id, current_account.family_id)


@router.patch("/{plan_id}", response_model=PillboxPlanResponseDto)
async def update_pillbox_plan(
    plan_id: UUID,
    dto: PillboxPlanUpdateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> PillboxPlanResponseDto:
    """Обновить family-level plan целиком."""
    return await service.update(plan_id, dto, current_account.id, current_account.family_id)


@router.delete("/{plan_id}", status_code=204)
async def delete_pillbox_plan(
    plan_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> None:
    """Удалить family-level plan."""
    await service.delete(plan_id, current_account.family_id)


@router.post(
    "/{plan_id}/medications/{medication_id}/take",
    response_model=PillboxPlanSummaryDto,
)
async def log_pillbox_dose(
    plan_id: UUID,
    medication_id: UUID,
    dto: PillboxDoseLogCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: PillboxService = Depends(get_pillbox_service),
) -> PillboxPlanSummaryDto:
    """Отметить приём лекарства по плану таблетницы."""
    return await service.log_dose(
        plan_id,
        medication_id,
        dto,
        current_account.id,
        current_account.display_name,
        current_account.family_id,
        current_account.preferred_language,
    )
