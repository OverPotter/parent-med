"""change plan interval to minutes

Revision ID: 015
Revises: 014
Create Date: 2026-03-19
"""

from alembic import op


revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "episode_medication_plans",
        "min_interval_hours",
        new_column_name="min_interval_minutes",
    )
    op.execute(
        "UPDATE episode_medication_plans "
        "SET min_interval_minutes = min_interval_minutes * 60"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE episode_medication_plans "
        "SET min_interval_minutes = GREATEST(1, ROUND(min_interval_minutes / 60.0))"
    )
    op.alter_column(
        "episode_medication_plans",
        "min_interval_minutes",
        new_column_name="min_interval_hours",
    )
