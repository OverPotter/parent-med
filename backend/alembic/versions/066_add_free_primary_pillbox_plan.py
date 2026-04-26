"""Add free primary pillbox plan support.

Revision ID: 066
Revises: 065_make_family_owner_fk_deferred
Create Date: 2026-04-26 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "066"
down_revision: str | None = "065"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "families",
        sa.Column("free_primary_pillbox_plan_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_families_free_primary_pillbox_plan_id_pillbox_plans",
        "families",
        "pillbox_plans",
        ["free_primary_pillbox_plan_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_families_free_primary_pillbox_plan_id_pillbox_plans",
        "families",
        type_="foreignkey",
    )
    op.drop_column("families", "free_primary_pillbox_plan_id")
