"""initial_mvp_tables

Revision ID: 001
Revises:
Create Date: MVP: семьи, дети, вес, справочник препаратов, аптечка, эпизоды болезни, температура, приёмы

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "families",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_families")),
    )
    op.create_table(
        "medicine_catalog_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("form", sa.String(length=64), nullable=False),
        sa.Column("concentration", sa.String(length=128), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_medicine_catalog_items")),
    )
    op.create_table(
        "children",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(
            ["family_id"],
            ["families.id"],
            name=op.f("fk_children_family_id_families"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_children")),
    )
    op.create_table(
        "household_medicines",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("catalog_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("storage_place", sa.String(length=255), nullable=True),
        sa.Column("comment", sa.String(length=512), nullable=True),
        sa.ForeignKeyConstraint(
            ["catalog_item_id"],
            ["medicine_catalog_items.id"],
            name=op.f("fk_household_medicines_catalog_item_id_medicine_catalog_items"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["family_id"],
            ["families.id"],
            name=op.f("fk_household_medicines_family_id_families"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_household_medicines")),
    )
    op.create_table(
        "illness_episodes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("note", sa.String(length=1024), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["child_id"],
            ["children.id"],
            name=op.f("fk_illness_episodes_child_id_children"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_illness_episodes")),
    )
    op.create_table(
        "weight_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("child_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value_kg", sa.Float(), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(
            ["child_id"],
            ["children.id"],
            name=op.f("fk_weight_entries_child_id_children"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_weight_entries")),
    )
    op.create_table(
        "temperature_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("value_celsius", sa.Float(), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("method", sa.String(length=64), nullable=True),
        sa.Column("comment", sa.String(length=512), nullable=True),
        sa.ForeignKeyConstraint(
            ["episode_id"],
            ["illness_episodes.id"],
            name=op.f("fk_temperature_entries_episode_id_illness_episodes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_temperature_entries")),
    )
    op.create_table(
        "administration_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("episode_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("household_medicine_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("administered_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("amount", sa.String(length=64), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("reason", sa.String(length=256), nullable=True),
        sa.ForeignKeyConstraint(
            ["episode_id"],
            ["illness_episodes.id"],
            name=op.f("fk_administration_events_episode_id_illness_episodes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["household_medicine_id"],
            ["household_medicines.id"],
            name=op.f("fk_administration_events_household_medicine_id_household_medicines"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_administration_events")),
    )


def downgrade() -> None:
    op.drop_table("administration_events")
    op.drop_table("temperature_entries")
    op.drop_table("weight_entries")
    op.drop_table("illness_episodes")
    op.drop_table("household_medicines")
    op.drop_table("children")
    op.drop_table("medicine_catalog_items")
    op.drop_table("families")
