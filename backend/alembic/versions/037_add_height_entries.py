"""add height entries

Revision ID: 037_add_height_entries
Revises: 036_add_active_feeding_fields
Create Date: 2026-04-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "037_add_height_entries"
down_revision: str | None = "036_add_active_feeding_fields"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "height_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value_cm", sa.Float(), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_height_entries_child_id_measured_at",
        "height_entries",
        ["child_id", "measured_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_height_entries_child_id_measured_at", table_name="height_entries")
    op.drop_table("height_entries")
