"""DTO для ребёнка."""

from datetime import date, datetime
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
    avatar_key: str | None = Field(None, description="Ключ preset-иконки ребёнка")
    gender: str | None = Field(None, description="Пол ребёнка")


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
    avatar_key: str | None = Field(None, description="Ключ preset-иконки ребёнка")
    gender: str | None = Field(None, description="Пол ребёнка")


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
    avatar_key: str | None = None
    gender: str | None = None


class ChildActiveSleepSessionDto(ResponseBase):
    id: UUID
    started_at: datetime


class ChildActiveFeedingRecordDto(ResponseBase):
    id: UUID
    started_at: datetime


class ChildSummaryResponseDto(ChildResponseDto):
    latest_weight_kg: float | None = None
    latest_height_cm: float | None = None
    active_sleep_session: ChildActiveSleepSessionDto | None = None
    active_feeding_record: ChildActiveFeedingRecordDto | None = None
