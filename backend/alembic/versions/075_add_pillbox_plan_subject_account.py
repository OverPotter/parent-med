"""Add subject account to pillbox plans.

Revision ID: 075
Revises: 074
Create Date: 2026-05-16 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "075"
down_revision: str | None = "074_add_child_gender"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "pillbox_plans",
        sa.Column("subject_account_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_pillbox_plans_subject_account_id_accounts",
        "pillbox_plans",
        "accounts",
        ["subject_account_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_pillbox_plans_subject_account_id_accounts",
        "pillbox_plans",
        type_="foreignkey",
    )
    op.drop_column("pillbox_plans", "subject_account_id")
