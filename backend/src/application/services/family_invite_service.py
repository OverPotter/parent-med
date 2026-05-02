"""Сервис приглашений в семью."""

import secrets
import string
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

    INVITE_TTL_HOURS = 3
    ALLOWED_ROLES = {"member"}
    DEV_INVITE_TOKEN_LENGTH = 8
    DEV_INVITE_ALPHABET = "".join(
        character
        for character in string.ascii_uppercase + string.digits
        if character not in {"0", "O", "1", "I"}
    )

    def __init__(
        self,
        family_repo: FamilyRepository,
        account_repo: AccountRepository,
        invite_repo: FamilyInviteRepository,
    ) -> None:
        self._family_repo = family_repo
        self._account_repo = account_repo
        self._invite_repo = invite_repo

    def _generate_invite_token(self) -> str:
        if settings.is_local_environment:
            return "".join(
                secrets.choice(self.DEV_INVITE_ALPHABET)
                for _ in range(self.DEV_INVITE_TOKEN_LENGTH)
            )
        return generate_session_token()

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

        raw_token = self._generate_invite_token()
        now = datetime.now(UTC)
        await self._invite_repo.delete_for_family(family_id)
        entity = FamilyInvite(
            id=uuid4(),
            family_id=family_id,
            created_by_account_id=current_account_id,
            token_hash=hash_session_token(raw_token),
            family_role=invite_role,
            created_at=now,
            expires_at=now + timedelta(hours=self.INVITE_TTL_HOURS),
            accepted_at=None,
            accepted_by_account_id=None,
        )
        created = await self._invite_repo.add(entity)
        return FamilyInviteResponseDto(
            token=raw_token,
            family_id=family.id,
            family_name=family.name,
            family_role=created.family_role,
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
