"""Сервис приёмов лекарств (с проходом через Safety Engine)."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.administration_event import (
    AdministrationEventCreateDto,
    AdministrationEventResponseDto,
)
from src.application.dto.auth import AuthenticatedAccount
from src.application.services.access_control import (
    coerce_account_context,
    get_child_for_account,
)
from src.application.services.child_plan_access import ensure_active_illness_continuation_allowed
from src.application.services.safety_engine import check_household_medicine_for_administration
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.administration_event import AdministrationEvent
from src.domain.entities.child import Child
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class AdministrationService:
    """Сервис журнала приёмов: проверка Safety Engine и фиксация приёма."""

    DUPLICATE_WINDOW_SECONDS = 30

    def __init__(
        self,
        administration_repo: AdministrationEventRepository,
        household_repo: HouseholdMedicineRepository,
        episode_repo: IllnessEpisodeRepository,
        child_repo: ChildRepository,
        family_repo: FamilyRepository | None = None,
    ) -> None:
        self._repo = administration_repo
        self._household_repo = household_repo
        self._episode_repo = episode_repo
        self._child_repo = child_repo
        self._family_repo = family_repo

    def _to_response(self, entity: AdministrationEvent) -> AdministrationEventResponseDto:
        return AdministrationEventResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            household_medicine_id=entity.household_medicine_id,
            custom_medicine_name=entity.custom_medicine_name,
            administered_at=entity.administered_at,
            administered_by_account_id=entity.administered_by_account_id,
            administered_by_name_snapshot=entity.administered_by_name_snapshot,
            amount=entity.amount,
            unit=entity.unit,
            reason=entity.reason,
        )

    @staticmethod
    def _normalize_optional_string(value: str | None) -> str | None:
        normalized = (value or "").strip()
        return normalized or None

    @classmethod
    def _normalize_medicine_name(cls, value: str | None) -> str | None:
        normalized = cls._normalize_optional_string(value)
        return normalized.casefold() if normalized else None

    @classmethod
    def _normalize_amount(cls, value: str | None) -> str:
        return cls._normalize_optional_string(value) or ""

    @classmethod
    def _is_duplicate_event(
        cls,
        existing: AdministrationEvent,
        *,
        household_medicine_id: UUID | None,
        custom_medicine_name: str | None,
        amount: str,
        administered_at: datetime,
    ) -> bool:
        same_medicine = (
            existing.household_medicine_id == household_medicine_id
            if household_medicine_id
            else cls._normalize_medicine_name(existing.custom_medicine_name)
            == cls._normalize_medicine_name(custom_medicine_name)
        )
        if not same_medicine:
            return False
        if cls._normalize_amount(existing.amount) != cls._normalize_amount(amount):
            return False
        diff_seconds = abs((existing.administered_at - administered_at).total_seconds())
        return diff_seconds <= cls.DUPLICATE_WINDOW_SECONDS

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

    async def _get_episode_for_account(
        self,
        episode_id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> IllnessEpisode:
        episode = await self._episode_repo.get_by_id(episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        await self._require_child_access(episode.child_id, current_account, required_level)
        return episode

    async def _get_household_for_account(
        self,
        household_medicine_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> HouseholdMedicine:
        current_account = coerce_account_context(current_account)
        household = await self._household_repo.get_by_id(household_medicine_id)
        if not household:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if household.family_id != current_account.family_id:
            raise ForbiddenError("Нет доступа к упаковке из другой семьи")
        return household

    async def _get_event_for_account(
        self,
        id: UUID,
        current_account: AuthenticatedAccount,
        required_level: str = "view",
    ) -> AdministrationEvent:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись приёма не найдена", resource="administration_event")
        await self._get_episode_for_account(entity.episode_id, current_account, required_level)
        return entity

    async def get_by_id(
        self, id: UUID, current_account: AuthenticatedAccount
    ) -> AdministrationEventResponseDto:
        return self._to_response(await self._get_event_for_account(id, current_account))

    async def get_by_episode_id(
        self,
        episode_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[AdministrationEventResponseDto]:
        await self._get_episode_for_account(episode_id, current_account)
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(e) for e in entities]

    async def create(
        self,
        dto: AdministrationEventCreateDto,
        current_account: AuthenticatedAccount,
        administered_by_account_id: UUID,
        administered_by_name_snapshot: str,
    ) -> AdministrationEventResponseDto:
        current_account = coerce_account_context(current_account)
        episode = await self._get_episode_for_account(dto.episode_id, current_account, "act")
        await ensure_active_illness_continuation_allowed(
            self._family_repo,
            current_account,
            episode.child_id,
            episode_is_active=episode.status == "active",
        )
        if episode.status != "active":
            raise ValidationError("Эпизод закрыт, приёмы добавлять нельзя")
        if not dto.household_medicine_id and not (dto.custom_medicine_name or "").strip():
            raise ValidationError("Укажи препарат из аптечки или введи название вручную")

        household = None
        custom_medicine_name = self._normalize_optional_string(dto.custom_medicine_name)
        if dto.household_medicine_id:
            household = await self._get_household_for_account(
                dto.household_medicine_id, current_account
            )
            check_household_medicine_for_administration(household)
        administered_at = dto.administered_at or datetime.now(UTC)
        normalized_amount = self._normalize_amount(dto.amount)
        existing_events = await self._repo.get_by_episode_id(dto.episode_id)
        duplicate_event = next(
            (
                event
                for event in existing_events
                if self._is_duplicate_event(
                    event,
                    household_medicine_id=dto.household_medicine_id,
                    custom_medicine_name=custom_medicine_name,
                    amount=normalized_amount,
                    administered_at=administered_at,
                )
            ),
            None,
        )
        if duplicate_event:
            return self._to_response(duplicate_event)
        entity = AdministrationEvent(
            id=uuid4(),
            episode_id=dto.episode_id,
            household_medicine_id=dto.household_medicine_id,
            custom_medicine_name=custom_medicine_name,
            administered_at=administered_at,
            administered_by_account_id=administered_by_account_id,
            administered_by_name_snapshot=administered_by_name_snapshot.strip() or None,
            amount=normalized_amount,
            unit=dto.unit,
            reason=dto.reason,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        entity = await self._get_event_for_account(id, current_account, "edit")
        episode = await self._get_episode_for_account(entity.episode_id, current_account, "edit")
        await ensure_active_illness_continuation_allowed(
            self._family_repo,
            current_account,
            episode.child_id,
            episode_is_active=episode.status == "active",
        )
        await self._repo.delete(id)
