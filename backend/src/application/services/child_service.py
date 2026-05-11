"""Сервис детей."""

from dataclasses import replace
from datetime import date
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child import ChildCreateDto, ChildResponseDto, ChildUpdateDto
from src.application.services.access_control import (
    ensure_child_edit_access,
    ensure_children_admin_access,
    filter_child_ids,
    get_child_for_account,
)
from src.application.services.subscription_policy import resolve_family_plan_policy
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository


class ChildService:
    """Сервис CRUD для детей."""

    def __init__(
        self,
        child_repo: ChildRepository,
        family_repo: FamilyRepository,
    ) -> None:
        self._repo = child_repo
        self._family_repo = family_repo

    def _format_age_label(self, birth_date: date | None, today: date | None = None) -> str | None:
        if birth_date is None:
            return None
        if today is None:
            today = date.today()
        if birth_date > today:
            return None

        total_months = (
            (today.year - birth_date.year) * 12
            + today.month
            - birth_date.month
            - int(today.day < birth_date.day)
        )
        if total_months < 0:
            return None

        if total_months < 12:
            return f"{total_months} мес."

        years = total_months // 12
        months = total_months % 12
        if months == 0:
            return f"{years} {self._pluralize_years(years)}"
        return f"{years} {self._pluralize_years(years)} {months} мес."

    def _pluralize_years(self, years: int) -> str:
        remainder_100 = years % 100
        remainder_10 = years % 10
        if 11 <= remainder_100 <= 14:
            return "лет"
        if remainder_10 == 1:
            return "год"
        if 2 <= remainder_10 <= 4:
            return "года"
        return "лет"

    def _validate_birth_date(self, birth_date: date | None) -> None:
        if birth_date is not None and birth_date > date.today():
            raise ValidationError(
                "Дата рождения не может быть в будущем", code="BIRTH_DATE_IN_FUTURE"
            )

    def _normalize_avatar_key(self, avatar_key: str | None) -> str | None:
        return (avatar_key or "").strip() or None

    def _normalize_gender(self, gender: str | None) -> str | None:
        normalized = (gender or "").strip().lower()
        if not normalized:
            return None
        if normalized not in {"boy", "girl"}:
            raise ValidationError("Некорректный пол ребёнка", code="INVALID_CHILD_GENDER")
        return normalized

    def _infer_gender_from_avatar_key(self, avatar_key: str | None) -> str | None:
        normalized_avatar_key = self._normalize_avatar_key(avatar_key)
        if not normalized_avatar_key:
            return None
        if normalized_avatar_key.startswith("boy"):
            return "boy"
        if normalized_avatar_key.startswith("girl"):
            return "girl"
        return None

    def _resolve_gender(self, avatar_key: str | None, gender: str | None) -> str | None:
        normalized_avatar_key = self._normalize_avatar_key(avatar_key)
        normalized_gender = self._normalize_gender(gender)
        inferred_gender = self._infer_gender_from_avatar_key(normalized_avatar_key)
        if inferred_gender and normalized_gender and inferred_gender != normalized_gender:
            raise ValidationError(
                "Пол ребёнка не совпадает с выбранной иконкой",
                code="CHILD_GENDER_AVATAR_MISMATCH",
            )
        return normalized_gender or inferred_gender

    def _to_response(self, entity: Child) -> ChildResponseDto:
        return ChildResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            name=entity.name,
            birth_date=entity.birth_date,
            age_label=self._format_age_label(entity.birth_date),
            baby_mode_enabled=entity.baby_mode_enabled,
            institution_name=entity.institution_name,
            institution_phone=entity.institution_phone,
            doctor_name=entity.doctor_name,
            doctor_phone=entity.doctor_phone,
            allergies=entity.allergies,
            notes=entity.notes,
            avatar_key=entity.avatar_key,
            gender=entity.gender,
        )

    async def get_by_id(self, id: UUID) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        return self._to_response(entity)

    async def get_by_id_for_account(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
    ) -> ChildResponseDto:
        entity = await get_child_for_account(self._repo, id, current_account)
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[ChildResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        return [self._to_response(e) for e in entities]

    async def get_by_family_id_for_account(
        self,
        family_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[ChildResponseDto]:
        if family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        children = await self.get_by_family_id(family_id)
        allowed_child_ids = set(filter_child_ids(current_account, [child.id for child in children]))
        return [child for child in children if child.id in allowed_child_ids]

    async def get_by_family_id_for_management(
        self,
        family_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[ChildResponseDto]:
        if family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        ensure_children_admin_access(current_account)
        return await self.get_by_family_id(family_id)

    async def create(self, dto: ChildCreateDto) -> ChildResponseDto:
        family = await self._family_repo.get_by_id(dto.family_id)
        if family is None:
            raise NotFoundError("Семья не найдена", resource="family")
        plan_policy = resolve_family_plan_policy(family)
        existing_children = await self._repo.get_by_family_id(dto.family_id)
        if (
            plan_policy.max_children is not None
            and len(existing_children) >= plan_policy.max_children
        ):
            raise ValidationError(
                "Во Free доступен только один ребёнок. "
                "Перейдите на Plus, чтобы добавить ещё детей.",
                code="PLUS_REQUIRED_FOR_ADDITIONAL_CHILDREN",
            )
        self._validate_birth_date(dto.birth_date)
        entity = Child(
            id=uuid4(),
            family_id=dto.family_id,
            name=dto.name,
            birth_date=dto.birth_date,
            baby_mode_enabled=dto.baby_mode_enabled,
            institution_name=(dto.institution_name or "").strip() or None,
            institution_phone=(dto.institution_phone or "").strip() or None,
            doctor_name=(dto.doctor_name or "").strip() or None,
            doctor_phone=(dto.doctor_phone or "").strip() or None,
            allergies=(dto.allergies or "").strip() or None,
            notes=(dto.notes or "").strip() or None,
            avatar_key=self._normalize_avatar_key(dto.avatar_key),
            gender=self._resolve_gender(dto.avatar_key, dto.gender),
        )
        created = await self._repo.add(entity)
        if family.free_primary_child_id is None:
            await self._family_repo.update(replace(family, free_primary_child_id=created.id))
        return self._to_response(created)

    async def create_for_account(
        self,
        dto: ChildCreateDto,
        current_account: AuthenticatedAccount,
    ) -> ChildResponseDto:
        if dto.family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        ensure_children_admin_access(current_account)
        return await self.create(dto)

    async def update(self, id: UUID, dto: ChildUpdateDto) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        fields_set = dto.model_fields_set
        name = dto.name if "name" in fields_set and dto.name is not None else entity.name
        birth_date = dto.birth_date if "birth_date" in fields_set else entity.birth_date
        baby_mode_enabled = (
            dto.baby_mode_enabled
            if "baby_mode_enabled" in fields_set and dto.baby_mode_enabled is not None
            else entity.baby_mode_enabled
        )
        next_avatar_key = (
            self._normalize_avatar_key(dto.avatar_key)
            if "avatar_key" in fields_set
            else entity.avatar_key
        )
        next_gender = (
            self._resolve_gender(next_avatar_key, dto.gender)
            if "gender" in fields_set or "avatar_key" in fields_set
            else entity.gender
        )
        self._validate_birth_date(birth_date)
        entity = Child(
            id=entity.id,
            family_id=entity.family_id,
            name=name,
            birth_date=birth_date,
            baby_mode_enabled=baby_mode_enabled,
            institution_name=(
                (dto.institution_name or "").strip() or None
                if "institution_name" in fields_set
                else entity.institution_name
            ),
            institution_phone=(
                (dto.institution_phone or "").strip() or None
                if "institution_phone" in fields_set
                else entity.institution_phone
            ),
            doctor_name=(
                (dto.doctor_name or "").strip() or None
                if "doctor_name" in fields_set
                else entity.doctor_name
            ),
            doctor_phone=(
                (dto.doctor_phone or "").strip() or None
                if "doctor_phone" in fields_set
                else entity.doctor_phone
            ),
            allergies=(
                (dto.allergies or "").strip() or None
                if "allergies" in fields_set
                else entity.allergies
            ),
            notes=((dto.notes or "").strip() or None if "notes" in fields_set else entity.notes),
            avatar_key=next_avatar_key,
            gender=next_gender,
        )
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def update_for_account(
        self,
        id: UUID,
        dto: ChildUpdateDto,
        current_account: AuthenticatedAccount,
    ) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        ensure_child_edit_access(current_account, entity.id)
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        await self._repo.delete(id)

    async def delete_for_account(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        ensure_children_admin_access(current_account)
        await self._repo.delete(id)
