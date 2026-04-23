"""Сервис записей кормления ребёнка."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.feeding_record import (
    FeedingRecordCreateDto,
    FeedingRecordResponseDto,
    FeedingRecordStartDto,
    FeedingRecordStopDto,
)
from src.application.services.access_control import (
    get_child_for_account,
)
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.feeding_record import FeedingRecord
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository


class FeedingRecordService:
    """Создание, список и удаление записей кормления."""

    def __init__(
        self,
        feeding_repo: FeedingRecordRepository,
        child_repo: ChildRepository,
    ) -> None:
        self._repo = feeding_repo
        self._child_repo = child_repo

    def _to_response(self, entity: FeedingRecord) -> FeedingRecordResponseDto:
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

    def _validate_fields(
        self,
        *,
        feeding_type: str,
        breast_side: str | None,
        is_expressed: bool,
        formula_volume_ml: int | None,
        duration_minutes: int | None,
    ) -> tuple[str, str | None, bool]:
        normalized_type = (feeding_type or "").strip().lower()
        if normalized_type not in {"breast", "formula"}:
            raise ValidationError("Неверный тип кормления", code="INVALID_FEEDING_TYPE")

        normalized_side = (breast_side or "").strip().lower() or None

        if normalized_type == "breast":
            if is_expressed:
                normalized_side = None
            elif normalized_side not in {"left", "right", "both"}:
                raise ValidationError("Укажите сторону груди", code="BREAST_SIDE_REQUIRED")
            if formula_volume_ml is not None:
                raise ValidationError(
                    "Для грудного кормления объём смеси не нужен",
                    code="FORMULA_VOLUME_NOT_ALLOWED",
                )
        else:
            if formula_volume_ml is not None and formula_volume_ml <= 0:
                raise ValidationError(
                    "Объём смеси должен быть больше нуля",
                    code="INVALID_FORMULA_VOLUME",
                )
            if normalized_side is not None:
                raise ValidationError(
                    "Для смеси сторона груди не нужна",
                    code="BREAST_SIDE_NOT_ALLOWED",
                )
            if is_expressed:
                raise ValidationError(
                    "Сцеженное доступно только для грудного кормления",
                    code="EXPRESSED_NOT_ALLOWED",
                )

        if duration_minutes is not None and duration_minutes <= 0:
            raise ValidationError(
                "Длительность должна быть больше нуля",
                code="INVALID_DURATION_MINUTES",
            )
        return normalized_type, normalized_side, is_expressed

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

    async def _get_record_for_family(
        self,
        record_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> FeedingRecord:
        entity = await self._repo.get_by_id(record_id)
        if not entity:
            raise NotFoundError("Запись кормления не найдена", resource="feeding_record")
        await self._require_child_access(entity.child_id, current_account, required_level)
        return entity

    async def get_active_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> FeedingRecordResponseDto | None:
        await self._require_child_access(child_id, current_account)
        entity = await self._repo.get_active_by_child_id(child_id)
        return self._to_response(entity) if entity else None

    async def list_for_child(
        self,
        child_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[FeedingRecordResponseDto]:
        await self._require_child_access(child_id, current_account)
        items = await self._repo.get_by_child_id(child_id)
        return [self._to_response(item) for item in items]

    async def create(
        self,
        dto: FeedingRecordCreateDto,
        current_account: AuthenticatedAccount,
    ) -> FeedingRecordResponseDto:
        child = await self._require_child_access(dto.child_id, current_account, "act")
        if not child.baby_mode_enabled:
            raise ValidationError("Режим малыша выключен", code="BABY_MODE_DISABLED")

        feeding_type, breast_side, is_expressed = self._validate_fields(
            feeding_type=dto.feeding_type,
            breast_side=dto.breast_side,
            is_expressed=dto.is_expressed,
            formula_volume_ml=dto.formula_volume_ml,
            duration_minutes=dto.duration_minutes,
        )
        note = (dto.note or "").strip() or None

        recorded_at = dto.recorded_at or datetime.now(UTC)
        entity = FeedingRecord(
            id=uuid4(),
            child_id=dto.child_id,
            feeding_type=feeding_type,
            breast_side=breast_side,
            is_expressed=is_expressed,
            formula_volume_ml=dto.formula_volume_ml,
            recorded_at=recorded_at,
            started_at=None,
            ended_at=None,
            duration_minutes=dto.duration_minutes,
            status="completed",
            note=note,
            created_by_account_id=current_account.id,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def start(
        self,
        dto: FeedingRecordStartDto,
        current_account: AuthenticatedAccount,
    ) -> FeedingRecordResponseDto:
        child = await self._require_child_access(dto.child_id, current_account, "act")
        if not child.baby_mode_enabled:
            raise ValidationError("Режим малыша выключен", code="BABY_MODE_DISABLED")

        active = await self._repo.get_active_by_child_id(dto.child_id)
        if active:
            return self._to_response(active)

        feeding_type, breast_side, is_expressed = self._validate_fields(
            feeding_type=dto.feeding_type,
            breast_side=dto.breast_side,
            is_expressed=dto.is_expressed,
            formula_volume_ml=dto.formula_volume_ml,
            duration_minutes=None,
        )
        started_at = datetime.now(UTC)
        entity = FeedingRecord(
            id=uuid4(),
            child_id=dto.child_id,
            feeding_type=feeding_type,
            breast_side=breast_side,
            is_expressed=is_expressed,
            formula_volume_ml=dto.formula_volume_ml,
            recorded_at=started_at,
            started_at=started_at,
            ended_at=None,
            duration_minutes=None,
            status="active",
            note=(dto.note or "").strip() or None,
            created_by_account_id=current_account.id,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def stop(
        self,
        record_id: UUID,
        dto: FeedingRecordStopDto,
        current_account: AuthenticatedAccount,
    ) -> FeedingRecordResponseDto:
        entity = await self._get_record_for_family(record_id, current_account, "act")
        if entity.status != "active":
            return self._to_response(entity)
        if entity.created_by_account_id and entity.created_by_account_id != current_account.id:
            raise ForbiddenError("Остановить активное кормление может только тот, кто его запустил")

        ended_at = datetime.now(UTC)
        duration_minutes = max(
            0,
            int((ended_at - (entity.started_at or entity.recorded_at)).total_seconds() // 60),
        )
        if (
            entity.feeding_type == "formula"
            and dto.formula_volume_ml is not None
            and dto.formula_volume_ml <= 0
        ):
            raise ValidationError(
                "Объём смеси должен быть больше нуля",
                code="INVALID_FORMULA_VOLUME",
            )

        updated = await self._repo.update(
            FeedingRecord(
                id=entity.id,
                child_id=entity.child_id,
                feeding_type=entity.feeding_type,
                breast_side=entity.breast_side,
                is_expressed=entity.is_expressed,
                formula_volume_ml=(
                    dto.formula_volume_ml
                    if entity.feeding_type == "formula"
                    else entity.formula_volume_ml
                ),
                recorded_at=entity.recorded_at,
                started_at=entity.started_at,
                ended_at=ended_at,
                duration_minutes=duration_minutes,
                status="completed",
                note=(dto.note or "").strip() or entity.note,
                created_by_account_id=entity.created_by_account_id,
            )
        )
        return self._to_response(updated)

    async def delete(
        self,
        record_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> None:
        entity = await self._get_record_for_family(record_id, current_account, "edit")
        if entity.status == "active" and entity.created_by_account_id != current_account.id:
            raise ForbiddenError("Удалить активное кормление может только тот, кто его запустил")
        deleted = await self._repo.delete(entity.id)
        if not deleted:
            raise NotFoundError("Запись кормления не найдена", resource="feeding_record")
