"""Фабрики сервисов для Depends."""

from fastapi import Depends

from src.api.deps.repositories import (
    get_account_repo,
    get_account_session_repo,
    get_administration_repo,
    get_child_repo,
    get_family_repo,
    get_household_medicine_repo,
    get_illness_episode_repo,
    get_medicine_catalog_repo,
    get_parent_repo,
    get_temperature_entry_repo,
    get_weight_entry_repo,
)
from src.application.services.administration_service import AdministrationService
from src.application.services.auth_service import AuthService
from src.application.services.base_auth_service import BaseAuthService
from src.application.services.child_service import ChildService
from src.application.services.family_service import FamilyService
from src.application.services.household_medicine_service import HouseholdMedicineService
from src.application.services.illness_episode_service import IllnessEpisodeService
from src.application.services.medicine_catalog_service import MedicineCatalogService
from src.application.services.parent_service import ParentService
from src.application.services.temperature_entry_service import TemperatureEntryService
from src.application.services.weight_entry_service import WeightEntryService


def get_auth_service(
    account_repo=Depends(get_account_repo),
    session_repo=Depends(get_account_session_repo),
    family_repo=Depends(get_family_repo),
) -> BaseAuthService:
    return AuthService(
        account_repo=account_repo,
        session_repo=session_repo,
        family_repo=family_repo,
    )


def get_family_service(
    family_repo=Depends(get_family_repo),
) -> FamilyService:
    return FamilyService(family_repo=family_repo)


def get_child_service(
    child_repo=Depends(get_child_repo),
    family_repo=Depends(get_family_repo),
) -> ChildService:
    return ChildService(child_repo=child_repo, family_repo=family_repo)


def get_parent_service(
    parent_repo=Depends(get_parent_repo),
    family_repo=Depends(get_family_repo),
) -> ParentService:
    return ParentService(parent_repo=parent_repo, family_repo=family_repo)


def get_weight_entry_service(
    weight_repo=Depends(get_weight_entry_repo),
    child_repo=Depends(get_child_repo),
) -> WeightEntryService:
    return WeightEntryService(weight_repo=weight_repo, child_repo=child_repo)


def get_medicine_catalog_service(
    catalog_repo=Depends(get_medicine_catalog_repo),
) -> MedicineCatalogService:
    return MedicineCatalogService(catalog_repo=catalog_repo)


def get_household_medicine_service(
    household_repo=Depends(get_household_medicine_repo),
    family_repo=Depends(get_family_repo),
    catalog_repo=Depends(get_medicine_catalog_repo),
) -> HouseholdMedicineService:
    return HouseholdMedicineService(
        household_repo=household_repo,
        family_repo=family_repo,
        catalog_repo=catalog_repo,
    )


def get_illness_episode_service(
    episode_repo=Depends(get_illness_episode_repo),
    child_repo=Depends(get_child_repo),
) -> IllnessEpisodeService:
    return IllnessEpisodeService(episode_repo=episode_repo, child_repo=child_repo)


def get_temperature_entry_service(
    temperature_repo=Depends(get_temperature_entry_repo),
    episode_repo=Depends(get_illness_episode_repo),
) -> TemperatureEntryService:
    return TemperatureEntryService(
        temperature_repo=temperature_repo,
        episode_repo=episode_repo,
    )


def get_administration_service(
    administration_repo=Depends(get_administration_repo),
    household_repo=Depends(get_household_medicine_repo),
    episode_repo=Depends(get_illness_episode_repo),
) -> AdministrationService:
    return AdministrationService(
        administration_repo=administration_repo,
        household_repo=household_repo,
        episode_repo=episode_repo,
    )
