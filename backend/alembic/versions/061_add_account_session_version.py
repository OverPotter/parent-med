"""Add auth session version to accounts for access token invalidation."""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "061"
down_revision = "060"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column("session_version", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("accounts", "session_version")
