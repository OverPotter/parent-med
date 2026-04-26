"""add family owner account

Revision ID: 064
Revises: 063
Create Date: 2026-04-26 12:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "064"
down_revision: str | None = "063"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "families",
        sa.Column("owner_account_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_families_owner_account_id_accounts",
        "families",
        "accounts",
        ["owner_account_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.execute(
        """
        UPDATE families AS f
        SET owner_account_id = candidate.id
        FROM (
            SELECT DISTINCT ON (a.family_id)
                a.family_id,
                a.id
            FROM accounts AS a
            WHERE a.family_role != 'deleted'
            ORDER BY
                a.family_id,
                CASE WHEN lower(coalesce(a.family_role, '')) IN ('owner', 'admin') THEN 0 ELSE 1 END,
                a.created_at ASC,
                a.id ASC
        ) AS candidate
        WHERE f.id = candidate.family_id
        """
    )

    op.alter_column("families", "owner_account_id", nullable=False)


def downgrade() -> None:
    op.drop_constraint("fk_families_owner_account_id_accounts", "families", type_="foreignkey")
    op.drop_column("families", "owner_account_id")
