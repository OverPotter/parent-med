"""Фабрики репозиториев (инфраструктура) для Depends."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps.database import get_db_session
from src.domain.repositories.account_repository import AccountRepository
from src.domain.repositories.account_session_repository import AccountSessionRepository
from src.domain.repositories.administration_event_repository import AdministrationEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.household_medicine_repository import HouseholdMedicineRepository
from src.domain.repositories.illness_comment_repository import IllnessCommentRepository
from src.domain.repositories.illness_episode_repository import IllnessEpisodeRepository
from src.domain.repositories.medicine_catalog_repository import MedicineCatalogRepository
from src.domain.repositories.parent_repository import ParentRepository
from src.domain.repositories.temperature_entry_repository import TemperatureEntryRepository
from src.domain.repositories.weight_entry_repository import WeightEntryRepository
from src.infrastructure.database.repositories.account_repository import SqlAccountRepository
from src.infrastructure.database.repositories.account_session_repository import (
    SqlAccountSessionRepository,
)
from src.infrastructure.database.repositories.administration_event_repository import (
    SqlAdministrationEventRepository,
)
from src.infrastructure.database.repositories.child_repository import SqlChildRepository
from src.infrastructure.database.repositories.family_repository import SqlFamilyRepository
from src.infrastructure.database.repositories.household_medicine_repository import (
    SqlHouseholdMedicineRepository,
)
from src.infrastructure.database.repositories.illness_comment_repository import (
    SqlIllnessCommentRepository,
)
from src.infrastructure.database.repositories.illness_episode_repository import (
    SqlIllnessEpisodeRepository,
)
from src.infrastructure.database.repositories.medicine_catalog_repository import (
    SqlMedicineCatalogRepository,
)
from src.infrastructure.database.repositories.parent_repository import SqlParentRepository
from src.infrastructure.database.repositories.temperature_entry_repository import (
    SqlTemperatureEntryRepository,
)
from src.infrastructure.database.repositories.weight_entry_repository import (
    SqlWeightEntryRepository,
)


def get_account_repo(session: AsyncSession = Depends(get_db_session)) -> AccountRepository:
    return SqlAccountRepository(session)


def get_account_session_repo(
    session: AsyncSession = Depends(get_db_session),
) -> AccountSessionRepository:
    return SqlAccountSessionRepository(session)


def get_family_repo(session: AsyncSession = Depends(get_db_session)) -> FamilyRepository:
    return SqlFamilyRepository(session)


def get_child_repo(session: AsyncSession = Depends(get_db_session)) -> ChildRepository:
    return SqlChildRepository(session)


def get_parent_repo(session: AsyncSession = Depends(get_db_session)) -> ParentRepository:
    return SqlParentRepository(session)


def get_weight_entry_repo(
    session: AsyncSession = Depends(get_db_session),
) -> WeightEntryRepository:
    return SqlWeightEntryRepository(session)


def get_medicine_catalog_repo(
    session: AsyncSession = Depends(get_db_session),
) -> MedicineCatalogRepository:
    return SqlMedicineCatalogRepository(session)


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
