"""add cabinet member account ids to families

Revision ID: 042
Revises: 041
Create Date: 2026-04-21 23:40:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "042"
down_revision: str | None = "041"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "families",
        sa.Column(
            "cabinet_member_account_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.alter_column("families", "cabinet_member_account_ids", server_default=None)


def downgrade() -> None:
    op.drop_column("families", "cabinet_member_account_ids")
