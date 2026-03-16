"""
Safety Engine: проверки перед действием с лекарством.

Проверяет срок годности и срок после вскрытия. При недостаточной уверенности
возвращает предупреждение или блокирует действие.
"""

from datetime import date, timedelta

from src.core.exceptions import SafetyBlockedError
from src.domain.entities.household_medicine import HouseholdMedicine

# Упрощённые константы для MVP: срок после вскрытия по умолчанию (дней)
DEFAULT_OPENED_SHELF_DAYS = 30


def check_household_medicine_for_administration(
    household: HouseholdMedicine,
    opened_shelf_days: int = DEFAULT_OPENED_SHELF_DAYS,
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

    if household.opened_at is not None:
        opened_date = household.opened_at.date()
        expiry_after_open = opened_date + timedelta(days=opened_shelf_days)
        if today > expiry_after_open:
            raise SafetyBlockedError(
                f"Срок использования после вскрытия истёк (вскрыто {opened_date}, "
                f"срок {opened_shelf_days} дн.). Использовать нельзя."
            )
