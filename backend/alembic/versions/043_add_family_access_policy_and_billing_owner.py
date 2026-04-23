"""add family access policy and billing owner

Revision ID: 043
Revises: 042
Create Date: 2026-04-22 03:10:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "043"
down_revision: str | None = "042"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


_DEFAULT_POLICY = sa.text(
    """
    '{
      "all_children": true,
      "child_ids": [],
      "children_access": "edit",
      "cabinet_access": "edit",
      "pillbox_access": "edit",
      "illness_push_enabled": true,
      "cabinet_push_enabled": true,
      "pillbox_push_enabled": true
    }'::jsonb
    """
)


def upgrade() -> None:
    op.add_column(
        "accounts",
        sa.Column(
            "access_policy",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=_DEFAULT_POLICY,
        ),
    )
    op.add_column(
        "families",
        sa.Column(
            "billing_account_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.create_foreign_key(
        "fk_families_billing_account_id_accounts",
        "families",
        "accounts",
        ["billing_account_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute("UPDATE accounts SET family_role = 'admin' WHERE family_role = 'owner'")
    op.execute("UPDATE accounts SET family_role = 'member' WHERE family_role = 'adult'")
    op.execute("UPDATE family_invites SET family_role = 'member' WHERE family_role = 'adult'")
    op.execute("UPDATE family_invites SET family_role = 'admin' WHERE family_role = 'owner'")

    op.alter_column("accounts", "family_role", server_default="admin")
    op.alter_column("accounts", "access_policy", server_default=None)


def downgrade() -> None:
    op.alter_column("accounts", "family_role", server_default="owner")
    op.execute("UPDATE family_invites SET family_role = 'owner' WHERE family_role = 'admin'")
    op.execute("UPDATE family_invites SET family_role = 'adult' WHERE family_role = 'member'")
    op.execute("UPDATE accounts SET family_role = 'owner' WHERE family_role = 'admin'")
    op.execute("UPDATE accounts SET family_role = 'adult' WHERE family_role = 'member'")
    op.drop_constraint("fk_families_billing_account_id_accounts", "families", type_="foreignkey")
    op.drop_column("families", "billing_account_id")
    op.drop_column("accounts", "access_policy")
