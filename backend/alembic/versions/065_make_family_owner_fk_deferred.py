"""make family owner fk deferred

Revision ID: 065
Revises: 064
Create Date: 2026-04-26 23:30:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "065"
down_revision: str | None = "064"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "fk_families_owner_account_id_accounts",
        "families",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_families_owner_account_id_accounts",
        "families",
        "accounts",
        ["owner_account_id"],
        ["id"],
        ondelete="RESTRICT",
        deferrable=True,
        initially="DEFERRED",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_families_owner_account_id_accounts",
        "families",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_families_owner_account_id_accounts",
        "families",
        "accounts",
        ["owner_account_id"],
        ["id"],
        ondelete="RESTRICT",
    )
