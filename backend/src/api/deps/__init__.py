# Зависимости для роутов: сессия БД, репозитории, сервисы

from src.api.deps.database import get_db_session
from src.api.deps.repositories import (
    get_administration_repo,
    get_child_repo,
    get_family_repo,
    get_household_medicine_repo,
    get_illness_episode_repo,
    get_medicine_catalog_repo,
    get_temperature_entry_repo,
    get_weight_entry_repo,
)
from src.api.deps.services import (
    get_administration_service,
    get_child_service,
    get_family_service,
    get_household_medicine_service,
    get_illness_episode_service,
    get_medicine_catalog_service,
    get_temperature_entry_service,
    get_weight_entry_service,
)

__all__ = [
    "get_db_session",
    "get_family_repo",
    "get_child_repo",
    "get_weight_entry_repo",
    "get_medicine_catalog_repo",
    "get_household_medicine_repo",
    "get_illness_episode_repo",
    "get_temperature_entry_repo",
    "get_administration_repo",
    "get_family_service",
    "get_child_service",
    "get_weight_entry_service",
    "get_medicine_catalog_service",
    "get_household_medicine_service",
    "get_illness_episode_service",
    "get_temperature_entry_service",
    "get_administration_service",
]
