"""ORM-модель: семья."""

from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.database.base import Base


class FamilyModel(Base):
    """Таблица семей."""

    __tablename__ = "families"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_account_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "accounts.id",
            ondelete="RESTRICT",
            deferrable=True,
            initially="DEFERRED",
        ),
        nullable=False,
    )
    billing_account_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    free_primary_child_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("children.id", ondelete="SET NULL"),
        nullable=True,
    )
    free_primary_pillbox_plan_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pillbox_plans.id", ondelete="SET NULL"),
        nullable=True,
    )
    plan_code: Mapped[str] = mapped_column(String(32), nullable=False, default="free")
    subscription_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="inactive",
    )
    subscription_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    subscription_product_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_expires_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    cabinet_member_account_ids: Mapped[list[UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=False,
        default=list,
        server_default="{}",
    )

    accounts: Mapped[list] = relationship(
        "AccountModel",
        back_populates="family",
        foreign_keys="AccountModel.family_id",
    )
    billing_account: Mapped["AccountModel | None"] = relationship(
        "AccountModel",
        foreign_keys=[billing_account_id],
    )
    owner_account: Mapped["AccountModel | None"] = relationship(
        "AccountModel",
        foreign_keys=[owner_account_id],
    )
    free_primary_child: Mapped["ChildModel | None"] = relationship(
        "ChildModel",
        foreign_keys=[free_primary_child_id],
    )
    free_primary_pillbox_plan: Mapped["PillboxPlanModel | None"] = relationship(
        "PillboxPlanModel",
        foreign_keys=[free_primary_pillbox_plan_id],
    )
    parents: Mapped[list] = relationship("ParentModel", back_populates="family")
    children: Mapped[list] = relationship(
        "ChildModel",
        back_populates="family",
        foreign_keys="ChildModel.family_id",
    )
    household_medicines: Mapped[list] = relationship(
        "HouseholdMedicineModel", back_populates="family"
    )
