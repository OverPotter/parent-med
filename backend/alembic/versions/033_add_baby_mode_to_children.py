"""add baby mode flag to children

Revision ID: 033
Revises: 032
Create Date: 2026-04-11
"""

from alembic import op
import sqlalchemy as sa


revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "children",
        sa.Column("baby_mode_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("children", "baby_mode_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("children", "baby_mode_enabled")
