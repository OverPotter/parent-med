"""Роуты: записи роста."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_height_entry_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.height_entry import HeightEntryCreateDto, HeightEntryResponseDto
from src.application.services.height_entry_service import HeightEntryService

router = APIRouter(prefix="/height-entries", tags=["height-entries"])


@router.get("", response_model=list[HeightEntryResponseDto])
async def list_height_entries(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: HeightEntryService = Depends(get_height_entry_service),
) -> list[HeightEntryResponseDto]:
    return await service.get_by_child_id(child_id, current_account.family_id)


@router.get("/child/{child_id}/latest", response_model=HeightEntryResponseDto | None)
async def get_latest_height(
    child_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: HeightEntryService = Depends(get_height_entry_service),
) -> HeightEntryResponseDto | None:
    return await service.get_latest_for_child(child_id, current_account.family_id)


@router.post("", response_model=HeightEntryResponseDto, status_code=201)
async def create_height_entry(
    dto: HeightEntryCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: HeightEntryService = Depends(get_height_entry_service),
) -> HeightEntryResponseDto:
    return await service.create(dto, current_account.family_id)


@router.delete("/{entry_id}", status_code=204)
async def delete_height_entry(
    entry_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: HeightEntryService = Depends(get_height_entry_service),
) -> None:
    await service.delete(entry_id, current_account.family_id)
