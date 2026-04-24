"""Фабрики сервисов для Depends."""

from fastapi import Depends

from src.api.deps.repositories import (
    get_account_feedback_repo,
    get_account_repo,
    get_account_session_repo,
    get_administration_repo,
    get_child_repo,
    get_episode_medication_plan_repo,
    get_family_invite_repo,
    get_family_repo,
    get_feeding_record_repo,
    get_height_entry_repo,
    get_household_medicine_repo,
    get_illness_comment_repo,
    get_illness_episode_repo,
    get_medicine_catalog_repo,
    get_parent_repo,
    get_pillbox_repo,
    get_push_subscription_repo,
    get_sleep_session_repo,
    get_temperature_entry_repo,
    get_weight_entry_repo,
)
from src.application.services.account_feedback_service import AccountFeedbackService
from src.application.services.administration_service import AdministrationService
from src.application.services.auth_service import AuthService
from src.application.services.base_auth_service import BaseAuthService
from src.application.services.child_service import ChildService
from src.application.services.episode_medication_plan_service import (
    EpisodeMedicationPlanService,
)
from src.application.services.family_invite_service import FamilyInviteService
from src.application.services.family_service import FamilyService
from src.application.services.feeding_record_service import FeedingRecordService
from src.application.services.height_entry_service import HeightEntryService
from src.application.services.household_medicine_service import HouseholdMedicineService
from src.application.services.illness_comment_service import IllnessCommentService
from src.application.services.illness_episode_service import IllnessEpisodeService
from src.application.services.medicine_catalog_service import MedicineCatalogService
from src.application.services.parent_service import ParentService
from src.application.services.pillbox_service import PillboxService
from src.application.services.push_notification_service import PushNotificationService
from src.application.services.sleep_session_service import SleepSessionService
from src.application.services.temperature_entry_service import TemperatureEntryService
from src.application.services.weight_entry_service import WeightEntryService


def get_account_feedback_service(
    feedback_repo=Depends(get_account_feedback_repo),
) -> AccountFeedbackService:
    return AccountFeedbackService(feedback_repo=feedback_repo)


def get_auth_service(
    account_repo=Depends(get_account_repo),
    session_repo=Depends(get_account_session_repo),
    family_repo=Depends(get_family_repo),
    family_invite_repo=Depends(get_family_invite_repo),
    child_repo=Depends(get_child_repo),
    household_repo=Depends(get_household_medicine_repo),
    parent_repo=Depends(get_parent_repo),
) -> BaseAuthService:
    return AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=family_repo,
        family_invite_repo=family_invite_repo,
        child_repo=child_repo,
        household_repo=household_repo,
        parent_repo=parent_repo,
    )


def get_family_service(
    family_repo=Depends(get_family_repo),
    account_repo=Depends(get_account_repo),
    session_repo=Depends(get_account_session_repo),
) -> FamilyService:
    return FamilyService(
        family_repo=family_repo,
        account_repo=account_repo,
        session_repo=session_repo,
    )


def get_family_invite_service(
    family_repo=Depends(get_family_repo),
    invite_repo=Depends(get_family_invite_repo),
) -> FamilyInviteService:
    return FamilyInviteService(family_repo=family_repo, invite_repo=invite_repo)


def get_child_service(
    child_repo=Depends(get_child_repo),
    family_repo=Depends(get_family_repo),
) -> ChildService:
    return ChildService(child_repo=child_repo, family_repo=family_repo)


def get_feeding_record_service(
    feeding_repo=Depends(get_feeding_record_repo),
    child_repo=Depends(get_child_repo),
) -> FeedingRecordService:
    return FeedingRecordService(feeding_repo=feeding_repo, child_repo=child_repo)


def get_height_entry_service(
    height_repo=Depends(get_height_entry_repo),
    child_repo=Depends(get_child_repo),
) -> HeightEntryService:
    return HeightEntryService(height_repo=height_repo, child_repo=child_repo)


def get_episode_medication_plan_service(
    plan_repo=Depends(get_episode_medication_plan_repo),
    episode_repo=Depends(get_illness_episode_repo),
    household_repo=Depends(get_household_medicine_repo),
    child_repo=Depends(get_child_repo),
    account_repo=Depends(get_account_repo),
) -> EpisodeMedicationPlanService:
    return EpisodeMedicationPlanService(
        plan_repo=plan_repo,
        episode_repo=episode_repo,
        household_repo=household_repo,
        child_repo=child_repo,
        account_repo=account_repo,
    )


def get_parent_service(
    account_repo=Depends(get_account_repo),
    family_repo=Depends(get_family_repo),
) -> ParentService:
    return ParentService(account_repo=account_repo, family_repo=family_repo)


def get_pillbox_service(
    pillbox_repo=Depends(get_pillbox_repo),
    account_repo=Depends(get_account_repo),
    household_repo=Depends(get_household_medicine_repo),
) -> PillboxService:
    return PillboxService(
        pillbox_repo=pillbox_repo,
        account_repo=account_repo,
        household_repo=household_repo,
    )


def get_push_notification_service(
    subscription_repo=Depends(get_push_subscription_repo),
    account_repo=Depends(get_account_repo),
) -> PushNotificationService:
    return PushNotificationService(subscription_repo=subscription_repo, account_repo=account_repo)


def get_weight_entry_service(
    weight_repo=Depends(get_weight_entry_repo),
    child_repo=Depends(get_child_repo),
) -> WeightEntryService:
    return WeightEntryService(weight_repo=weight_repo, child_repo=child_repo)


def get_sleep_session_service(
    sleep_repo=Depends(get_sleep_session_repo),
    child_repo=Depends(get_child_repo),
) -> SleepSessionService:
    return SleepSessionService(sleep_repo=sleep_repo, child_repo=child_repo)


def get_medicine_catalog_service(
    catalog_repo=Depends(get_medicine_catalog_repo),
) -> MedicineCatalogService:
    return MedicineCatalogService(catalog_repo=catalog_repo)


def get_household_medicine_service(
    household_repo=Depends(get_household_medicine_repo),
    family_repo=Depends(get_family_repo),
    catalog_repo=Depends(get_medicine_catalog_repo),
    administration_repo=Depends(get_administration_repo),
    plan_repo=Depends(get_episode_medication_plan_repo),
) -> HouseholdMedicineService:
    return HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=family_repo,
        catalog_repo=catalog_repo,
        administration_repo=administration_repo,
        plan_repo=plan_repo,
    )


def get_illness_episode_service(
    episode_repo=Depends(get_illness_episode_repo),
    child_repo=Depends(get_child_repo),
    account_repo=Depends(get_account_repo),
    temperature_repo=Depends(get_temperature_entry_repo),
    administration_repo=Depends(get_administration_repo),
    comment_repo=Depends(get_illness_comment_repo),
) -> IllnessEpisodeService:
    return IllnessEpisodeService(
        episode_repo=episode_repo,
        child_repo=child_repo,
        account_repo=account_repo,
        temperature_repo=temperature_repo,
        administration_repo=administration_repo,
        comment_repo=comment_repo,
    )


def get_illness_comment_service(
    comment_repo=Depends(get_illness_comment_repo),
    episode_repo=Depends(get_illness_episode_repo),
    child_repo=Depends(get_child_repo),
) -> IllnessCommentService:
    return IllnessCommentService(
        comment_repo=comment_repo,
        episode_repo=episode_repo,
        child_repo=child_repo,
    )


def get_temperature_entry_service(
    temperature_repo=Depends(get_temperature_entry_repo),
    episode_repo=Depends(get_illness_episode_repo),
    child_repo=Depends(get_child_repo),
) -> TemperatureEntryService:
    return TemperatureEntryService(
        temperature_repo=temperature_repo,
        episode_repo=episode_repo,
        child_repo=child_repo,
    )


def get_administration_service(
    administration_repo=Depends(get_administration_repo),
    household_repo=Depends(get_household_medicine_repo),
    episode_repo=Depends(get_illness_episode_repo),
    child_repo=Depends(get_child_repo),
) -> AdministrationService:
    return AdministrationService(
        administration_repo=administration_repo,
        household_repo=household_repo,
        episode_repo=episode_repo,
        child_repo=child_repo,
    )
