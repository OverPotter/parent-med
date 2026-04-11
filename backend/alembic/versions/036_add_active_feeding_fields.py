"""add active feeding fields

Revision ID: 036_add_active_feeding_fields
Revises: 035_add_feeding_records
Create Date: 2026-04-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "036_add_active_feeding_fields"
down_revision: str | None = "035_add_feeding_records"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "feeding_records",
        sa.Column("is_expressed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "feeding_records",
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "feeding_records",
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "feeding_records",
        sa.Column(
            "status",
            sa.String(length=16),
            nullable=False,
            server_default="completed",
        ),
    )
    op.alter_column("feeding_records", "is_expressed", server_default=None)
    op.alter_column("feeding_records", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("feeding_records", "status")
    op.drop_column("feeding_records", "ended_at")
    op.drop_column("feeding_records", "started_at")
    op.drop_column("feeding_records", "is_expressed")
