"""Лог доставок push-уведомлений по illness reminder для конкретного участника."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.base import Base


class IllnessNotificationDeliveryModel(Base):
    """Защита от повторной отправки illness push по конкретному окну и аккаунту."""

    __tablename__ = "illness_notification_deliveries"
    __table_args__ = (
        UniqueConstraint(
            "plan_id",
            "notification_kind",
            "scheduled_for",
            "account_id",
            name="uq_illness_notification_delivery",
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
        UUID(as_uuid=True),
        ForeignKey("episode_medication_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    notification_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
