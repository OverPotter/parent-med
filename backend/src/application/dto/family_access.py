"""DTO семейных прав доступа."""

from uuid import UUID

from pydantic import BaseModel, Field


class FamilyAccessPolicyDto(BaseModel):
    """Снимок прав участника внутри семьи."""

    all_children: bool = Field(True, description="Есть доступ ко всем детям семьи")
    child_ids: list[UUID] = Field(default_factory=list, description="Выбранные дети участника")
    children_access: str = Field("edit", description="Права на детей: view/act/edit")
    cabinet_access: str = Field("edit", description="Права на аптечку: none/view/edit")
    pillbox_access: str = Field("edit", description="Права на приёмы: none/view/act/edit")
    cabinet_push_enabled: bool = Field(True, description="Разрешены push по аптечке")


class FamilyAccessPolicyUpdateDto(BaseModel):
    """Частичное обновление прав участника."""

    all_children: bool | None = Field(None, description="Есть доступ ко всем детям семьи")
    child_ids: list[UUID] | None = Field(None, description="Выбранные дети участника")
    children_access: str | None = Field(None, description="Права на детей: view/act/edit")
    cabinet_access: str | None = Field(None, description="Права на аптечку: none/view/edit")
    pillbox_access: str | None = Field(None, description="Права на приёмы: none/view/act/edit")
    cabinet_push_enabled: bool | None = Field(None, description="Разрешены push по аптечке")
