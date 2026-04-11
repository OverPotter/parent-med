"""Сервис сессий сна ребёнка."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.sleep_session import (
    SleepSessionCreateDto,
    SleepSessionResponseDto,
    SleepSessionStopDto,
)
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.sleep_session import SleepSession
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository


class SleepSessionService:
    """Старт и завершение сна ребёнка."""

    def __init__(
        self,
        sleep_repo: SleepSessionRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = sleep_repo
        self._child_repo = child_repo

    def _to_response(self, entity: SleepSession) -> SleepSessionResponseDto:
        duration_minutes: int | None = None
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

    async def _require_child_access(self, child_id: UUID, current_family_id: UUID) -> Child:
        child = await self._child_repo.get_by_id(child_id)
        if not child:
            raise NotFoundError("Ребёнок не найден", resource="child")
        if child.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return child

    async def _get_session_for_account(
        self, session_id: UUID, current_family_id: UUID
    ) -> SleepSession:
        entity = await self._repo.get_by_id(session_id)
        if not entity:
            raise NotFoundError("Сессия сна не найдена", resource="sleep_session")
        await self._require_child_access(entity.child_id, current_family_id)
        return entity

    async def get_active_for_child(
        self,
        child_id: UUID,
        current_family_id: UUID,
    ) -> SleepSessionResponseDto | None:
        await self._require_child_access(child_id, current_family_id)
        entity = await self._repo.get_active_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def list_for_child(
        self,
        child_id: UUID,
        current_family_id: UUID,
    ) -> list[SleepSessionResponseDto]:
        await self._require_child_access(child_id, current_family_id)
        items = await self._repo.get_by_child_id(child_id)
        return [self._to_response(item) for item in items]

    async def start(
        self,
        dto: SleepSessionCreateDto,
        current_family_id: UUID,
        current_account_id: UUID,
    ) -> SleepSessionResponseDto:
        child = await self._require_child_access(dto.child_id, current_family_id)
        if not child.baby_mode_enabled:
            raise ValidationError("Режим малыша выключен", code="BABY_MODE_DISABLED")

        active = await self._repo.get_active_by_child_id(dto.child_id)
        if active:
            return self._to_response(active)

        started_at = dto.started_at or datetime.now(UTC)
        entity = SleepSession(
            id=uuid4(),
            child_id=dto.child_id,
            started_at=started_at,
            ended_at=None,
            status="active",
            created_by_account_id=current_account_id,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def stop(
        self,
        session_id: UUID,
        dto: SleepSessionStopDto,
        current_family_id: UUID,
    ) -> SleepSessionResponseDto:
        entity = await self._get_session_for_account(session_id, current_family_id)
        if entity.status != "active":
            return self._to_response(entity)

        ended_at = dto.ended_at or datetime.now(UTC)
        if ended_at < entity.started_at:
            raise ValidationError(
                "Окончание сна не может быть раньше начала",
                code="SLEEP_END_BEFORE_START",
            )

        updated = await self._repo.update(
            SleepSession(
                id=entity.id,
                child_id=entity.child_id,
                started_at=entity.started_at,
                ended_at=ended_at,
                status="completed",
                created_by_account_id=entity.created_by_account_id,
            )
        )
        return self._to_response(updated)

    async def delete(
        self,
        session_id: UUID,
        current_family_id: UUID,
    ) -> None:
        entity = await self._get_session_for_account(session_id, current_family_id)
        deleted = await self._repo.delete(entity.id)
        if not deleted:
            raise NotFoundError("Сессия сна не найдена", resource="sleep_session")
