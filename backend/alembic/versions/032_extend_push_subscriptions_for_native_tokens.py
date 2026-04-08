"""extend push subscriptions for native tokens

Revision ID: 032
Revises: 031
Create Date: 2026-04-08
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "032"
down_revision: str | None = "031"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "push_subscriptions",
        sa.Column("channel", sa.String(length=16), nullable=False, server_default="web"),
    )
    op.add_column(
        "push_subscriptions",
        sa.Column("native_token", sa.Text(), nullable=True),
    )
    op.add_column(
        "push_subscriptions",
        sa.Column("platform", sa.String(length=32), nullable=True),
    )
    op.alter_column(
        "push_subscriptions",
        "p256dh_key",
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.alter_column(
        "push_subscriptions",
        "auth_key",
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.create_unique_constraint(
        "uq_push_subscriptions_native_token",
        "push_subscriptions",
        ["native_token"],
    )
    op.alter_column("push_subscriptions", "channel", server_default=None)


def downgrade() -> None:
    op.drop_constraint("uq_push_subscriptions_native_token", "push_subscriptions", type_="unique")
    op.alter_column(
        "push_subscriptions",
        "auth_key",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.alter_column(
        "push_subscriptions",
        "p256dh_key",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.drop_column("push_subscriptions", "platform")
    op.drop_column("push_subscriptions", "native_token")
    op.drop_column("push_subscriptions", "channel")

