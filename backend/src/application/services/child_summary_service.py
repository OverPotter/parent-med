"""Сервис children-summary для мобильных карточек."""

import asyncio
from datetime import date
from uuid import UUID

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child import (
    ChildActiveFeedingRecordDto,
    ChildActiveSleepSessionDto,
    ChildSummaryResponseDto,
)
from src.application.services.access_control import filter_child_ids
from src.core.exceptions import ForbiddenError, NotFoundError
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.domain.repositories.height_entry_repository import HeightEntryRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository


class ChildSummaryService:
    """Сводка по детям для children-карточек."""

    def __init__(
        self,
        child_repo: ChildRepository,
        family_repo: FamilyRepository,
        sleep_repo: SleepSessionRepository,
        feeding_repo: FeedingRecordRepository,
        weight_repo: WeightEntryRepository,
        height_repo: HeightEntryRepository,
    ) -> None:
        self._child_repo = child_repo
        self._family_repo = family_repo
        self._sleep_repo = sleep_repo
        self._feeding_repo = feeding_repo
        self._weight_repo = weight_repo
        self._height_repo = height_repo

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

    async def list_for_family_for_account(
        self,
        family_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[ChildSummaryResponseDto]:
        if family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к чужой семье")

        if await self._family_repo.get_by_id(family_id) is None:
            raise NotFoundError("Семья не найдена", resource="family")

        children = await self._child_repo.get_by_family_id(family_id)
        allowed_child_ids = set(filter_child_ids(current_account, [child.id for child in children]))
        visible_children = [child for child in children if child.id in allowed_child_ids]

        async def build_summary(child):
            active_sleep, active_feeding, latest_weight, latest_height = await asyncio.gather(
                self._sleep_repo.get_active_by_child_id(child.id),
                self._feeding_repo.get_active_by_child_id(child.id),
                self._weight_repo.get_latest_by_child_id(child.id),
                self._height_repo.get_latest_by_child_id(child.id),
            )
            return ChildSummaryResponseDto(
                id=child.id,
                family_id=child.family_id,
                name=child.name,
                birth_date=child.birth_date,
                age_label=self._format_age_label(child.birth_date),
                baby_mode_enabled=child.baby_mode_enabled,
                institution_name=child.institution_name,
                institution_phone=child.institution_phone,
                doctor_name=child.doctor_name,
                doctor_phone=child.doctor_phone,
                allergies=child.allergies,
                notes=child.notes,
                avatar_key=child.avatar_key,
                gender=child.gender,
                latest_weight_kg=latest_weight.value_kg if latest_weight else None,
                latest_height_cm=latest_height.value_cm if latest_height else None,
                active_sleep_session=(
                    ChildActiveSleepSessionDto(
                        id=active_sleep.id,
                        started_at=active_sleep.started_at,
                    )
                    if active_sleep
                    else None
                ),
                active_feeding_record=(
                    ChildActiveFeedingRecordDto(
                        id=active_feeding.id,
                        started_at=active_feeding.started_at or active_feeding.recorded_at,
                    )
                    if active_feeding
                    else None
                ),
            )

        return await asyncio.gather(*(build_summary(child) for child in visible_children))
