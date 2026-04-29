"""add public support requests table

Revision ID: 068_public_support
Revises: 067_provider_sub_unique
Create Date: 2026-04-29 12:30:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "068_public_support"
down_revision: str | None = "067_provider_sub_unique"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("public_support_requests"):
        op.create_table(
            "public_support_requests",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("reply_contact", sa.Text(), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("client_request_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "reply_contact",
                "client_request_id",
                name="uq_public_support_reply_contact_client_request",
            ),
        )
        op.create_index(
            "ix_public_support_reply_contact_created",
            "public_support_requests",
            ["reply_contact", "created_at"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("public_support_requests"):
        op.drop_index(
            "ix_public_support_reply_contact_created", table_name="public_support_requests"
        )
        op.drop_table("public_support_requests")
