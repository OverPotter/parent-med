"""Сервис сессий сна ребёнка."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.sleep_session import (
    SleepSessionCreateDto,
    SleepSessionResponseDto,
    SleepSessionStopDto,
)
from src.application.services.access_control import (
    get_child_for_account,
)
from src.application.services.child_plan_access import ensure_child_plan_mutation_allowed
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.sleep_session import SleepSession
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository


class SleepSessionService:
    """Старт и завершение сна ребёнка."""

    def __init__(
        self,
        sleep_repo: SleepSessionRepository,
        child_repo: ChildRepository,
        family_repo: FamilyRepository | None = None,
    ) -> None:
        self._repo = sleep_repo
        self._child_repo = child_repo
        self._family_repo = family_repo

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

    async def _require_child_access(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> Child:
        return await get_child_for_account(
            self._child_repo,
            child_id,
            current_account,
            required_level,
        )

    async def _get_session_for_account(
        self,
        session_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> SleepSession:
        entity = await self._repo.get_by_id(session_id)
        if not entity:
            raise NotFoundError("Сессия сна не найдена", resource="sleep_session")
        await self._require_child_access(entity.child_id, current_account, required_level)
        return entity

    async def get_active_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> SleepSessionResponseDto | None:
        await self._require_child_access(child_id, current_account)
        entity = await self._repo.get_active_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def list_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[SleepSessionResponseDto]:
        await self._require_child_access(child_id, current_account)
        items = await self._repo.get_by_child_id(child_id)
        return [self._to_response(item) for item in items]

    async def start(
        self,
        dto: SleepSessionCreateDto,
        current_account: AuthenticatedAccount,
    ) -> SleepSessionResponseDto:
        child = await self._require_child_access(dto.child_id, current_account, "act")
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_account,
            child.id,
        )
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
            created_by_account_id=current_account.id,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def stop(
        self,
        session_id: UUID,
        dto: SleepSessionStopDto,
        current_account: AuthenticatedAccount,
    ) -> SleepSessionResponseDto:
        entity = await self._get_session_for_account(session_id, current_account, "act")
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_account,
            entity.child_id,
        )
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
        current_account: AuthenticatedAccount,
    ) -> None:
        entity = await self._get_session_for_account(session_id, current_account, "edit")
        await ensure_child_plan_mutation_allowed(
            self._family_repo,
            current_account,
            entity.child_id,
        )
        deleted = await self._repo.delete(entity.id)
        if not deleted:
            raise NotFoundError("Сессия сна не найдена", resource="sleep_session")
