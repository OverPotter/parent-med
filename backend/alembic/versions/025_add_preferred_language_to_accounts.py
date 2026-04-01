"""add preferred language to accounts

Revision ID: 025
Revises: 024
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa


revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("preferred_language", sa.String(length=8), nullable=False, server_default="ru"),
    )


def downgrade() -> None:
    op.drop_column("accounts", "preferred_language")
