"""Add auth attempts table for persisted throttling."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "060"
down_revision = "059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "auth_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("bucket_key", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auth_attempts")),
    )
    op.create_index(
        "ix_auth_attempts_action_bucket_key_created_at",
        "auth_attempts",
        ["action", "bucket_key", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_auth_attempts_action_bucket_key_created_at", table_name="auth_attempts")
    op.drop_table("auth_attempts")
