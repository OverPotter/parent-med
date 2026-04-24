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


def _normalize_display_name(value: str) -> str:
    return " ".join(value.strip().split())


def _validate_email(value: str) -> str:
    normalized = _normalize_email(value)
    if not _EMAIL_RE.match(normalized):
        raise ValueError("Укажите корректный email")
    return normalized


class RegisterDto(BaseModel):
    """Регистрация аккаунта с созданием семьи."""

    login: str = Field(..., min_length=3, description="Логин аккаунта")
    email: str = Field(..., min_length=5, description="Email аккаунта для связи и восстановления")
    password: str = Field(..., min_length=6, description="Пароль")
    display_name: str = Field(..., min_length=1, description="Как показывать пользователя в семье")
    relationship_label: str | None = Field(None, description="Кем пользователь является в семье")
    phone: str | None = Field(None, description="Контактный телефон")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")
    invite_token: str | None = Field(None, description="Токен приглашения в существующую семью")

    _normalized_email = field_validator("email")(_validate_email)

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = _normalize_display_name(value)
        if not normalized:
            raise ValueError("Укажите имя в семье")
        return normalized


class LoginDto(BaseModel):
    """Вход по login и паролю."""

    login: str = Field(..., min_length=3, description="Логин аккаунта")
    password: str = Field(..., min_length=6, description="Пароль")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")


class ChangePasswordDto(BaseModel):
    """Смена пароля авторизованного аккаунта."""

    current_password: str = Field(..., min_length=6, description="Текущий пароль")
    new_password: str = Field(..., min_length=6, description="Новый пароль")


class UpdateLanguageDto(BaseModel):
    """Смена предпочитаемого языка аккаунта."""

    preferred_language: AccountLanguage = Field(..., description="Предпочитаемый язык аккаунта")


class UpdateAccountProfileDto(BaseModel):
    """Частичное обновление профиля аккаунта."""

    email: str | None = Field(None, description="Email аккаунта для связи; null/пусто очищает поле")


class RefreshDto(BaseModel):
    """Обновление access token по refresh token."""

    refresh_token: str | None = Field(None, description="Refresh token")


class RecoverPasswordVerifyDto(BaseModel):
    """Проверка recovery-данных для выдачи временного токена."""

    login: str = Field(..., min_length=3, description="Логин аккаунта")
    email: str = Field(..., min_length=5, description="Recovery email")
    display_name: str = Field(..., min_length=1, description="Имя в семье")

    _normalized_email = field_validator("email")(_validate_email)

    @field_validator("display_name")
    @classmethod
    def normalize_recovery_display_name(cls, value: str) -> str:
        normalized = _normalize_display_name(value)
        if not normalized:
            raise ValueError("Укажите имя в семье")
        return normalized


class RecoverPasswordResetDto(BaseModel):
    """Сброс пароля по временному recovery token."""

    recovery_token: str = Field(..., min_length=20, description="Временный recovery token")
    new_password: str = Field(..., min_length=6, description="Новый пароль")


class RecoverPasswordVerifyResponseDto(ResponseBase):
    """Ответ после успешной проверки recovery-данных."""

    recovery_token: str


class AccountResponseDto(ResponseBase):
    """Ответ: аккаунт."""

    id: UUID
    login: str
    email: str | None
    family_id: UUID
    display_name: str
    relationship_label: str | None = None
    phone: str | None = None
    preferred_language: AccountLanguage = "ru"
    family_role: str
    access_policy: FamilyAccessPolicyDto = Field(default_factory=FamilyAccessPolicyDto)


@dataclass
class AuthenticatedAccount:
    """Текущий авторизованный аккаунт."""

    id: UUID
    login: str
    email: str | None
    family_id: UUID
    display_name: str
    family_role: str
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
    access_token: str
    refresh_token: str
    remember_me: bool = False
