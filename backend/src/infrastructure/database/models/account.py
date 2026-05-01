"""ORM-модель: аккаунт пользователя."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy import text as sa_text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class AccountModel(Base):
    """Таблица аккаунтов с привязкой к семье."""

    __tablename__ = "accounts"
    __table_args__ = (
        CheckConstraint(
            "family_role = 'deleted' OR email IS NOT NULL",
            name="ck_accounts_active_email_required",
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    recovery_code_hash: Mapped[str | None] = mapped_column(String(512), nullable=True)
    family_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("families.id", ondelete="CASCADE"),
        nullable=False,
    )
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    relationship_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    preferred_language: Mapped[str] = mapped_column(
        String(8), nullable=False, default="ru", server_default="ru"
    )
    family_role: Mapped[str] = mapped_column(
        String(32), nullable=False, default="admin", server_default="admin"
    )
    access_policy: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=sa_text("'{}'::jsonb"),
    )
    push_before_reminder_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default="10"
    )
    children_push_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    pillbox_push_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    pillbox_push_before_reminder_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=10, server_default="10"
    )
    cabinet_notify_30_days: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    cabinet_notify_15_days: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    cabinet_notify_7_days: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    cabinet_notify_3_days: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    cabinet_notify_1_day: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    live_activity_sleep_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    live_activity_feeding_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    live_activity_illness_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    session_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    family: Mapped["FamilyModel"] = relationship(
        "FamilyModel",
        back_populates="accounts",
        foreign_keys=[family_id],
    )
    sessions: Mapped[list] = relationship("AccountSessionModel", back_populates="account")
    push_subscriptions: Mapped[list] = relationship(
        "PushSubscriptionModel",
        back_populates="account",
        passive_deletes=True,
    )
