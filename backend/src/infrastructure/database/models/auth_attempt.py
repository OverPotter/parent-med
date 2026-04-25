"""ORM model for persisted auth throttling attempts."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.base import Base


class AuthAttemptModel(Base):
    __tablename__ = "auth_attempts"
    __table_args__ = (
        Index(
            "ix_auth_attempts_action_bucket_key_created_at", "action", "bucket_key", "created_at"
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    bucket_key: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
