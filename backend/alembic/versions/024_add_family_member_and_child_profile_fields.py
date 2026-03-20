"""add family member and child profile fields

Revision ID: 024
Revises: 023
Create Date: 2026-03-20
"""

from alembic import op
import sqlalchemy as sa


revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("accounts", sa.Column("relationship_label", sa.String(length=64), nullable=True))
    op.add_column("accounts", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("children", sa.Column("institution_name", sa.String(length=255), nullable=True))
    op.add_column("children", sa.Column("institution_phone", sa.String(length=32), nullable=True))
    op.add_column("children", sa.Column("doctor_name", sa.String(length=255), nullable=True))
    op.add_column("children", sa.Column("doctor_phone", sa.String(length=32), nullable=True))
    op.add_column("children", sa.Column("allergies", sa.Text(), nullable=True))
    op.add_column("children", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("children", "notes")
    op.drop_column("children", "allergies")
    op.drop_column("children", "doctor_phone")
    op.drop_column("children", "doctor_name")
    op.drop_column("children", "institution_phone")
    op.drop_column("children", "institution_name")
    op.drop_column("accounts", "phone")
    op.drop_column("accounts", "relationship_label")
