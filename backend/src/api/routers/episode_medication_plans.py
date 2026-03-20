"""Роуты: guided-планы лекарства внутри эпизода."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_episode_medication_plan_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.episode_medication_plan import (
    EpisodeMedicationPlanCreateDto,
    EpisodeMedicationPlanResponseDto,
    EpisodeMedicationPlanUpdateDto,
)
from src.application.services.episode_medication_plan_service import (
    EpisodeMedicationPlanService,
)

router = APIRouter(prefix="/episode-medication-plans", tags=["episode-medication-plans"])


@router.get("", response_model=list[EpisodeMedicationPlanResponseDto])
async def list_episode_medication_plans(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: EpisodeMedicationPlanService = Depends(get_episode_medication_plan_service),
) -> list[EpisodeMedicationPlanResponseDto]:
    """Все планы лекарства по эпизоду."""
    return await service.get_by_episode_id(episode_id, current_account.family_id)


@router.post("", response_model=EpisodeMedicationPlanResponseDto, status_code=201)
async def create_episode_medication_plan(
    dto: EpisodeMedicationPlanCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: EpisodeMedicationPlanService = Depends(get_episode_medication_plan_service),
) -> EpisodeMedicationPlanResponseDto:
    """Создать план лекарства внутри эпизода."""
    return await service.create(dto, current_account.family_id)


@router.patch("/{plan_id}", response_model=EpisodeMedicationPlanResponseDto)
async def update_episode_medication_plan(
    plan_id: UUID,
    dto: EpisodeMedicationPlanUpdateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: EpisodeMedicationPlanService = Depends(get_episode_medication_plan_service),
) -> EpisodeMedicationPlanResponseDto:
    """Обновить план лекарства."""
    return await service.update(plan_id, dto, current_account.family_id)


@router.delete("/{plan_id}", status_code=204)
async def delete_episode_medication_plan(
    plan_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: EpisodeMedicationPlanService = Depends(get_episode_medication_plan_service),
) -> None:
    """Удалить план лекарства."""
    await service.delete(plan_id, current_account.family_id)
