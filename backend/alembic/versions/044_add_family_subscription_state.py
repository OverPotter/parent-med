"""add family subscription state

Revision ID: 044
Revises: 043
Create Date: 2026-04-22 04:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "044"
down_revision: str | None = "043"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "families",
        sa.Column("plan_code", sa.String(length=32), nullable=False, server_default="free"),
    )
    op.add_column(
        "families",
        sa.Column(
            "subscription_status",
            sa.String(length=32),
            nullable=False,
            server_default="inactive",
        ),
    )
    op.add_column(
        "families",
        sa.Column("subscription_provider", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "families",
        sa.Column("subscription_product_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "families",
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.alter_column("families", "plan_code", server_default=None)
    op.alter_column("families", "subscription_status", server_default=None)


def downgrade() -> None:
    op.drop_column("families", "subscription_expires_at")
    op.drop_column("families", "subscription_product_id")
    op.drop_column("families", "subscription_provider")
    op.drop_column("families", "subscription_status")
    op.drop_column("families", "plan_code")
