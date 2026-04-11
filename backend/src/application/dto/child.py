"""DTO для ребёнка."""

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from src.application.dto.base import ResponseBase


class ChildCreateDto(BaseModel):
    """Добавление ребёнка."""

    family_id: UUID = Field(..., description="ID семьи")
    name: str = Field(..., description="Имя ребёнка")
    birth_date: date | None = Field(None, description="Дата рождения")
    baby_mode_enabled: bool = Field(False, description="Включён ли режим малыша")
    institution_name: str | None = Field(None, description="Сад, школа или другая организация")
    institution_phone: str | None = Field(None, description="Телефон организации")
    doctor_name: str | None = Field(None, description="Имя врача")
    doctor_phone: str | None = Field(None, description="Телефон врача")
    allergies: str | None = Field(None, description="Аллергии")
    notes: str | None = Field(None, description="Заметки")


class ChildUpdateDto(BaseModel):
    """Обновление ребёнка."""

    name: str | None = Field(None, description="Имя ребёнка")
    birth_date: date | None = Field(None, description="Дата рождения")
    baby_mode_enabled: bool | None = Field(None, description="Включён ли режим малыша")
    institution_name: str | None = Field(None, description="Сад, школа или другая организация")
    institution_phone: str | None = Field(None, description="Телефон организации")
    doctor_name: str | None = Field(None, description="Имя врача")
    doctor_phone: str | None = Field(None, description="Телефон врача")
    allergies: str | None = Field(None, description="Аллергии")
    notes: str | None = Field(None, description="Заметки")


class ChildResponseDto(ResponseBase):
    """Ответ: ребёнок."""

    id: UUID
    family_id: UUID
    name: str
    birth_date: date | None
    age_label: str | None
    baby_mode_enabled: bool = False
    institution_name: str | None = None
    institution_phone: str | None = None
    doctor_name: str | None = None
    doctor_phone: str | None = None
    allergies: str | None = None
    notes: str | None = None
