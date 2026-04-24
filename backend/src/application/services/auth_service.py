"""Сервис базовой регистрации и авторизации."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from src.application.dto.auth import (
    AccountResponseDto,
    AuthenticatedAccount,
    AuthResponseDto,
    AuthStateResponseDto,
    ChangePasswordDto,
    LoginDto,
    RecoverPasswordResetDto,
    RecoverPasswordVerifyDto,
    RecoverPasswordVerifyResponseDto,
    RefreshDto,
    RegisterDto,
    UpdateAccountProfileDto,
    UpdateLanguageDto,
)
from src.application.services.base_auth_service import BaseAuthService
from src.core.config import settings
from src.core.exceptions import ForbiddenError, UnauthorizedError, ValidationError
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from src.domain.entities.account import Account, copy_account
from src.domain.entities.account_session import AccountSession
from src.domain.entities.family import Family
from src.domain.entities.family_access import build_default_family_access_policy
from src.domain.entities.family_invite import FamilyInvite
from src.domain.entities.family_roles import is_family_admin, normalize_family_role
from src.domain.entities.password_recovery_token import (
    PasswordRecoveryToken,
    copy_password_recovery_token,
)
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.parent_repository import ParentRepository
from src.domain.repositories.password_recovery_token_repository import (
    PasswordRecoveryTokenRepository,
)

_DEFAULT_FAMILY_NAME = "Моя семья"


class AuthService(BaseAuthService):
    """Регистрация, логин и проверка Bearer-сессии."""

    def __init__(
        self,
        account_repo,
        session_repo,
        family_repo,
        family_invite_repo,
        child_repo: ChildRepository | None = None,
        household_repo: HouseholdMedicineRepository | None = None,
        parent_repo: ParentRepository | None = None,
        recovery_token_repo: PasswordRecoveryTokenRepository | None = None,
    ) -> None:
        super().__init__(
            account_repo=account_repo,
            session_repo=session_repo,
            family_repo=family_repo,
            family_invite_repo=family_invite_repo,
        )
        self._child_repo = child_repo
        self._household_repo = household_repo
        self._parent_repo = parent_repo
        self._recovery_token_repo = recovery_token_repo

    def _normalize_recovery_display_name(self, value: str) -> str:
        return " ".join(value.strip().split()).casefold()

    async def _create_auth_response(
        self,
        account: Account,
        family: Family,
        remember_me: bool,
    ) -> AuthResponseDto:
        now = datetime.now(UTC)
        session_id = uuid4()
        refresh_ttl_days = (
            settings.refresh_token_ttl_days_remember_me
            if remember_me
            else settings.refresh_token_ttl_days
        )
        refresh_expires_at = now + timedelta(days=refresh_ttl_days)
        refresh_token = create_refresh_token(
            account_id=account.id,
            family_id=account.family_id,
            session_id=session_id,
            expires_at=refresh_expires_at,
            remember_me=remember_me,
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
                login=account.login,
                family_id=account.family_id,
            ),
            refresh_token=refresh_token,
            account=self._account_to_response(account),
            family=self._family_to_response(family),
            remember_me=remember_me,
        )

    async def signup(self, dto: RegisterDto) -> AuthResponseDto:
        login = dto.login.strip()
        if await self._account_repo.get_by_login(login) is not None:
            raise ValidationError(
                "Аккаунт с таким логином уже существует",
                code="ACCOUNT_ALREADY_EXISTS",
                status_code=409,
            )
        email = dto.email.strip().lower() if dto.email else None
        if email and await self._account_repo.get_by_email(email) is not None:
            raise ValidationError(
                "Аккаунт с таким email уже существует",
                code="ACCOUNT_EMAIL_ALREADY_EXISTS",
                status_code=409,
            )
        family_role = "admin"
        invite: FamilyInvite | None = None
        family_name = _DEFAULT_FAMILY_NAME
        if dto.invite_token:
            invite = await self._family_invite_repo.get_by_token_hash(
                hash_session_token(dto.invite_token)
            )
            if not invite:
                raise ValidationError("Приглашение не найдено", code="FAMILY_INVITE_NOT_FOUND")
            if invite.accepted_at is not None:
                raise ValidationError(
                    "Приглашение уже использовано",
                    code="FAMILY_INVITE_ALREADY_USED",
                )
            if invite.expires_at <= datetime.now(UTC):
                raise ValidationError(
                    "Срок действия приглашения истёк",
                    code="FAMILY_INVITE_EXPIRED",
                )
            created_family = await self._family_repo.get_by_id(invite.family_id)
            if created_family is None:
                raise ValidationError(
                    "Семья по приглашению не найдена",
                    code="FAMILY_INVITE_INVALID",
                )
            family_role = normalize_family_role(invite.family_role)
            family_name = created_family.name
        else:
            family = Family(id=uuid4(), name=family_name)
            created_family = await self._family_repo.add(family)
        account = Account(
            id=uuid4(),
            login=login,
            email=email,
            password_hash=hash_password(dto.password),
            family_id=created_family.id,
            display_name=dto.display_name,
            relationship_label=(dto.relationship_label or "").strip() or None,
            phone=(dto.phone or "").strip() or None,
            preferred_language=dto.preferred_language,
            family_role=family_role,
            push_before_reminder_minutes=10,
            children_push_enabled=True,
            pillbox_push_enabled=True,
            pillbox_push_before_reminder_minutes=10,
            cabinet_notify_10_days=True,
            cabinet_notify_7_days=True,
            cabinet_notify_3_days=True,
            cabinet_notify_1_day=True,
            live_activity_sleep_enabled=True,
            live_activity_feeding_enabled=True,
            live_activity_illness_enabled=True,
            created_at=datetime.now(UTC),
            access_policy=build_default_family_access_policy(),
        )
        created_account = await self._account_repo.add(account)
        if invite is not None:
            invite.accepted_at = datetime.now(UTC)
            invite.accepted_by_account_id = created_account.id
            await self._family_invite_repo.update(invite)
        return await self._create_auth_response(
            created_account,
            created_family,
            remember_me=dto.remember_me,
        )

    async def register(self, dto: RegisterDto) -> AuthResponseDto:
        return await self.signup(dto)

    async def signin(self, dto: LoginDto) -> AuthResponseDto:
        login = dto.login.strip()
        account = await self._account_repo.get_by_login(login)
        if not account or not verify_password(dto.password, account.password_hash):
            raise UnauthorizedError("Неверный логин или пароль", code="INVALID_CREDENTIALS")
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            raise ForbiddenError("У аккаунта не найдена семья", code="FAMILY_NOT_LINKED")
        return await self._create_auth_response(account, family, remember_me=dto.remember_me)

    async def login(self, dto: LoginDto) -> AuthResponseDto:
        return await self.signin(dto)

    async def get_current_account(self, token: str) -> AuthenticatedAccount:
        payload = decode_access_token(token)
        account_id = UUID(str(payload["sub"]))
        family_id = UUID(str(payload["family_id"]))
        account = await self._account_repo.get_by_id(account_id)
        if account is None or account.family_role == "deleted":
            raise UnauthorizedError()
        return AuthenticatedAccount(
            id=account.id,
            login=account.login,
            email=account.email,
            family_id=family_id,
            display_name=account.display_name,
            relationship_label=account.relationship_label,
            phone=account.phone,
            preferred_language=account.preferred_language,
            family_role=account.family_role,
            access_policy=self._account_to_response(account).access_policy,
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
        remember_me = bool(int(payload.get("rm", 0)))
        return await self._create_auth_response(account, family, remember_me=remember_me)

    async def logout(self, account_id: UUID) -> None:
        await self._session_repo.delete_by_account_id(account_id)

    async def _soft_delete_account(self, account: Account) -> None:
        deleted_login = f"deleted-{account.id.hex[:12]}"
        await self._account_repo.update(
            copy_account(
                account,
                login=deleted_login,
                email=None,
                password_hash=hash_password(uuid4().hex),
                display_name="Deleted user",
                relationship_label=None,
                phone=None,
                family_role="deleted",
            )
        )

    async def delete_me(self, account_id: UUID) -> None:
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()

        family_accounts = await self._account_repo.list_by_family_id(account.family_id)
        family = await self._family_repo.get_by_id(account.family_id)
        active_accounts = [item for item in family_accounts if item.family_role != "deleted"]
        active_admins = [item for item in active_accounts if is_family_admin(item.family_role)]
        if is_family_admin(account.family_role) and len(active_admins) <= 1:
            raise ValidationError(
                "Нельзя удалить последнего администратора семьи",
                code="LAST_ADMIN_REQUIRED",
            )
        if family is not None and family.billing_account_id == account.id:
            raise ValidationError(
                "Нельзя удалить аккаунт, пока на нём привязана семейная подписка",
                code="BILLING_OWNER_TRANSFER_REQUIRED",
            )

        await self._session_repo.delete_by_account_id(account.id)
        await self._soft_delete_account(account)

    async def delete_family(self, account_id: UUID) -> None:
        account = await self._account_repo.get_by_id(account_id)
        if account is None or account.family_role == "deleted":
            raise UnauthorizedError()
        if not is_family_admin(account.family_role):
            raise ForbiddenError("Только администратор семьи может удалить семью")

        family_accounts = await self._account_repo.list_by_family_id(account.family_id)
        active_accounts = [item for item in family_accounts if item.family_role != "deleted"]
        if not active_accounts:
            return

        for item in active_accounts:
            await self._session_repo.delete_by_account_id(item.id)
            await self._soft_delete_account(item)

    async def change_password(self, account_id: UUID, dto: ChangePasswordDto) -> None:
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()
        if not verify_password(dto.current_password, account.password_hash):
            raise ValidationError("Текущий пароль указан неверно")
        if dto.current_password == dto.new_password:
            raise ValidationError("Новый пароль должен отличаться от текущего")
        await self._account_repo.update(
            copy_account(account, password_hash=hash_password(dto.new_password))
        )

    async def verify_recovery(
        self, dto: RecoverPasswordVerifyDto
    ) -> RecoverPasswordVerifyResponseDto:
        if self._recovery_token_repo is None:
            raise ValidationError("Recovery flow is not configured", code="RECOVERY_NOT_CONFIGURED")
        account = await self._account_repo.get_by_login(dto.login.strip())
        if (
            account is None
            or account.family_role == "deleted"
            or not account.email
            or account.email.strip().lower() != dto.email
            or self._normalize_recovery_display_name(account.display_name)
            != self._normalize_recovery_display_name(dto.display_name)
        ):
            raise UnauthorizedError(
                "Не удалось подтвердить данные для восстановления",
                code="RECOVERY_IDENTITY_MISMATCH",
            )

        raw_token = generate_session_token()
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=settings.password_recovery_token_ttl_minutes)
        await self._recovery_token_repo.delete_by_account_id(account.id)
        await self._recovery_token_repo.add(
            PasswordRecoveryToken(
                id=uuid4(),
                account_id=account.id,
                token_hash=hash_session_token(raw_token),
                expires_at=expires_at,
                created_at=now,
            )
        )
        return RecoverPasswordVerifyResponseDto(recovery_token=raw_token)

    async def reset_password_by_recovery(self, dto: RecoverPasswordResetDto) -> None:
        if self._recovery_token_repo is None:
            raise ValidationError("Recovery flow is not configured", code="RECOVERY_NOT_CONFIGURED")
        token_hash = hash_session_token(dto.recovery_token)
        token = await self._recovery_token_repo.get_by_token_hash(token_hash)
        now = datetime.now(UTC)
        if token is None or token.used_at is not None or token.expires_at <= now:
            raise UnauthorizedError(
                "Ссылка для восстановления недействительна или устарела",
                code="RECOVERY_TOKEN_INVALID",
            )
        account = await self._account_repo.get_by_id(token.account_id)
        if account is None or account.family_role == "deleted":
            raise UnauthorizedError()
        if verify_password(dto.new_password, account.password_hash):
            raise ValidationError(
                "Новый пароль должен отличаться от текущего",
                code="PASSWORD_REUSE_NOT_ALLOWED",
            )
        await self._account_repo.update(
            copy_account(account, password_hash=hash_password(dto.new_password))
        )
        await self._recovery_token_repo.update(copy_password_recovery_token(token, used_at=now))
        await self._session_repo.delete_by_account_id(account.id)

    async def accept_family_invite(self, account_id: UUID, token: str) -> AuthResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()

        invite = await self._family_invite_repo.get_by_token_hash(hash_session_token(token))
        if not invite:
            raise ValidationError("Приглашение не найдено", code="FAMILY_INVITE_NOT_FOUND")
        if invite.accepted_at is not None:
            raise ValidationError(
                "Приглашение уже использовано",
                code="FAMILY_INVITE_ALREADY_USED",
            )
        if invite.expires_at <= datetime.now(UTC):
            raise ValidationError(
                "Срок действия приглашения истёк",
                code="FAMILY_INVITE_EXPIRED",
            )
        if account.family_id == invite.family_id:
            raise ValidationError("Аккаунт уже состоит в этой семье", code="ALREADY_IN_FAMILY")

        await self._ensure_can_leave_current_family(account)

        family = await self._family_repo.get_by_id(invite.family_id)
        if family is None:
            raise ValidationError("Семья по приглашению не найдена", code="FAMILY_INVITE_INVALID")

        old_family_id = account.family_id
        updated_account = await self._account_repo.update(
            copy_account(
                account,
                family_id=invite.family_id,
                family_role=normalize_family_role(invite.family_role),
            )
        )
        await self._family_invite_repo.update(
            FamilyInvite(
                id=invite.id,
                family_id=invite.family_id,
                created_by_account_id=invite.created_by_account_id,
                token_hash=invite.token_hash,
                family_role=normalize_family_role(invite.family_role),
                created_at=invite.created_at,
                expires_at=invite.expires_at,
                accepted_at=datetime.now(UTC),
                accepted_by_account_id=updated_account.id,
            )
        )
        await self._session_repo.delete_by_account_id(updated_account.id)
        await self._family_repo.delete(old_family_id)
        return await self._create_auth_response(updated_account, family, remember_me=False)

    async def update_language(self, account_id: UUID, dto: UpdateLanguageDto) -> AccountResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()

        updated = await self._account_repo.update(
            copy_account(account, preferred_language=dto.preferred_language)
        )
        return self._account_to_response(updated)

    async def update_profile(
        self, account_id: UUID, dto: UpdateAccountProfileDto
    ) -> AccountResponseDto:
        account = await self._account_repo.get_by_id(account_id)
        if account is None:
            raise UnauthorizedError()

        email = (dto.email or "").strip().lower() or None
        if email and email != account.email:
            existing = await self._account_repo.get_by_email(email)
            if existing is not None and existing.id != account.id:
                raise ValidationError(
                    "Аккаунт с таким email уже существует",
                    code="ACCOUNT_EMAIL_ALREADY_EXISTS",
                    status_code=409,
                )

        updated = await self._account_repo.update(copy_account(account, email=email))
        return self._account_to_response(updated)

    async def _ensure_can_leave_current_family(self, account: Account) -> None:
        family_accounts = await self._account_repo.list_by_family_id(account.family_id)
        if len(family_accounts) != 1 or family_accounts[0].id != account.id:
            raise ValidationError(
                "Нельзя присоединиться к другой семье, пока в вашей семье есть другие участники",
                code="CURRENT_FAMILY_NOT_EMPTY",
            )
        if self._child_repo is not None and await self._child_repo.get_by_family_id(
            account.family_id
        ):
            raise ValidationError(
                "Нельзя присоединиться к другой семье, пока в вашей семье есть дети",
                code="CURRENT_FAMILY_HAS_CHILDREN",
            )
        if self._household_repo is not None and await self._household_repo.get_by_family_id(
            account.family_id
        ):
            raise ValidationError(
                "Нельзя присоединиться к другой семье, пока в вашей семье есть аптечка",
                code="CURRENT_FAMILY_HAS_MEDICINES",
            )
        if self._parent_repo is not None and await self._parent_repo.get_by_family_id(
            account.family_id
        ):
            raise ValidationError(
                "Нельзя присоединиться к другой семье, пока в вашей семье есть участники-родители",
                code="CURRENT_FAMILY_HAS_PARENTS",
            )
