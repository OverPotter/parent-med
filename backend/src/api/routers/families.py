"""Роуты: семьи."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_current_account, get_family_service
from src.application.dto.auth import AccountResponseDto, AuthenticatedAccount
from src.application.dto.family import (
    FamilyCreateDto,
    FamilyMemberUpdateDto,
    FamilyResponseDto,
    FamilyUpdateDto,
)
from src.application.services.family_service import FamilyService
from src.core.exceptions import ValidationError

router = APIRouter(prefix="/families", tags=["families"])


@router.get("", response_model=list[FamilyResponseDto])
async def list_families(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> list[FamilyResponseDto]:
    """Получить текущую семью аккаунта в виде списка из одного элемента."""
    return [await service.get_by_id(account.family_id)]


@router.get("/me", response_model=FamilyResponseDto)
async def get_my_family(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Получить семью текущего аккаунта."""
    return await service.get_by_id(account.family_id)


@router.get("/me/members", response_model=list[AccountResponseDto])
async def get_my_family_members(
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> list[AccountResponseDto]:
    """Получить список аккаунтов внутри текущей семьи."""
    return await service.list_members_for_account(account.family_id)


@router.patch("/me/members/{member_account_id}", response_model=AccountResponseDto)
async def update_family_member(
    member_account_id: UUID,
    dto: FamilyMemberUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> AccountResponseDto:
    """Обновить роль участника текущей семьи."""
    return await service.update_member_for_account(
        member_account_id=member_account_id,
        dto=dto,
        current_account_id=account.id,
        current_family_id=account.family_id,
        current_family_role=account.family_role,
    )


@router.delete("/me/members/{member_account_id}", status_code=204)
async def delete_family_member(
    member_account_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> None:
    """Удалить участника из текущей семьи."""
    await service.delete_member_for_account(
        member_account_id=member_account_id,
        current_account_id=account.id,
        current_family_id=account.family_id,
        current_family_role=account.family_role,
    )


@router.get("/{family_id}", response_model=FamilyResponseDto)
async def get_family(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Получить семью по id."""
    return await service.get_by_id_for_account(family_id, account.family_id)


@router.post("", response_model=FamilyResponseDto, status_code=201)
async def create_family(
    dto: FamilyCreateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Создать семью."""
    raise ValidationError(
        "Семья создаётся при регистрации аккаунта",
        code="FAMILY_CREATED_ON_REGISTER",
        status_code=409,
    )


@router.patch("/me", response_model=FamilyResponseDto)
async def update_my_family(
    dto: FamilyUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Обновить семью текущего аккаунта."""
    return await service.update(account.family_id, dto)


@router.patch("/{family_id}", response_model=FamilyResponseDto)
async def update_family(
    family_id: UUID,
    dto: FamilyUpdateDto,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> FamilyResponseDto:
    """Обновить семью."""
    return await service.update_for_account(family_id, dto, account.family_id)


@router.delete("/{family_id}", status_code=204)
async def delete_family(
    family_id: UUID,
    account: AuthenticatedAccount = Depends(get_current_account),
    service: FamilyService = Depends(get_family_service),
) -> None:
    """Удалить семью."""
    if family_id != account.family_id:
        raise ValidationError(
            "Нет доступа к чужой семье", code="FOREIGN_FAMILY_ACCESS", status_code=403
        )
    raise ValidationError(
        "Семья создаётся вместе с аккаунтом и не удаляется отдельно",
        code="FAMILY_DELETE_DISABLED",
        status_code=409,
    )
