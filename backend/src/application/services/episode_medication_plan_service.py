"""Сервис guided-планов лекарства внутри эпизода."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.episode_medication_plan import (
    EpisodeMedicationPlanCreateDto,
    EpisodeMedicationPlanResponseDto,
    EpisodeMedicationPlanUpdateDto,
)
from src.application.services.access_control import (
    get_child_for_account,
)
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.child import Child
from src.domain.entities.episode_medication_plan import EpisodeMedicationPlan
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.entities.illness_episode import IllnessEpisode
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.child_repository import ChildRepository
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
        child_repo: ChildRepository,
        account_repo: AccountRepository,
    ) -> None:
        self._repo = plan_repo
        self._episode_repo = episode_repo
        self._household_repo = household_repo
        self._child_repo = child_repo
        self._account_repo = account_repo

    @staticmethod
    def _normalize_manual_name(value: str | None) -> str:
        return (value or "").strip().casefold()

    def _to_response(self, entity: EpisodeMedicationPlan) -> EpisodeMedicationPlanResponseDto:
        return EpisodeMedicationPlanResponseDto(
            id=entity.id,
            episode_id=entity.episode_id,
            household_medicine_id=entity.household_medicine_id,
            custom_medicine_name=entity.custom_medicine_name,
            dose_amount=entity.dose_amount,
            min_interval_minutes=entity.min_interval_minutes,
            max_doses_per_day=entity.max_doses_per_day,
            weight_kg=entity.weight_kg,
            dose_mg_per_kg=entity.dose_mg_per_kg,
            notes=entity.notes,
            member_account_ids=list(entity.member_account_ids),
            created_at=entity.created_at,
        )

    async def _resolve_member_account_ids(
        self,
        requested_member_ids: list[UUID] | None,
        current_family_id: UUID,
        child_id: UUID,
    ) -> list[UUID]:
        accounts = await self._account_repo.list_by_family_id(current_family_id)
        if not accounts:
            raise ValidationError("В семье нет участников для напоминаний")
        family_account_ids = {account.id for account in accounts}
        if requested_member_ids is None:
            return []
        normalized_ids = list(dict.fromkeys(requested_member_ids))
        invalid_ids = [
            account_id for account_id in normalized_ids if account_id not in family_account_ids
        ]
        if invalid_ids:
            raise ForbiddenError("Нельзя выбрать получателей из другой семьи")
        eligible_account_ids = {
            account.id
            for account in accounts
            if self._can_receive_illness_signals_for_child(account, child_id)
        }
        ineligible_ids = [
            account_id for account_id in normalized_ids if account_id not in eligible_account_ids
        ]
        if ineligible_ids:
            raise ForbiddenError("Нельзя выбрать получателей без доступа к ребёнку")
        return normalized_ids

    def _can_receive_illness_signals_for_child(self, account: object, child_id: UUID) -> bool:
        policy = getattr(account, "access_policy", None)
        if policy is None:
            return False
        if getattr(policy, "all_children", False):
            return True
        return child_id in set(getattr(policy, "child_ids", []))

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
        current_family_id: UUID,
    ) -> HouseholdMedicine:
        household = await self._household_repo.get_by_id(household_medicine_id)
        if not household:
            raise NotFoundError("Упаковка не найдена", resource="household_medicine")
        if household.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к упаковке из другой семьи")
        return household

    async def _get_plan_for_account(
        self,
        id: UUID,
        current_family_id: UUID,
    ) -> EpisodeMedicationPlan:
        entity = await self._repo.get_by_id(id)
        if not entity:
            raise NotFoundError("План лекарства не найден", resource="episode_medication_plan")
        episode = await self._episode_repo.get_by_id(entity.episode_id)
        if not episode:
            raise NotFoundError("Эпизод болезни не найден", resource="illness_episode")
        child = await self._child_repo.get_by_id(episode.child_id)
        if not child or child.family_id != current_family_id:
            raise ForbiddenError("Нет доступа к ребёнку из другой семьи")
        return entity

    async def get_by_episode_id(
        self,
        episode_id: UUID,
        current_account: AuthenticatedAccount,
    ) -> list[EpisodeMedicationPlanResponseDto]:
        await self._get_episode_for_account(episode_id, current_account)
        entities = await self._repo.get_by_episode_id(episode_id)
        return [self._to_response(entity) for entity in entities]

    async def create(
        self,
        dto: EpisodeMedicationPlanCreateDto,
        current_account: AuthenticatedAccount,
    ) -> EpisodeMedicationPlanResponseDto:
        episode = await self._get_episode_for_account(dto.episode_id, current_account, "edit")
        if episode.status != "active":
            raise ValidationError("Для закрытого эпизода план лекарства создавать нельзя")
        member_account_ids = await self._resolve_member_account_ids(
            dto.member_account_ids,
            current_account.family_id,
            episode.child_id,
        )

        household_medicine_id = dto.household_medicine_id
        custom_medicine_name = (dto.custom_medicine_name or "").strip() or None
        if not household_medicine_id and not custom_medicine_name:
            raise ValidationError("Выбери лекарство из аптечки или введи название вручную")

        if household_medicine_id:
            await self._get_household_for_account(household_medicine_id, current_account.family_id)

            existing = await self._repo.get_by_episode_and_medicine(
                dto.episode_id, household_medicine_id
            )
            if existing:
                raise ValidationError("Для этой упаковки уже есть план внутри эпизода")
        else:
            existing_plans = await self._repo.get_by_episode_id(dto.episode_id)
            if any(
                self._normalize_manual_name(plan.custom_medicine_name)
                == self._normalize_manual_name(custom_medicine_name)
                for plan in existing_plans
            ):
                raise ValidationError("Для этого лекарства уже есть план внутри эпизода")

        entity = EpisodeMedicationPlan(
            id=uuid4(),
            episode_id=dto.episode_id,
            household_medicine_id=household_medicine_id,
            custom_medicine_name=custom_medicine_name,
            dose_amount=dto.dose_amount.strip(),
            min_interval_minutes=dto.min_interval_minutes,
            max_doses_per_day=dto.max_doses_per_day,
            weight_kg=dto.weight_kg,
            dose_mg_per_kg=dto.dose_mg_per_kg,
            notes=dto.notes.strip() if dto.notes else None,
            member_account_ids=member_account_ids,
            reminders_enabled=True,
            reminder_before_minutes=self.DEFAULT_REMINDER_BEFORE_MINUTES,
            notify_at_due=True,
            last_before_notification_for_at=None,
            last_due_notification_for_at=None,
            last_overdue_notification_for_at=None,
            created_at=datetime.now(UTC),
        )
        created = await self._repo.add(entity)
        return self._to_response(created)

    async def update(
        self,
        id: UUID,
        dto: EpisodeMedicationPlanUpdateDto,
        current_account: AuthenticatedAccount,
    ) -> EpisodeMedicationPlanResponseDto:
        entity = await self._get_plan_for_account(id, current_account.family_id)

        episode = await self._get_episode_for_account(entity.episode_id, current_account, "edit")
        if episode.status != "active":
            raise ValidationError("Для закрытого эпизода план лекарства обновлять нельзя")

        fields_set = dto.model_fields_set
        household_medicine_id = (
            dto.household_medicine_id
            if "household_medicine_id" in fields_set
            else entity.household_medicine_id
        )
        custom_medicine_name = (
            dto.custom_medicine_name.strip()
            if "custom_medicine_name" in fields_set and dto.custom_medicine_name
            else (None if "custom_medicine_name" in fields_set else entity.custom_medicine_name)
        )
        dose_amount = (
            dto.dose_amount.strip()
            if "dose_amount" in fields_set and dto.dose_amount
            else entity.dose_amount
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
        notes = (
            dto.notes.strip()
            if "notes" in fields_set and dto.notes
            else (None if "notes" in fields_set else entity.notes)
        )
        member_account_ids = (
            await self._resolve_member_account_ids(
                dto.member_account_ids,
                current_account.family_id,
                episode.child_id,
            )
            if "member_account_ids" in fields_set
            else list(entity.member_account_ids)
        )
        if not household_medicine_id and not custom_medicine_name:
            raise ValidationError("Выбери лекарство из аптечки или введи название вручную")

        if household_medicine_id:
            await self._get_household_for_account(
                household_medicine_id, current_account.family_id
            )

            existing = await self._repo.get_by_episode_and_medicine(
                entity.episode_id,
                household_medicine_id,
            )
            if existing and existing.id != entity.id:
                raise ValidationError("Для этой упаковки уже есть другой план внутри эпизода")
        else:
            existing_plans = await self._repo.get_by_episode_id(entity.episode_id)
            if any(
                plan.id != entity.id
                and self._normalize_manual_name(plan.custom_medicine_name)
                == self._normalize_manual_name(custom_medicine_name)
                for plan in existing_plans
            ):
                raise ValidationError("Для этого лекарства уже есть другой план внутри эпизода")

        updated = await self._repo.update(
            EpisodeMedicationPlan(
                id=entity.id,
                episode_id=entity.episode_id,
                household_medicine_id=household_medicine_id,
                custom_medicine_name=custom_medicine_name,
                dose_amount=dose_amount,
                min_interval_minutes=min_interval_minutes,
                max_doses_per_day=max_doses_per_day,
                weight_kg=weight_kg,
                dose_mg_per_kg=dose_mg_per_kg,
                notes=notes,
                member_account_ids=member_account_ids,
                reminders_enabled=True,
                reminder_before_minutes=self.DEFAULT_REMINDER_BEFORE_MINUTES,
                notify_at_due=True,
                last_before_notification_for_at=entity.last_before_notification_for_at,
                last_due_notification_for_at=entity.last_due_notification_for_at,
                last_overdue_notification_for_at=entity.last_overdue_notification_for_at,
                created_at=entity.created_at,
            )
        )
        return self._to_response(updated)

    async def delete(self, id: UUID, current_account: AuthenticatedAccount) -> None:
        entity = await self._get_plan_for_account(id, current_account.family_id)
        await self._get_episode_for_account(entity.episode_id, current_account, "edit")
        await self._repo.delete(id)
