"""Сервис детей."""

from datetime import date
from uuid import UUID, uuid4

from src.application.dto.child import ChildCreateDto, ChildResponseDto, ChildUpdateDto
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

    def _to_response(self, entity: Child) -> ChildResponseDto:
        return ChildResponseDto(
            id=entity.id,
            family_id=entity.family_id,
            name=entity.name,
            birth_date=entity.birth_date,
            age_label=self._format_age_label(entity.birth_date),
        )

    async def get_by_id(self, id: UUID) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        return self._to_response(entity)

    async def get_by_id_for_account(self, id: UUID, current_family_id: UUID) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return self._to_response(entity)

    async def get_by_family_id(self, family_id: UUID) -> list[ChildResponseDto]:
        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        entities = await self._repo.get_by_family_id(family_id)
        return [self._to_response(e) for e in entities]

    async def get_by_family_id_for_account(
        self,
        family_id: UUID,
        current_family_id: UUID,
    ) -> list[ChildResponseDto]:
        if family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.get_by_family_id(family_id)

    async def create(self, dto: ChildCreateDto) -> ChildResponseDto:
        if await self._family_repo.get_by_id(dto.family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")
        self._validate_birth_date(dto.birth_date)
        entity = Child(
            id=uuid4(),
            family_id=dto.family_id,
            name=dto.name,
            birth_date=dto.birth_date,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def create_for_account(
        self,
        dto: ChildCreateDto,
        current_family_id: UUID,
    ) -> ChildResponseDto:
        if dto.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к чужой семье")
        return await self.create(dto)

    async def update(self, id: UUID, dto: ChildUpdateDto) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        name = dto.name if dto.name is not None else entity.name
        birth_date = dto.birth_date if dto.birth_date is not None else entity.birth_date
        self._validate_birth_date(birth_date)
        entity = Child(id=entity.id, family_id=entity.family_id, name=name, birth_date=birth_date)
        updated = await self._repo.update(entity)
        return self._to_response(updated)

    async def update_for_account(
        self,
        id: UUID,
        dto: ChildUpdateDto,
        current_family_id: UUID,
    ) -> ChildResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return await self.update(id, dto)

    async def delete(self, id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        await self._repo.delete(id)

    async def delete_for_account(self, id: UUID, current_family_id: UUID) -> None:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if entity.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        await self._repo.delete(id)
