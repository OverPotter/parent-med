"""ORM-модель: публичное обращение в поддержку."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.base import Base


class PublicSupportRequestModel(Base):
    """Таблица публичных support обращений."""

    __tablename__ = "public_support_requests"
    __table_args__ = (
        UniqueConstraint(
            "reply_contact",
            "client_request_id",
            name="uq_public_support_reply_contact_client_request",
        ),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    reply_contact: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    client_request_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
