"""Роуты: комментарии внутри эпизода болезни."""

from uuid import UUID

from fastapi import APIRouter, Depends

from src.api.deps import get_illness_comment_service
from src.api.deps.auth import get_current_account
from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.illness_comment import (
    IllnessCommentCreateDto,
    IllnessCommentResponseDto,
)
from src.application.services.illness_comment_service import IllnessCommentService

router = APIRouter(prefix="/illness-comments", tags=["illness-comments"])


@router.get("/{comment_id}", response_model=IllnessCommentResponseDto)
async def get_illness_comment(
    comment_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessCommentService = Depends(get_illness_comment_service),
) -> IllnessCommentResponseDto:
    return await service.get_by_id(comment_id, current_account.family_id)


@router.get("", response_model=list[IllnessCommentResponseDto])
async def list_illness_comments(
    episode_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessCommentService = Depends(get_illness_comment_service),
) -> list[IllnessCommentResponseDto]:
    return await service.get_by_episode_id(episode_id, current_account.family_id)


@router.post("", response_model=IllnessCommentResponseDto, status_code=201)
async def create_illness_comment(
    dto: IllnessCommentCreateDto,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessCommentService = Depends(get_illness_comment_service),
) -> IllnessCommentResponseDto:
    return await service.create(dto, current_account.family_id)


@router.delete("/{comment_id}", status_code=204)
async def delete_illness_comment(
    comment_id: UUID,
    current_account: AuthenticatedAccount = Depends(get_current_account),
    service: IllnessCommentService = Depends(get_illness_comment_service),
) -> None:
    await service.delete(comment_id, current_account.family_id)
