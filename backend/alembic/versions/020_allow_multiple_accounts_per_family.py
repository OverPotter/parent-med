"""allow multiple accounts per family

Revision ID: 020
Revises: 019
Create Date: 2026-03-20
"""

from alembic import op
import sqlalchemy as sa


revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(op.f("uq_accounts_family_id"), "accounts", type_="unique")
    op.add_column(
        "accounts",
        sa.Column("display_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "accounts",
        sa.Column("family_role", sa.String(length=32), nullable=False, server_default="owner"),
    )
    op.execute(
        """
        UPDATE accounts
        SET display_name = COALESCE(NULLIF(split_part(email, '@', 1), ''), 'Родитель')
        WHERE display_name IS NULL
        """
    )
    op.alter_column("accounts", "display_name", nullable=False)


def downgrade() -> None:
    op.drop_column("accounts", "family_role")
    op.drop_column("accounts", "display_name")
    op.create_unique_constraint(op.f("uq_accounts_family_id"), "accounts", ["family_id"])
