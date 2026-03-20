"""
Safety Engine: проверки перед действием с лекарством.

Проверяет срок годности и срок после вскрытия. При недостаточной уверенности
возвращает предупреждение или блокирует действие.
"""

from datetime import date, timedelta
from typing import TypedDict

from src.core.exceptions import SafetyBlockedError
from src.domain.entities.household_medicine import HouseholdMedicine
from src.domain.enums.household_medicine_status import HouseholdMedicineStatus

_EXPIRING_SOON_DAYS = 30
_EXPIRING_AFTER_OPENING_DAYS = 30


class HouseholdMedicineStatusInfo(TypedDict):
    """Результат расчёта статуса упаковки."""

    status: HouseholdMedicineStatus
    status_label: str
    expiry_alert_date: date | None
    expires_in_days: int
    opened_expires_at: date | None
    opened_expires_in_days: int | None
    effective_opened_shelf_days: int | None


def calculate_household_medicine_status(
    household: HouseholdMedicine,
    today: date | None = None,
) -> HouseholdMedicineStatusInfo:
    """Возвращает статус упаковки по сроку годности и сроку после вскрытия."""
    if today is None:
        today = date.today()

    expires_in_days = (household.expiry_date - today).days
    opened_expires_at: date | None = None
    opened_expires_in_days: int | None = None
    effective_opened_shelf_days: int | None = None

    if household.opened_at is not None and household.opened_shelf_days is not None:
        effective_opened_shelf_days = household.opened_shelf_days
        opened_expires_at = household.opened_at.date() + timedelta(days=effective_opened_shelf_days)
        opened_expires_in_days = (opened_expires_at - today).days

    if expires_in_days < 0:
        return {
            "status": HouseholdMedicineStatus.EXPIRED,
            "status_label": HouseholdMedicineStatus.EXPIRED.label,
            "expiry_alert_date": household.expiry_date,
            "expires_in_days": expires_in_days,
            "opened_expires_at": opened_expires_at,
            "opened_expires_in_days": opened_expires_in_days,
            "effective_opened_shelf_days": effective_opened_shelf_days,
        }

    if opened_expires_in_days is not None and opened_expires_in_days < 0:
        return {
            "status": HouseholdMedicineStatus.EXPIRED_AFTER_OPENING,
            "status_label": HouseholdMedicineStatus.EXPIRED_AFTER_OPENING.label,
            "expiry_alert_date": opened_expires_at,
            "expires_in_days": expires_in_days,
            "opened_expires_at": opened_expires_at,
            "opened_expires_in_days": opened_expires_in_days,
            "effective_opened_shelf_days": effective_opened_shelf_days,
        }

    if (
        opened_expires_in_days is not None
        and opened_expires_in_days <= _EXPIRING_AFTER_OPENING_DAYS
    ):
        return {
            "status": HouseholdMedicineStatus.EXPIRING_AFTER_OPENING,
            "status_label": HouseholdMedicineStatus.EXPIRING_AFTER_OPENING.label,
            "expiry_alert_date": opened_expires_at,
            "expires_in_days": expires_in_days,
            "opened_expires_at": opened_expires_at,
            "opened_expires_in_days": opened_expires_in_days,
            "effective_opened_shelf_days": effective_opened_shelf_days,
        }

    if expires_in_days <= _EXPIRING_SOON_DAYS:
        return {
            "status": HouseholdMedicineStatus.EXPIRING_SOON,
            "status_label": HouseholdMedicineStatus.EXPIRING_SOON.label,
            "expiry_alert_date": household.expiry_date,
            "expires_in_days": expires_in_days,
            "opened_expires_at": opened_expires_at,
            "opened_expires_in_days": opened_expires_in_days,
            "effective_opened_shelf_days": effective_opened_shelf_days,
        }

    return {
        "status": HouseholdMedicineStatus.OK,
        "status_label": HouseholdMedicineStatus.OK.label,
        "expiry_alert_date": opened_expires_at or household.expiry_date,
        "expires_in_days": expires_in_days,
        "opened_expires_at": opened_expires_at,
        "opened_expires_in_days": opened_expires_in_days,
        "effective_opened_shelf_days": effective_opened_shelf_days,
    }


def check_household_medicine_for_administration(
    household: HouseholdMedicine,
    today: date | None = None,
) -> None:
    """
    Проверяет, можно ли использовать упаковку для приёма.

    - Просроченный общий срок годности → блокировка.
    - Вскрытая упаковка: проверка срока после вскрытия → блокировка при превышении.
    """
    if today is None:
        today = date.today()

    if household.expiry_date < today:
        raise SafetyBlockedError(
            f"Препарат просрочен (срок годности {household.expiry_date}). Использовать нельзя."
        )

    if household.opened_at is not None and household.opened_shelf_days is not None:
        effective_opened_shelf_days = household.opened_shelf_days
        opened_date = household.opened_at.date()
        expiry_after_open = opened_date + timedelta(days=effective_opened_shelf_days)
        if today > expiry_after_open:
            raise SafetyBlockedError(
                f"Срок использования после вскрытия истёк (вскрыто {opened_date}, "
                f"срок {effective_opened_shelf_days} дн.). Использовать нельзя."
            )
