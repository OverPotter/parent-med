"""Общие проверки состояния family invite."""

from datetime import UTC, datetime

from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.family import Family
from src.domain.entities.family_invite import FamilyInvite
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.family_invite_repository import FamilyInviteRepository
from src.domain.repositories.family_repository import FamilyRepository


async def ensure_reusable_family_invite(
    invite: FamilyInvite,
    *,
    account_repo: AccountRepository,
    invite_repo: FamilyInviteRepository,
) -> FamilyInvite:
    """Вернуть invite в активное состояние, если его связанный аккаунт уже удалён."""

    if invite.accepted_at is None:
        return invite
    if invite.accepted_by_account_id is None:
        raise ValidationError("Приглашение уже использовано", code="FAMILY_INVITE_ALREADY_USED")

    accepted_account = await account_repo.get_by_id(invite.accepted_by_account_id)
    if accepted_account is None:
        raise ValidationError("Приглашение уже использовано", code="FAMILY_INVITE_ALREADY_USED")
    if accepted_account.family_role != "deleted":
        raise ValidationError("Приглашение уже использовано", code="FAMILY_INVITE_ALREADY_USED")

    reopened = FamilyInvite(
        id=invite.id,
        family_id=invite.family_id,
        created_by_account_id=invite.created_by_account_id,
        token_hash=invite.token_hash,
        family_role=invite.family_role,
        created_at=invite.created_at,
        expires_at=invite.expires_at,
        accepted_at=None,
        accepted_by_account_id=None,
    )
    return await invite_repo.update(reopened)


async def resolve_active_family_invite(
    invite: FamilyInvite,
    *,
    account_repo: AccountRepository,
    invite_repo: FamilyInviteRepository,
    family_repo: FamilyRepository,
) -> tuple[FamilyInvite, Family]:
    """Вернуть активный invite и его семью либо поднять доменную ошибку."""

    invite = await ensure_reusable_family_invite(
        invite,
        account_repo=account_repo,
        invite_repo=invite_repo,
    )
    if invite.expires_at <= datetime.now(UTC):
        raise ValidationError("Срок действия приглашения истёк", code="FAMILY_INVITE_EXPIRED")
    family = await family_repo.get_by_id(invite.family_id)
    if family is None:
        raise NotFoundError("Семья не найдена", resource="family")
    return invite, family

