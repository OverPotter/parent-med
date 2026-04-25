"""DTO для регистрации и авторизации."""

import re
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from src.application.dto.base import ResponseBase
from src.application.dto.family import FamilyResponseDto
from src.application.dto.family_access import FamilyAccessPolicyDto

AccountLanguage = Literal["ru", "en"]
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _validate_email(value: str) -> str:
    normalized = _normalize_email(value)
    if not _EMAIL_RE.match(normalized):
        raise ValueError("Укажите корректный email")
    return normalized


def _normalize_recovery_code(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if len(normalized) < 8:
        raise ValueError("Recovery code must be at least 8 characters long")
    return normalized


class RegisterDto(BaseModel):
    """Регистрация аккаунта с созданием семьи."""

    email: str = Field(..., min_length=5, description="Email аккаунта для связи и восстановления")
    password: str = Field(..., min_length=8, description="Пароль")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")
    invite_token: str | None = Field(None, description="Токен приглашения в существующую семью")
    preferred_language: AccountLanguage = Field(
        "en",
        description="Предпочитаемый язык аккаунта",
    )

    _normalized_email = field_validator("email")(_validate_email)


class LoginDto(BaseModel):
    """Вход по email и паролю."""

    email: str = Field(..., min_length=3, description="Email аккаунта")
    password: str = Field(..., min_length=1, description="Пароль")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")


class ChangePasswordDto(BaseModel):
    """Смена пароля авторизованного аккаунта."""

    current_password: str = Field(..., min_length=1, description="Текущий пароль")
    new_password: str = Field(..., min_length=8, description="Новый пароль")


class UpdateLanguageDto(BaseModel):
    """Смена предпочитаемого языка аккаунта."""

    preferred_language: AccountLanguage = Field(..., description="Предпочитаемый язык аккаунта")


class UpdateAccountProfileDto(BaseModel):
    """Частичное обновление профиля аккаунта."""


class UpdateRecoveryCodeDto(BaseModel):
    """Настройка или обновление recovery code у текущего аккаунта."""

    recovery_code: str = Field(..., min_length=8, description="Recovery code")

    _normalized_recovery_code = field_validator("recovery_code")(_normalize_recovery_code)


class RecoverPasswordByCodeDto(BaseModel):
    """Сброс пароля по email и recovery code."""

    email: str = Field(..., min_length=5, description="Email аккаунта")
    recovery_code: str = Field(..., min_length=8, description="Recovery code")
    new_password: str = Field(..., min_length=8, description="Новый пароль")

    _normalized_email = field_validator("email")(_validate_email)
    _normalized_recovery_code = field_validator("recovery_code")(_normalize_recovery_code)


class RefreshDto(BaseModel):
    """Обновление access token по refresh token."""

    refresh_token: str | None = Field(None, description="Refresh token")


class AccountResponseDto(ResponseBase):
    """Ответ: аккаунт."""

    id: UUID
    email: str | None
    family_id: UUID
    display_name: str
    needs_profile_completion: bool = False
    has_recovery_code: bool = False
    relationship_label: str | None = None
    phone: str | None = None
    preferred_language: AccountLanguage = "ru"
    family_role: str
    access_policy: FamilyAccessPolicyDto = Field(default_factory=FamilyAccessPolicyDto)


@dataclass
class AuthenticatedAccount:
    """Текущий авторизованный аккаунт."""

    id: UUID
    email: str | None
    family_id: UUID
    display_name: str
    family_role: str
    needs_profile_completion: bool = False
    has_recovery_code: bool = False
    relationship_label: str | None = None
    phone: str | None = None
    preferred_language: AccountLanguage = "ru"
    access_policy: FamilyAccessPolicyDto | None = None


class AuthStateResponseDto(ResponseBase):
    """Ответ с текущим auth-контекстом без токенов."""

    account: AccountResponseDto
    family: FamilyResponseDto


class AuthResponseDto(AuthStateResponseDto):
    """Ответ авторизации."""

    token_type: str = "bearer"
    access_token: str | None
    refresh_token: str | None
    remember_me: bool = False
