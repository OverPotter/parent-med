"""DTO для регистрации и авторизации."""

from dataclasses import dataclass
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase
from src.application.dto.family import FamilyResponseDto


class RegisterDto(BaseModel):
    """Регистрация аккаунта с созданием семьи."""

    email: str = Field(..., description="Email аккаунта")
    password: str = Field(..., min_length=6, description="Пароль")
    display_name: str | None = Field(None, description="Как показывать пользователя в семье")
    invite_token: str | None = Field(None, description="Токен приглашения в существующую семью")


class LoginDto(BaseModel):
    """Вход по email и паролю."""

    email: str = Field(..., description="Email аккаунта")
    password: str = Field(..., min_length=6, description="Пароль")


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
    email: str
    family_id: UUID
    display_name: str
    family_role: str


@dataclass
class AuthenticatedAccount:
    """Текущий авторизованный аккаунт."""

    id: UUID
    email: str
    family_id: UUID
    display_name: str
    family_role: str


class AuthStateResponseDto(ResponseBase):
    """Ответ с текущим auth-контекстом без токенов."""

    account: AccountResponseDto
    family: FamilyResponseDto


class AuthResponseDto(AuthStateResponseDto):
    """Ответ авторизации."""

    token_type: str = "bearer"
    access_token: str
    refresh_token: str
