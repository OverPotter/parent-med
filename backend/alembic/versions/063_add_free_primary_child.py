"""add free primary child support

Revision ID: 063
Revises: 062
Create Date: 2026-04-26 01:35:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "063"
down_revision: str | None = "062"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "children",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.add_column(
        "families",
        sa.Column("free_primary_child_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_families_free_primary_child_id_children",
        "families",
        "children",
        ["free_primary_child_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        """
        UPDATE families AS f
        SET free_primary_child_id = candidate.id
        FROM (
            SELECT DISTINCT ON (c.family_id)
                c.family_id,
                c.id
            FROM children AS c
            ORDER BY c.family_id, c.created_at ASC, c.id ASC
        ) AS candidate
        WHERE f.id = candidate.family_id
        """
    )

    op.alter_column("children", "created_at", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_families_free_primary_child_id_children", "families", type_="foreignkey")
    op.drop_column("families", "free_primary_child_id")
    op.drop_column("children", "created_at")
