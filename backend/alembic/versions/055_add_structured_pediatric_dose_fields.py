"""add structured pediatric dose fields

Revision ID: 055_structured_pediatric_dose
Revises: 054_episode_plan_dose_calc
Create Date: 2026-04-25 14:15:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "055_structured_pediatric_dose"
down_revision: str | None = "054_episode_plan_dose_calc"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    for table_name in ("curated_medicine_catalog_items", "household_medicines"):
        op.add_column(
            table_name,
            sa.Column("pediatric_dose_mg_per_kg_min", sa.Float(), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("pediatric_dose_mg_per_kg_max", sa.Float(), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("pediatric_dose_note", sa.Text(), nullable=True),
        )


def downgrade() -> None:
    for table_name in ("household_medicines", "curated_medicine_catalog_items"):
        op.drop_column(table_name, "pediatric_dose_note")
        op.drop_column(table_name, "pediatric_dose_mg_per_kg_max")
        op.drop_column(table_name, "pediatric_dose_mg_per_kg_min")
