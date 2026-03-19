"""Сервис базовой регистрации и авторизации."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from src.application.dto.auth import (
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    LoginDto,
    RefreshDto,
    RegisterDto,
)
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import ForbiddenError, UnauthorizedError, ValidationError
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from src.domain.entities.account import Account
from src.domain.entities.account_session import AccountSession
from src.domain.entities.family import Family

_DEFAULT_FAMILY_NAME = "Моя семья"


class AuthService(BaseAuthService):
    """Регистрация, логин и проверка Bearer-сессии."""

    async def _create_auth_response(self, account: Account, family: Family) -> AuthResponseDto:
        now = datetime.now(UTC)
        session_id = uuid4()
        refresh_expires_at = now + timedelta(days=settings.refresh_token_ttl_days)
        refresh_token = create_refresh_token(
            account_id=account.id,
            family_id=account.family_id,
            session_id=session_id,
            expires_at=refresh_expires_at,
        )
        session = AccountSession(
            id=session_id,
            account_id=account.id,
            token_hash=hash_session_token(refresh_token),
            created_at=now,
            expires_at=refresh_expires_at,
        )
        await self._session_repo.add(session)
        return AuthResponseDto(
            access_token=create_access_token(
                account_id=account.id,
                email=account.email,
                family_id=account.family_id,
            ),
            refresh_token=refresh_token,
            account=self._account_to_response(account),
            family=self._family_to_response(family),
        )

    async def signup(self, dto: RegisterDto) -> AuthResponseDto:
        email = dto.email.strip().lower()
        if await self._account_repo.get_by_email(email) is not None:
            raise ValidationError(
                "Аккаунт с таким email уже существует",
                code="ACCOUNT_ALREADY_EXISTS",
                status_code=409,
            )
        family = Family(id=uuid4(), name=_DEFAULT_FAMILY_NAME)
        created_family = await self._family_repo.add(family)
        account = Account(
            id=uuid4(),
            email=email,
            password_hash=hash_password(dto.password),
            family_id=created_family.id,
            push_before_reminder_minutes=10,
            created_at=datetime.now(UTC),
        )
        created_account = await self._account_repo.add(account)
        return await self._create_auth_response(created_account, created_family)

    async def register(self, dto: RegisterDto) -> AuthResponseDto:
        return await self.signup(dto)

    async def signin(self, dto: LoginDto) -> AuthResponseDto:
        email = dto.email.strip().lower()
        account = await self._account_repo.get_by_email(email)
        if not account or not verify_password(dto.password, account.password_hash):
            raise UnauthorizedError("Неверный email или пароль", code="INVALID_CREDENTIALS")
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            raise ForbiddenError("У аккаунта не найдена семья", code="FAMILY_NOT_LINKED")
        return await self._create_auth_response(account, family)

    async def login(self, dto: LoginDto) -> AuthResponseDto:
        return await self.signin(dto)

    async def get_current_account(self, token: str) -> AuthenticatedAccount:
        payload = decode_access_token(token)
        account_id = UUID(str(payload["sub"]))
        family_id = UUID(str(payload["family_id"]))
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()
        return AuthenticatedAccount(
            id=account.id,
            email=account.email,
            family_id=family_id,
        )

    async def get_me(self, account_id: UUID, family_id: UUID) -> AuthStateResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        family = await self._family_repo.get_by_id(family_id)
        if account is None or family is None:
            raise UnauthorizedError()
        return AuthStateResponseDto(
            account=self._account_to_response(account),
            family=self._family_to_response(family),
        )

    async def refresh(self, dto: RefreshDto) -> AuthResponseDto:
        payload = decode_refresh_token(dto.refresh_token)
        session_id = UUID(str(payload["sid"]))
        account_id = UUID(str(payload["sub"]))
        session = await self._session_repo.get_by_id(session_id)
        if session is None:
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
        if session.account_id != account_id:
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
        if session.token_hash != hash_session_token(dto.refresh_token):
            raise UnauthorizedError(code="INVALID_REFRESH_TOKEN")
        if session.expires_at <= datetime.now(UTC):
            await self._session_repo.delete(session.id)
            raise UnauthorizedError(code="TOKEN_EXPIRED")

        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            raise ForbiddenError("У аккаунта не найдена семья", code="FAMILY_NOT_LINKED")

        await self._session_repo.delete(session.id)
        return await self._create_auth_response(account, family)

    async def logout(self, account_id: UUID) -> None:
        await self._session_repo.delete_by_account_id(account_id)
