"""Фабрики репозиториев (инфраструктура) для Depends."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.database import get_db_session
from src.core.lifespan import get_async_session_factory
from src.domain.repositories.account_feedback_repository import AccountFeedbackRepository
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.auth_attempt_repository import AuthAttemptRepository
from src.domain.repositories.billing_event_repository import BillingEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.curated_medicine_catalog_repository import (
    CuratedMedicineCatalogRepository,
)
from src.domain.repositories.episode_medication_plan_repository import (
    EpisodeMedicationPlanRepository,
)
from src.domain.repositories.family_invite_repository import FamilyInviteRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.domain.repositories.height_entry_repository import HeightEntryRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.parent_repository import ParentRepository
from src.domain.repositories.pillbox_repository import PillboxRepository
from src.domain.repositories.plan_repository import PlanRepository
from src.domain.repositories.public_support_request_repository import (
    PublicSupportRequestRepository,
)
from src.domain.repositories.push_subscription_repository import PushSubscriptionRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.domain.repositories.subscription_repository import SubscriptionRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository
from src.infrastructure.database.repositories.account_feedback_repository import (
    SqlAccountFeedbackRepository,
)
from src.infrastructure.database.repositories.account_repository import SqlAccountRepository
from src.infrastructure.database.repositories.account_session_repository import (
    SqlAccountSessionRepository,
)
from src.infrastructure.database.repositories.administration_event_repository import (
    SqlAdministrationEventRepository,
)
from src.infrastructure.database.repositories.auth_attempt_repository import (
    SqlAuthAttemptRepository,
)
from src.infrastructure.database.repositories.billing_event_repository import (
    SqlBillingEventRepository,
)
from src.infrastructure.database.repositories.child_repository import SqlChildRepository
from src.infrastructure.database.repositories.curated_medicine_catalog_repository import (
    SqlCuratedMedicineCatalogRepository,
)
from src.infrastructure.database.repositories.episode_medication_plan_repository import (
    SqlEpisodeMedicationPlanRepository,
)
from src.infrastructure.database.repositories.family_invite_repository import (
    SqlFamilyInviteRepository,
)
from src.infrastructure.database.repositories.family_repository import SqlFamilyRepository
from src.infrastructure.database.repositories.feeding_record_repository import (
    SqlFeedingRecordRepository,
)
from src.infrastructure.database.repositories.height_entry_repository import (
    SqlHeightEntryRepository,
)
from src.infrastructure.database.repositories.household_medicine_repository import (
    SqlHouseholdMedicineRepository,
)
from src.infrastructure.database.repositories.illness_comment_repository import (
    SqlIllnessCommentRepository,
)
from src.infrastructure.database.repositories.illness_episode_repository import (
    SqlIllnessEpisodeRepository,
)
from src.infrastructure.database.repositories.parent_repository import SqlParentRepository
from src.infrastructure.database.repositories.pillbox_repository import SqlPillboxRepository
from src.infrastructure.database.repositories.plan_repository import SqlPlanRepository
from src.infrastructure.database.repositories.public_support_request_repository import (
    SqlPublicSupportRequestRepository,
)
from src.infrastructure.database.repositories.push_subscription_repository import (
    SqlPushSubscriptionRepository,
)
from src.infrastructure.database.repositories.sleep_session_repository import (
    SqlSleepSessionRepository,
)
from src.infrastructure.database.repositories.subscription_repository import (
    SqlSubscriptionRepository,
)
from src.infrastructure.database.repositories.temperature_entry_repository import (
    SqlTemperatureEntryRepository,
)
from src.infrastructure.database.repositories.weight_entry_repository import (
    SqlWeightEntryRepository,
)


def get_account_repo(session: AsyncSession = Depends(get_db_session)) -> AccountRepository:
    return SqlAccountRepository(session)


def get_account_feedback_repo(
    session: AsyncSession = Depends(get_db_session),
) -> AccountFeedbackRepository:
    return SqlAccountFeedbackRepository(session)


def get_account_session_repo(
    session: AsyncSession = Depends(get_db_session),
) -> AccountSessionRepository:
    return SqlAccountSessionRepository(session)


def get_auth_attempt_repo() -> AuthAttemptRepository:
    return SqlAuthAttemptRepository(get_async_session_factory())


def get_billing_event_repo(
    session: AsyncSession = Depends(get_db_session),
) -> BillingEventRepository:
    return SqlBillingEventRepository(session)


def get_family_repo(session: AsyncSession = Depends(get_db_session)) -> FamilyRepository:
    return SqlFamilyRepository(session)


def get_family_invite_repo(
    session: AsyncSession = Depends(get_db_session),
) -> FamilyInviteRepository:
    return SqlFamilyInviteRepository(session)


def get_child_repo(session: AsyncSession = Depends(get_db_session)) -> ChildRepository:
    return SqlChildRepository(session)


def get_curated_medicine_catalog_repo(
    session: AsyncSession = Depends(get_db_session),
) -> CuratedMedicineCatalogRepository:
    return SqlCuratedMedicineCatalogRepository(session)


def get_feeding_record_repo(
    session: AsyncSession = Depends(get_db_session),
) -> FeedingRecordRepository:
    return SqlFeedingRecordRepository(session)


def get_height_entry_repo(
    session: AsyncSession = Depends(get_db_session),
) -> HeightEntryRepository:
    return SqlHeightEntryRepository(session)


def get_episode_medication_plan_repo(
    session: AsyncSession = Depends(get_db_session),
) -> EpisodeMedicationPlanRepository:
    return SqlEpisodeMedicationPlanRepository(session)


def get_parent_repo(session: AsyncSession = Depends(get_db_session)) -> ParentRepository:
    return SqlParentRepository(session)


def get_plan_repo(session: AsyncSession = Depends(get_db_session)) -> PlanRepository:
    return SqlPlanRepository(session)


def get_public_support_request_repo(
    session: AsyncSession = Depends(get_db_session),
) -> PublicSupportRequestRepository:
    return SqlPublicSupportRequestRepository(session)


def get_pillbox_repo(session: AsyncSession = Depends(get_db_session)) -> PillboxRepository:
    return SqlPillboxRepository(session)


def get_push_subscription_repo(
    session: AsyncSession = Depends(get_db_session),
) -> PushSubscriptionRepository:
    return SqlPushSubscriptionRepository(session)


def get_weight_entry_repo(
    session: AsyncSession = Depends(get_db_session),
) -> WeightEntryRepository:
    return SqlWeightEntryRepository(session)


def get_sleep_session_repo(
    session: AsyncSession = Depends(get_db_session),
) -> SleepSessionRepository:
    return SqlSleepSessionRepository(session)


def get_subscription_repo(
    session: AsyncSession = Depends(get_db_session),
) -> SubscriptionRepository:
    return SqlSubscriptionRepository(session)


def get_household_medicine_repo(
    session: AsyncSession = Depends(get_db_session),
) -> HouseholdMedicineRepository:
    return SqlHouseholdMedicineRepository(session)


def get_illness_episode_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IllnessEpisodeRepository:
    return SqlIllnessEpisodeRepository(session)


def get_illness_comment_repo(
    session: AsyncSession = Depends(get_db_session),
) -> IllnessCommentRepository:
    return SqlIllnessCommentRepository(session)


def get_temperature_entry_repo(
    session: AsyncSession = Depends(get_db_session),
) -> TemperatureEntryRepository:
    return SqlTemperatureEntryRepository(session)


def get_administration_repo(
    session: AsyncSession = Depends(get_db_session),
) -> AdministrationEventRepository:
    return SqlAdministrationEventRepository(session)
