"""Базовый контракт auth-сервиса."""

from abc import ABC, abstractmethod
from uuid import UUID

from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    ChangePasswordDto,
    LoginDto,
    RecoverPasswordByCodeDto,
    RefreshDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateLanguageDto,
    UpdateRecoveryCodeDto,
)
from src.application.dto.family import FamilyResponseDto
from src.application.dto.family_access import FamilyAccessPolicyDto
from src.domain.entities.account import Account
from src.domain.entities.account_identity import needs_profile_completion, resolve_display_name
from src.domain.entities.family import Family
from src.domain.entities.family_access import serialize_family_access_policy
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.family_invite_repository import FamilyInviteRepository
from src.domain.repositories.family_repository import FamilyRepository


class BaseAuthService(ABC):
    """Базовый auth-сервис с общими мапперами и контрактом."""

    PREMIUM_PLAN_CODES = {"plus", "pro"}
    ACTIVE_SUBSCRIPTION_STATUSES = {"trialing", "active", "grace"}

    def __init__(
        self,
        account_repo: AccountRepository,
        session_repo: AccountSessionRepository,
        family_repo: FamilyRepository,
        family_invite_repo: FamilyInviteRepository,
    ) -> None:
        self._account_repo = account_repo
        self._session_repo = session_repo
        self._family_repo = family_repo
        self._family_invite_repo = family_invite_repo

    def _is_family_premium_active(self, entity: Family) -> bool:
        return (
            entity.plan_code in self.PREMIUM_PLAN_CODES
            and entity.subscription_status in self.ACTIVE_SUBSCRIPTION_STATUSES
        )

    def _account_to_response(self, entity: Account) -> AccountResponseDto:
        return AccountResponseDto(
            id=entity.id,
            email=entity.email,
            family_id=entity.family_id,
            display_name=resolve_display_name(entity.display_name),
            needs_profile_completion=needs_profile_completion(entity.display_name),
            has_recovery_code=bool(entity.recovery_code_hash),
            relationship_label=entity.relationship_label,
            phone=entity.phone,
            preferred_language=entity.preferred_language,
            family_role=entity.family_role,
            access_policy=FamilyAccessPolicyDto.model_validate(
                serialize_family_access_policy(entity.access_policy)
            ),
        )

    def _family_to_response(self, entity: Family) -> FamilyResponseDto:
        return FamilyResponseDto(
            id=entity.id,
            name=entity.name,
            cabinet_member_account_ids=list(entity.cabinet_member_account_ids),
            owner_account_id=entity.owner_account_id,
            billing_account_id=entity.billing_account_id,
            free_primary_child_id=entity.free_primary_child_id,
            plan_code=entity.plan_code,  # type: ignore[arg-type]
            subscription_status=entity.subscription_status,  # type: ignore[arg-type]
            subscription_provider=entity.subscription_provider,
            subscription_product_id=entity.subscription_product_id,
            subscription_expires_at=entity.subscription_expires_at,
            premium_active=self._is_family_premium_active(entity),
        )

    @abstractmethod
    async def signup(self, dto: RegisterDto) -> AuthResponseDto:
        """Зарегистрировать аккаунт и выдать токены."""

    @abstractmethod
    async def signin(self, dto: LoginDto) -> AuthResponseDto:
        """Авторизовать пользователя и выдать токены."""

    @abstractmethod
    async def refresh(self, dto: RefreshDto) -> AuthResponseDto:
        """Обновить JWT-пару по refresh token."""

    @abstractmethod
    async def get_current_account(self, token: str) -> AuthenticatedAccount:
        """Вернуть текущий auth-контекст по access token."""

    @abstractmethod
    async def get_me(self, account_id: UUID, family_id: UUID) -> AuthStateResponseDto:
        """Вернуть текущий аккаунт и его семью."""

    @abstractmethod
    async def logout(self, account_id: UUID, refresh_token: str | None = None) -> None:
        """Закрыть текущую refresh-сессию аккаунта."""

    @abstractmethod
    async def delete_me(self, account_id: UUID) -> None:
        """Удалить текущий аккаунт."""

    @abstractmethod
    async def delete_family(self, account_id: UUID) -> None:
        """Удалить семью текущего admin (мягко деактивировать все аккаунты)."""

    @abstractmethod
    async def change_password(
        self, account_id: UUID, dto: ChangePasswordDto, refresh_token: str | None = None
    ) -> None:
        """Сменить пароль текущего аккаунта."""

    @abstractmethod
    async def update_recovery_code(self, account_id: UUID, dto: UpdateRecoveryCodeDto) -> None:
        """Настроить recovery code для текущего аккаунта."""

    @abstractmethod
    async def reset_password_by_recovery_code(self, dto: RecoverPasswordByCodeDto) -> None:
        """Сбросить пароль по email и recovery code."""

    @abstractmethod
    async def update_language(self, account_id: UUID, dto: UpdateLanguageDto) -> AccountResponseDto:
        """Обновить предпочитаемый язык аккаунта."""

    @abstractmethod
    async def update_profile(
        self, account_id: UUID, dto: UpdateAccountProfileDto
    ) -> AccountResponseDto:
        """Обновить профиль текущего аккаунта."""

    @abstractmethod
    async def accept_family_invite(self, account_id: UUID, token: str) -> AuthResponseDto:
        """Принять приглашение в другую семью для существующего аккаунта."""
