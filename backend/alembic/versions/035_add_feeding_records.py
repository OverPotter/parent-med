"""add feeding records

Revision ID: 035_add_feeding_records
Revises: 034
Create Date: 2026-04-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "035_add_feeding_records"
down_revision: str | None = "034"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "feeding_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("feeding_type", sa.String(length=32), nullable=False),
        sa.Column("breast_side", sa.String(length=16), nullable=True),
        sa.Column("formula_volume_ml", sa.Integer(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_account_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["created_by_account_id"],
            ["accounts.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_feeding_records_child_id_recorded_at",
        "feeding_records",
        ["child_id", "recorded_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_feeding_records_child_id_recorded_at", table_name="feeding_records")
    op.drop_table("feeding_records")
