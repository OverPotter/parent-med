"""ORM-модели семейной таблетницы."""

from __future__ import annotations

from datetime import date, datetime, time
from uuid import uuid4

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class PillboxPlanModel(Base):
    """Семейный план таблетницы."""

    __tablename__ = "pillbox_plans"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="active", server_default="active"
    )
    member_account_ids: Mapped[list[UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, default=list, server_default="{}"
    )
    created_by_account_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    medications: Mapped[list["PillboxMedicationModel"]] = relationship(
        "PillboxMedicationModel",
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="PillboxMedicationModel.position",
    )
    dose_logs: Mapped[list["PillboxDoseLogModel"]] = relationship(
        "PillboxDoseLogModel",
        back_populates="plan",
        cascade="all, delete-orphan",
    )


class PillboxMedicationModel(Base):
    """Лекарство внутри плана таблетницы."""

    __tablename__ = "pillbox_medications"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plan_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pillbox_plans.id", ondelete="CASCADE"), nullable=False
    )
    household_medicine_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("household_medicines.id", ondelete="RESTRICT"),
        nullable=True,
    )
    custom_medicine_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dose_amount: Mapped[str] = mapped_column(String(64), nullable=False)
    meal_rule: Mapped[str] = mapped_column(String(32), nullable=False)
    repeat_days: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), nullable=False, default=list, server_default="{}"
    )
    times: Mapped[list[time]] = mapped_column(ARRAY(Time()), nullable=False, default=list)
    course_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    course_start_date: Mapped[date | None] = mapped_column(Date(), nullable=True)
    course_end_date: Mapped[date | None] = mapped_column(Date(), nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    plan: Mapped["PillboxPlanModel"] = relationship(
        "PillboxPlanModel",
        back_populates="medications",
    )
    dose_logs: Mapped[list["PillboxDoseLogModel"]] = relationship(
        "PillboxDoseLogModel",
        back_populates="medication",
        cascade="all, delete-orphan",
    )


class PillboxDoseLogModel(Base):
    """Факт приёма по плану таблетницы."""

    __tablename__ = "pillbox_dose_logs"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pillbox_plans.id", ondelete="CASCADE"), nullable=False
    )
    medication_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pillbox_medications.id", ondelete="CASCADE"), nullable=False
    )
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    taken_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    taken_by_account_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    taken_by_name_snapshot: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount_snapshot: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    notes: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    plan: Mapped["PillboxPlanModel"] = relationship("PillboxPlanModel", back_populates="dose_logs")
    medication: Mapped["PillboxMedicationModel"] = relationship(
        "PillboxMedicationModel", back_populates="dose_logs"
    )


class PillboxNotificationDeliveryModel(Base):
    """Защита от повторной отправки push по конкретному приёму pillbox."""

    __tablename__ = "pillbox_notification_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "plan_id",
            "medication_id",
            "notification_kind",
            "scheduled_for",
            "account_id",
            name="uq_pillbox_notification_delivery",
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("families.id", ondelete="CASCADE"), nullable=False
    )
    account_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False
    )
    plan_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pillbox_plans.id", ondelete="CASCADE"), nullable=False
    )
    medication_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pillbox_medications.id", ondelete="CASCADE"), nullable=False
    )
    notification_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
