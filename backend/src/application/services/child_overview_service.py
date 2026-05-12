"""Сервис агрегированного обзора ребёнка."""

import asyncio
from uuid import UUID

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.child_overview import ChildOverviewResponseDto
from src.application.dto.feeding_record import FeedingRecordResponseDto
from src.application.dto.height_entry import HeightEntryResponseDto
from src.application.dto.illness_episode import IllnessEpisodeResponseDto
from src.application.dto.sleep_session import SleepSessionResponseDto
from src.application.dto.weight_entry import WeightEntryResponseDto
from src.application.services.access_control import get_child_for_account
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.domain.repositories.height_entry_repository import HeightEntryRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository


class ChildOverviewService:
    """Собирает единый overview payload для mobile."""

    def __init__(
        self,
        child_repo: ChildRepository,
        feeding_repo: FeedingRecordRepository,
        sleep_repo: SleepSessionRepository,
        weight_repo: WeightEntryRepository,
        height_repo: HeightEntryRepository,
        episode_repo: IllnessEpisodeRepository,
    ) -> None:
        self._child_repo = child_repo
        self._feeding_repo = feeding_repo
        self._sleep_repo = sleep_repo
        self._weight_repo = weight_repo
        self._height_repo = height_repo
        self._episode_repo = episode_repo

    async def get_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> ChildOverviewResponseDto:
        await get_child_for_account(self._child_repo, child_id, current_account, "view")
        feeding_records, sleep_sessions, weight_entries, height_entries, illness_episodes = (
            await asyncio.gather(
                self._feeding_repo.get_by_child_id(child_id),
                self._sleep_repo.get_by_child_id(child_id),
                self._weight_repo.get_by_child_id(child_id),
                self._height_repo.get_by_child_id(child_id),
                self._episode_repo.get_by_child_id(child_id),
            )
        )

        return ChildOverviewResponseDto(
            feeding_records=[self._to_feeding_record(item) for item in feeding_records],
            sleep_sessions=[self._to_sleep_session(item) for item in sleep_sessions],
            weight_entries=[self._to_weight_entry(item) for item in weight_entries],
            height_entries=[self._to_height_entry(item) for item in height_entries],
            illness_episodes=[self._to_illness_episode(item) for item in illness_episodes],
        )

    def _to_feeding_record(self, entity) -> FeedingRecordResponseDto:
        duration_minutes = entity.duration_minutes
        if (
            duration_minutes is None
            and entity.started_at is not None
            and entity.ended_at is not None
        ):
            duration_minutes = max(
                0,
                int((entity.ended_at - entity.started_at).total_seconds() // 60),
            )
        return FeedingRecordResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            feeding_type=entity.feeding_type,
            breast_side=entity.breast_side,
            is_expressed=entity.is_expressed,
            formula_volume_ml=entity.formula_volume_ml,
            recorded_at=entity.recorded_at,
            started_at=entity.started_at,
            ended_at=entity.ended_at,
            duration_minutes=duration_minutes,
            status=entity.status,
            note=entity.note,
            created_by_account_id=entity.created_by_account_id,
        )

    def _to_sleep_session(self, entity) -> SleepSessionResponseDto:
        duration_minutes = None
        if entity.ended_at is not None:
            duration_minutes = max(
                0,
                int((entity.ended_at - entity.started_at).total_seconds() // 60),
            )
        return SleepSessionResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            started_at=entity.started_at,
            ended_at=entity.ended_at,
            duration_minutes=duration_minutes,
            status=entity.status,
            created_by_account_id=entity.created_by_account_id,
        )

    def _to_weight_entry(self, entity) -> WeightEntryResponseDto:
        return WeightEntryResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            value_kg=entity.value_kg,
            measured_at=entity.measured_at,
        )

    def _to_height_entry(self, entity) -> HeightEntryResponseDto:
        return HeightEntryResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            value_cm=entity.value_cm,
            measured_at=entity.measured_at,
        )

    def _to_illness_episode(self, entity) -> IllnessEpisodeResponseDto:
        return IllnessEpisodeResponseDto(
            id=entity.id,
            child_id=entity.child_id,
            started_at=entity.started_at,
            title=entity.title,
            status=entity.status,
            medication_mode=entity.medication_mode,
            note=entity.note,
            member_account_ids=list(entity.member_account_ids),
            created_by_account_id=entity.created_by_account_id,
            closed_at=entity.closed_at,
        )
