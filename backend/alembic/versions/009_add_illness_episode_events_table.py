"""add_illness_episode_events_table

Revision ID: 009
Revises: 008
Create Date: 2026-03-18

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "illness_episode_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("value_celsius", sa.Float(), nullable=True),
        sa.Column("method", sa.String(length=64), nullable=True),
        sa.Column("comment", sa.String(length=512), nullable=True),
        sa.Column("household_medicine_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("amount", sa.String(length=64), nullable=True),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("reason", sa.String(length=256), nullable=True),
        sa.ForeignKeyConstraint(
            ["episode_id"],
            ["illness_episodes.id"],
            name=op.f("fk_illness_episode_events_episode_id_illness_episodes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["household_medicine_id"],
            ["household_medicines.id"],
            name=op.f("fk_illness_episode_events_household_medicine_id_household_medicines"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_illness_episode_events")),
    )
    op.create_index(
        op.f("ix_illness_episode_events_episode_id"),
        "illness_episode_events",
        ["episode_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_illness_episode_events_event_type"),
        "illness_episode_events",
        ["event_type"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO illness_episode_events (
            id,
            episode_id,
            event_type,
            occurred_at,
            value_celsius,
            method,
            comment
        )
        SELECT
            id,
            episode_id,
            'temperature',
            measured_at,
            value_celsius,
            method,
            comment
        FROM temperature_entries
        """
    )

    op.execute(
        """
        INSERT INTO illness_episode_events (
            id,
            episode_id,
            event_type,
            occurred_at,
            household_medicine_id,
            amount,
            unit,
            reason
        )
        SELECT
            id,
            episode_id,
            'administration',
            administered_at,
            household_medicine_id,
            amount,
            unit,
            reason
        FROM administration_events
        """
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_illness_episode_events_event_type"), table_name="illness_episode_events")
    op.drop_index(op.f("ix_illness_episode_events_episode_id"), table_name="illness_episode_events")
    op.drop_table("illness_episode_events")
