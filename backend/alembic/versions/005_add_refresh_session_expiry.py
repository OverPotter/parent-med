"""add_refresh_session_expiry

Revision ID: 005
Revises: 004
Create Date: 2026-03-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("account_sessions", sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("update account_sessions set expires_at = created_at + interval '30 days' where expires_at is null")
    op.alter_column("account_sessions", "expires_at", nullable=False)


def downgrade() -> None:
    op.drop_column("account_sessions", "expires_at")
