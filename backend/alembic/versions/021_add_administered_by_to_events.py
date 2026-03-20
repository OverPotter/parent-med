"""add administered by fields to illness episode events

Revision ID: 021
Revises: 020
Create Date: 2026-03-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "illness_episode_events",
        sa.Column("administered_by_account_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "illness_episode_events",
        sa.Column("administered_by_name_snapshot", sa.String(length=255), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_illness_episode_events_administered_by_account_id_accounts"),
        "illness_episode_events",
        "accounts",
        ["administered_by_account_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_illness_episode_events_administered_by_account_id_accounts"),
        "illness_episode_events",
        type_="foreignkey",
    )
    op.drop_column("illness_episode_events", "administered_by_name_snapshot")
    op.drop_column("illness_episode_events", "administered_by_account_id")
