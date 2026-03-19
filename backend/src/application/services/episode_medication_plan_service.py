"""Сервис guided-планов лекарства внутри эпизода."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.episode_medication_plan import (
    EpisodeMedicationPlanCreateDto,
    EpisodeMedicationPlanResponseDto,
    EpisodeMedicationPlanUpdateDto,
)
from src.core.exceptions import NotFoundError, ValidationError
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.repositories.episode_medication_plan_repository import (
    EpisodeMedicationPlanRepository,
)
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository


class EpisodeMedicationPlanService:
    """Сервис optional guided-планов лекарства."""

    DEFAULT_REMINDER_BEFORE_MINUTES = 10

    def __init__(
        self,
        plan_repo: EpisodeMedicationPlanRepository,
        episode_repo: IllnessEpisodeRepository,
        household_repo: HouseholdMedicineRepository,
    ) -> None:
        self._repo = plan_repo
        self._episode_repo = episode_repo
        self._household_repo = household_repo

    def _to_response(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlanResponseDto:
        return EpisodeMedicationPlanResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            household_medicine_id=entity.household_medicine_id,
            dose_amount=entity.dose_amount,
            min_interval_minutes=entity.min_interval_minutes,
            max_doses_per_day=entity.max_doses_per_day,
            weight_kg=entity.weight_kg,
            dose_mg_per_kg=entity.dose_mg_per_kg,
            notes=entity.notes,
            created_at=entity.created_at,
        )

    async def get_by_episode_id(self, episode_id: UUID) -> list[EpisodeMedicationPlanResponseDto]:
        if await self._episode_repo.get_by_id(episode_id) is None:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(entity) for entity in entities]

    async def create(
        self, dto: EpisodeMedicationPlanCreateDto
    ) -> EpisodeMedicationPlanResponseDto:
        episode = await self._episode_repo.get_by_id(dto.episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        if episode.status != "active":
            raise ValidationError("Для закрытого эпизода план лекарства создавать нельзя")

        household = await self._household_repo.get_by_id(dto.household_medicine_id)
        if not household:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")

        existing = await self._repo.get_by_episode_and_medicine(
            dto.episode_id, dto.household_medicine_id
        )
        if existing:
            raise ValidationError("Для этой упаковки уже есть план внутри эпизода")

        entity = EpisodeMedicationPlan(
            id=uuid4(),
            episode_id=dto.episode_id,
            household_medicine_id=dto.household_medicine_id,
            dose_amount=dto.dose_amount.strip(),
            min_interval_minutes=dto.min_interval_minutes,
            max_doses_per_day=dto.max_doses_per_day,
            weight_kg=dto.weight_kg,
            dose_mg_per_kg=dto.dose_mg_per_kg,
            notes=dto.notes.strip() if dto.notes else None,
            reminders_enabled=True,
            reminder_before_minutes=self.DEFAULT_REMINDER_BEFORE_MINUTES,
            notify_at_due=True,
            last_before_notification_for_at=None,
            last_due_notification_for_at=None,
            created_at=datetime.now(UTC),
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(
        self, id: UUID, dto: EpisodeMedicationPlanUpdateDto
    ) -> EpisodeMedicationPlanResponseDto:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("План лекарства не найден", resource="episode_medication_plan")

        episode = await self._episode_repo.get_by_id(entity.episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        if episode.status != "active":
            raise ValidationError("Для закрытого эпизода план лекарства обновлять нельзя")

        fields_set = dto.model_fields_set
        household_medicine_id = (
            dto.household_medicine_id
            if "household_medicine_id" in fields_set
            else entity.household_medicine_id
        )
        dose_amount = dto.dose_amount.strip() if "dose_amount" in fields_set and dto.dose_amount else (
            entity.dose_amount
        )
        min_interval_minutes = (
            dto.min_interval_minutes
            if "min_interval_minutes" in fields_set
            else entity.min_interval_minutes
        )
        max_doses_per_day = (
            dto.max_doses_per_day if "max_doses_per_day" in fields_set else entity.max_doses_per_day
        )
        weight_kg = dto.weight_kg if "weight_kg" in fields_set else entity.weight_kg
        dose_mg_per_kg = (
            dto.dose_mg_per_kg if "dose_mg_per_kg" in fields_set else entity.dose_mg_per_kg
        )
        notes = dto.notes.strip() if "notes" in fields_set and dto.notes else (
            None if "notes" in fields_set else entity.notes
        )
        household = await self._household_repo.get_by_id(household_medicine_id)
        if not household:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")

        existing = await self._repo.get_by_episode_and_medicine(entity.episode_id, household_medicine_id)
        if existing and existing.id != entity.id:
            raise ValidationError("Для этой упаковки уже есть другой план внутри эпизода")

        updated = await self._repo.update(
            EpisodeMedicationPlan(
                id=entity.id,
                episode_id=entity.episode_id,
                household_medicine_id=household_medicine_id,
                dose_amount=dose_amount,
                min_interval_minutes=min_interval_minutes,
                max_doses_per_day=max_doses_per_day,
                weight_kg=weight_kg,
                dose_mg_per_kg=dose_mg_per_kg,
                notes=notes,
                reminders_enabled=True,
                reminder_before_minutes=self.DEFAULT_REMINDER_BEFORE_MINUTES,
                notify_at_due=True,
                last_before_notification_for_at=entity.last_before_notification_for_at,
                last_due_notification_for_at=entity.last_due_notification_for_at,
                created_at=entity.created_at,
            )
        )
        return self._to_response(updated)

    async def delete(self, id: UUID) -> None:
        if await self._repo.get_by_id(id) is None:
            raise NotFoundError("План лекарства не найден", resource="episode_medication_plan")
        await self._repo.delete(id)
