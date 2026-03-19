"""add 3 day cabinet push preference

Revision ID: 019
Revises: 018
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa


revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("cabinet_notify_3_days", sa.Boolean(), nullable=False, server_default="true"),
    )


def downgrade() -> None:
    op.drop_column("accounts", "cabinet_notify_3_days")
