"""add member account ids to illness episodes

Revision ID: 041
Revises: 040
Create Date: 2026-04-21
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "041"
down_revision: str | None = "040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "illness_episodes",
        sa.Column(
            "member_account_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.alter_column("illness_episodes", "member_account_ids", server_default=None)


def downgrade() -> None:
    op.drop_column("illness_episodes", "member_account_ids")
