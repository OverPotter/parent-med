"""add push notification preferences to accounts

Revision ID: 014
Revises: 013
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "push_before_reminder_minutes",
            sa.Integer(),
            nullable=False,
            server_default="10",
        ),
    )


def downgrade() -> None:
    op.drop_column("accounts", "push_before_reminder_minutes")
