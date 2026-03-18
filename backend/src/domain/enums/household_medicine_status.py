"""Статусы упаковки в домашней аптечке."""

from enum import StrEnum


class HouseholdMedicineStatus(StrEnum):
    """Статус упаковки с label и приоритетом сортировки."""

    EXPIRED = "expired"
    EXPIRED_AFTER_OPENING = "expired_after_opening"
    EXPIRING_AFTER_OPENING = "expiring_after_opening"
    EXPIRING_SOON = "expiring_soon"
    OK = "ok"

    @property
    def label(self) -> str:
        return {
            self.EXPIRED: "Просрочен",
            self.EXPIRED_AFTER_OPENING: "Истёк срок после вскрытия",
            self.EXPIRING_AFTER_OPENING: "Скоро истечёт после вскрытия",
            self.EXPIRING_SOON: "Скоро истечёт срок годности",
            self.OK: "Можно использовать",
        }[self]

    @property
    def priority(self) -> int:
        return {
            self.EXPIRED: 0,
            self.EXPIRED_AFTER_OPENING: 1,
            self.EXPIRING_AFTER_OPENING: 2,
            self.EXPIRING_SOON: 3,
            self.OK: 4,
        }[self]
