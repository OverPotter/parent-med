"""Базовый контракт auth-сервиса."""

from abc import ABC, abstractmethod
from uuid import UUID

from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    LoginDto,
    RefreshDto,
    RegisterDto,
)
from src.application.dto.family import FamilyResponseDto
from src.domain.entities.account import Account
from src.domain.entities.family import Family
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.family_repository import FamilyRepository


class BaseAuthService(ABC):
    """Базовый auth-сервис с общими мапперами и контрактом."""

    def __init__(
        self,
        account_repo: AccountRepository,
        session_repo: AccountSessionRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._account_repo = account_repo
        self._session_repo = session_repo
        self._family_repo = family_repo

    def _account_to_response(self, entity: Account) -> AccountResponseDto:
        return AccountResponseDto(
            id=entity.id,
            email=entity.email,
            family_id=entity.family_id,
        )

    def _family_to_response(self, entity: Family) -> FamilyResponseDto:
        return FamilyResponseDto(id=entity.id, name=entity.name)

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
    async def logout(self, account_id: UUID) -> None:
        """Закрыть активные сессии аккаунта."""
