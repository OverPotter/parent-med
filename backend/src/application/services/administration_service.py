"""Сервис приёмов лекарств (с проходом через Safety Engine)."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.administration_event import (
    AdministrationEventCreateDto,
    AdministrationEventResponseDto,
)
from src.application.services.safety_engine import check_household_medicine_for_administration
from src.core.exceptions import NotFoundError
from src.domain.entities.administration_event import AdministrationEvent
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class AdministrationService:
    """Сервис журнала приёмов: проверка Safety Engine и фиксация приёма."""

    def __init__(
        self,
        administration_repo: AdministrationEventRepository,
        household_repo: HouseholdMedicineRepository,
        episode_repo: IllnessEpisodeRepository,
    ) -> None:
        self._repo = administration_repo
        self._household_repo = household_repo
        self._episode_repo = episode_repo

    def _to_response(self, entity: AdministrationEvent) -> AdministrationEventResponseDto:
        return AdministrationEventResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            household_medicine_id=entity.household_medicine_id,
            administered_at=entity.administered_at,
            amount=entity.amount,
            unit=entity.unit,
            reason=entity.reason,
        )

    async def get_by_id(self, id: UUID) -> AdministrationEventResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("Запись приёма не найдена", resource="administration_event")
        return self._to_response(entity)

    async def get_by_episode_id(self, episode_id: UUID) -> list[AdministrationEventResponseDto]:
        if await self._episode_repo.get_by_id(episode_id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(e) for e in entities]

    async def create(self, dto: AdministrationEventCreateDto) -> AdministrationEventResponseDto:
        episode = await self._episode_repo.get_by_id(dto.episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        if episode.status != "active":
            raise NotFoundError(
                "Эпизод закрыт, приёмы добавлять нельзя", resource="illness_episode"
            )
        household = await self._household_repo.get_by_id(dto.household_medicine_id)
        if not household:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        check_household_medicine_for_administration(household)
        administered_at = dto.administered_at or datetime.now(UTC)
        entity = AdministrationEvent(
            id=uuid4(),
            episode_id=dto.episode_id,
            household_medicine_id=dto.household_medicine_id,
            administered_at=administered_at,
            amount=dto.amount,
            unit=dto.unit,
            reason=dto.reason,
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("Запись приёма не найдена", resource="administration_event")
        await self._repo.delete(id)
