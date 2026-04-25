"""clear medicine data for clean rollout

Revision ID: 057_clear_medicine_data
Revises: 056_household_snapshot_only
Create Date: 2026-04-25 17:10:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "057_clear_medicine_data"
down_revision: str | None = "056_household_snapshot_only"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # Rollout cleanup: start medicine-related domains from a clean state.
    op.execute("DELETE FROM household_medicine_notification_deliveries")
    op.execute("DELETE FROM pillbox_dose_logs")
    op.execute("DELETE FROM pillbox_notification_deliveries")
    op.execute("DELETE FROM pillbox_medications")
    op.execute("DELETE FROM pillbox_plans")
    op.execute("DELETE FROM administration_events")
    op.execute("DELETE FROM episode_medication_plans")
    op.execute("DELETE FROM illness_episode_events WHERE household_medicine_id IS NOT NULL")
    op.execute("DELETE FROM household_medicines")
    op.execute("DELETE FROM curated_medicine_catalog_items")


def downgrade() -> None:
    # Data cleanup migration is intentionally irreversible.
    pass
