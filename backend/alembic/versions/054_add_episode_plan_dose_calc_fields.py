"""add episode medication plan dose calculation fields

Revision ID: 054_episode_plan_dose_calc
Revises: 053
Create Date: 2026-04-25 13:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "054_episode_plan_dose_calc"
down_revision: str | None = "053"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "episode_medication_plans",
        sa.Column("calculated_dose_mg", sa.Float(), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("calculated_dose_value", sa.Float(), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("calculated_dose_unit", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("dose_calc_mode", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column("dose_calc_warning", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "episode_medication_plans",
        sa.Column(
            "manual_dose_override",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("episode_medication_plans", "manual_dose_override")
    op.drop_column("episode_medication_plans", "dose_calc_warning")
    op.drop_column("episode_medication_plans", "dose_calc_mode")
    op.drop_column("episode_medication_plans", "calculated_dose_unit")
    op.drop_column("episode_medication_plans", "calculated_dose_value")
    op.drop_column("episode_medication_plans", "calculated_dose_mg")
