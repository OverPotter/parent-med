"""DTO для регистрации и авторизации."""

from dataclasses import dataclass
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase
from src.application.dto.family import FamilyResponseDto


class RegisterDto(BaseModel):
    """Регистрация аккаунта с созданием семьи."""

    login: str = Field(..., min_length=3, description="Логин аккаунта")
    email: str | None = Field(None, description="Email аккаунта для связи")
    password: str = Field(..., min_length=6, description="Пароль")
    display_name: str | None = Field(None, description="Как показывать пользователя в семье")
    relationship_label: str | None = Field(None, description="Кем пользователь является в семье")
    phone: str | None = Field(None, description="Контактный телефон")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")
    invite_token: str | None = Field(None, description="Токен приглашения в существующую семью")


class LoginDto(BaseModel):
    """Вход по login и паролю."""

    login: str = Field(..., min_length=3, description="Логин аккаунта")
    password: str = Field(..., min_length=6, description="Пароль")
    remember_me: bool = Field(False, description="Оставаться в системе на этом устройстве")


class ChangePasswordDto(BaseModel):
    """Смена пароля авторизованного аккаунта."""

    current_password: str = Field(..., min_length=6, description="Текущий пароль")
    new_password: str = Field(..., min_length=6, description="Новый пароль")


class RefreshDto(BaseModel):
    """Обновление access token по refresh token."""

    refresh_token: str | None = Field(None, description="Refresh token")


class AccountResponseDto(ResponseBase):
    """Ответ: аккаунт."""

    id: UUID
    login: str
    email: str | None
    family_id: UUID
    display_name: str
    relationship_label: str | None = None
    phone: str | None = None
    family_role: str


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
