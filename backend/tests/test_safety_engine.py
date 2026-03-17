from datetime import date, datetime, timezone
from uuid import uuid4

import pytest

from src.application.services.safety_engine import (
    calculate_household_medicine_status,
    check_household_medicine_for_administration,
)
from src.core.exceptions import SafetyBlockedError
from src.domain.entities.household_medicine import HouseholdMedicine


def make_household_medicine(
    *,
    expiry_date: date,
    opened_at: datetime | None = None,
    opened_shelf_days: int | None = None,
) -> HouseholdMedicine:
    return HouseholdMedicine(
        id=uuid4(),
        family_id=uuid4(),
        catalog_item_id=uuid4(),
        medicine_name="Ибупрофен",
        medicine_form="сироп",
        medicine_concentration="100 мг/5 мл",
        medicine_description=None,
        medicine_dosage=None,
        expiry_date=expiry_date,
        opened_at=opened_at,
        opened_shelf_days=opened_shelf_days,
        comment=None,
    )


def test_status_does_not_invent_opened_shelf_days_when_unknown() -> None:
    today = date(2026, 3, 17)
    opened_at = datetime(2026, 3, 1, tzinfo=timezone.utc)
    medicine = make_household_medicine(
        expiry_date=date(2026, 12, 31),
        opened_at=opened_at,
        opened_shelf_days=None,
    )

    status = calculate_household_medicine_status(medicine, today=today)

    assert status["effective_opened_shelf_days"] is None
    assert status["opened_expires_at"] is None
    assert status["opened_expires_in_days"] is None
    assert status["status"] == "ok"


def test_administration_is_blocked_after_opening_expiry() -> None:
    medicine = make_household_medicine(
        expiry_date=date(2026, 12, 31),
        opened_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        opened_shelf_days=14,
    )

    with pytest.raises(SafetyBlockedError):
        check_household_medicine_for_administration(medicine, today=date(2026, 3, 17))


def test_administration_is_not_blocked_when_opened_shelf_life_unknown() -> None:
    medicine = make_household_medicine(
        expiry_date=date(2026, 12, 31),
        opened_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        opened_shelf_days=None,
    )

    check_household_medicine_for_administration(medicine, today=date(2026, 3, 17))
