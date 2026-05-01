"""Сервис приглашений в семью."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from src.application.dto.family_invite import (
    FamilyInviteCreateDto,
    FamilyInvitePreviewResponseDto,
    FamilyInviteResponseDto,
)
from src.application.services.family_invite_state import resolve_active_family_invite
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.core.config import settings
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.core.security import generate_session_token, hash_session_token
from src.domain.entities.family_invite import FamilyInvite
from src.domain.entities.family_roles import normalize_family_role
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.family_invite_repository import FamilyInviteRepository
from src.domain.repositories.family_repository import FamilyRepository


class FamilyInviteService:
    """Создание и проверка invite-ссылок для семьи."""

    INVITE_TTL_DAYS = 30
    ALLOWED_ROLES = {"member"}

    def __init__(
        self,
        family_repo: FamilyRepository,
        account_repo: AccountRepository,
        invite_repo: FamilyInviteRepository,
    ) -> None:
        self._family_repo = family_repo
        self._account_repo = account_repo
        self._invite_repo = invite_repo

    async def create_for_account(
        self,
        family_id: UUID,
        current_account_id: UUID,
        dto: FamilyInviteCreateDto,
    ) -> FamilyInviteResponseDto:
        family = await self._family_repo.get_by_id(family_id)
        if not family:
            raise NotFoundError("Семья не найдена", resource="family")
        if family.owner_account_id != current_account_id:
            raise ForbiddenError("Только владелец семьи может приглашать новых участников")
        if not resolve_family_plan_policy(family).can_invite_members:
            raise ValidationError(
                "Приглашения доступны только в Plus",
                code="PLUS_REQUIRED_FOR_FAMILY_INVITES",
            )
        invite_role = normalize_family_role(dto.family_role)
        if invite_role not in self.ALLOWED_ROLES:
            raise ValidationError("Можно приглашать только участников с ролью member")

        raw_token = generate_session_token()
        now = datetime.now(UTC)
        entity = FamilyInvite(
            id=uuid4(),
            family_id=family_id,
            created_by_account_id=current_account_id,
            token_hash=hash_session_token(raw_token),
            family_role=invite_role,
            created_at=now,
            expires_at=now + timedelta(days=self.INVITE_TTL_DAYS),
            accepted_at=None,
            accepted_by_account_id=None,
        )
        created = await self._invite_repo.add(entity)
        return FamilyInviteResponseDto(
            token=raw_token,
            family_id=family.id,
            family_name=family.name,
            family_role=created.family_role,
            invite_path=f"/join-family?token={raw_token}",
            expires_at=created.expires_at,
        )

    async def get_preview(self, token: str) -> FamilyInvitePreviewResponseDto:
        invite, family = await self._require_active_invite(token)
        return FamilyInvitePreviewResponseDto(
            family_id=family.id,
            family_name=family.name,
            family_role=invite.family_role,
            expires_at=invite.expires_at,
        )

    async def get_latest_preview_for_dev(self) -> FamilyInvitePreviewResponseDto:
        if not settings.is_local_environment:
            raise NotFoundError("Приглашение не найдено", resource="family_invite")
        invite = await self._invite_repo.get_latest_active()
        if not invite:
            raise NotFoundError("Приглашение не найдено", resource="family_invite")
        family = await self._family_repo.get_by_id(invite.family_id)
        if not family:
            raise NotFoundError("Семья не найдена", resource="family")
        return FamilyInvitePreviewResponseDto(
            family_id=family.id,
            family_name=family.name,
            family_role=invite.family_role,
            expires_at=invite.expires_at,
        )

    async def get_active_invite_for_signup(self, token: str) -> tuple[FamilyInvite, str]:
        invite, family = await self._require_active_invite(token)
        return invite, family.name

    async def accept(self, invite: FamilyInvite, account_id: UUID) -> None:
        if invite.accepted_at is not None:
            raise ValidationError("Приглашение уже использовано", code="FAMILY_INVITE_ALREADY_USED")
        updated = FamilyInvite(
            id=invite.id,
            family_id=invite.family_id,
            created_by_account_id=invite.created_by_account_id,
            token_hash=invite.token_hash,
            family_role=invite.family_role,
            created_at=invite.created_at,
            expires_at=invite.expires_at,
            accepted_at=datetime.now(UTC),
            accepted_by_account_id=account_id,
        )
        await self._invite_repo.update(updated)

    async def _require_active_invite(self, token: str) -> tuple[FamilyInvite, object]:
        invite = await self._invite_repo.get_by_token_hash(hash_session_token(token))
        if not invite:
            raise NotFoundError("Приглашение не найдено", resource="family_invite")
        return await self._require_active_invite_entity(invite)

    async def _require_active_invite_entity(
        self, invite: FamilyInvite
    ) -> tuple[FamilyInvite, object]:
        return await resolve_active_family_invite(
            invite,
            account_repo=self._account_repo,
            invite_repo=self._invite_repo,
            family_repo=self._family_repo,
        )
