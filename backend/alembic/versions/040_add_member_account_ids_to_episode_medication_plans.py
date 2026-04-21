"""add member account ids to episode medication plans

Revision ID: 040
Revises: 039
Create Date: 2026-04-21
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "040"
down_revision: str | None = "039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "episode_medication_plans",
        sa.Column(
            "member_account_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.alter_column("episode_medication_plans", "member_account_ids", server_default=None)


def downgrade() -> None:
    op.drop_column("episode_medication_plans", "member_account_ids")
