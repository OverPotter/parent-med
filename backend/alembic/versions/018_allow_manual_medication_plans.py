"""allow manual medication plans

Revision ID: 018
Revises: 017
Create Date: 2026-03-19
"""

from alembic import op
import sqlalchemy as sa


revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "episode_medication_plans",
        sa.Column("custom_medicine_name", sa.String(length=255), nullable=True),
    )
    op.alter_column("episode_medication_plans", "household_medicine_id", nullable=True)


def downgrade() -> None:
    op.alter_column("episode_medication_plans", "household_medicine_id", nullable=False)
    op.drop_column("episode_medication_plans", "custom_medicine_name")
