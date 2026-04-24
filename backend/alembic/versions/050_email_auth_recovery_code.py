"""email auth and recovery code

Revision ID: 050
Revises: 049
Create Date: 2026-04-24
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "050"
down_revision: str | None = "049"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("accounts", sa.Column("recovery_code_hash", sa.String(length=512), nullable=True))
    op.alter_column("accounts", "display_name", existing_type=sa.String(length=255), nullable=True)
    op.drop_index(
        op.f("ix_password_recovery_tokens_account_id"),
        table_name="password_recovery_tokens",
    )
    op.drop_table("password_recovery_tokens")


def downgrade() -> None:
    op.create_table(
        "password_recovery_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("account_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_password_recovery_tokens")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_password_recovery_tokens_token_hash")),
    )
    op.create_index(
        op.f("ix_password_recovery_tokens_account_id"),
        "password_recovery_tokens",
        ["account_id"],
        unique=False,
    )
    op.alter_column("accounts", "display_name", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("accounts", "recovery_code_hash")
