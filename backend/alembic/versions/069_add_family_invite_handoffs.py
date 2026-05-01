"""add family invite handoffs table

Revision ID: 069_family_invite_handoffs
Revises: 068_public_support
Create Date: 2026-05-01 14:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "069_family_invite_handoffs"
down_revision: str | None = "068_public_support"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("family_invite_handoffs"):
        op.create_table(
            "family_invite_handoffs",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("handoff_token_hash", sa.String(length=64), nullable=False),
            sa.Column("invite_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("family_name", sa.String(length=255), nullable=False),
            sa.Column("family_role", sa.String(length=32), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["invite_id"], ["family_invites.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["family_id"], ["families.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("handoff_token_hash", name="uq_family_invite_handoffs_token_hash"),
        )
        op.create_index(
            "ix_family_invite_handoffs_family_id_created_at",
            "family_invite_handoffs",
            ["family_id", "created_at"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if inspector.has_table("family_invite_handoffs"):
        op.drop_index(
            "ix_family_invite_handoffs_family_id_created_at",
            table_name="family_invite_handoffs",
        )
        op.drop_table("family_invite_handoffs")
