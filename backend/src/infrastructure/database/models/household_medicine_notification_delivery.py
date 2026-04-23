"""ORM-модель: отправленное push-напоминание по аптечке."""

from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.base import Base


class HouseholdMedicineNotificationDeliveryModel(Base):
    """Защита от повторной отправки одного и того же reminder по упаковке."""

    __tablename__ = "household_medicine_notification_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "household_medicine_id",
            "notification_kind",
            "target_date",
            "days_before",
            "account_id",
            name="uq_household_medicine_notification_delivery",
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    household_medicine_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("household_medicines.id", ondelete="CASCADE"),
        nullable=False,
    )
    account_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    notification_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_before: Mapped[int] = mapped_column(Integer, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
