"""Реализация репозитория семей."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.family import Family
from src.domain.repositories.family_repository import FamilyRepository
from src.infrastructure.database.models.family import FamilyModel


class SqlFamilyRepository(FamilyRepository):
    """Репозиторий семей на SQLAlchemy async."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, m: FamilyModel) -> Family:
        return Family(
            id=m.id,
            name=m.name,
            cabinet_member_account_ids=list(m.cabinet_member_account_ids or []),
            owner_account_id=m.owner_account_id,
            billing_account_id=m.billing_account_id,
            free_primary_child_id=m.free_primary_child_id,
            free_primary_pillbox_plan_id=m.free_primary_pillbox_plan_id,
            plan_code=m.plan_code,
            subscription_status=m.subscription_status,
            subscription_provider=m.subscription_provider,
            subscription_product_id=m.subscription_product_id,
            subscription_expires_at=m.subscription_expires_at,
        )

    def _to_model(self, e: Family) -> FamilyModel:
        return FamilyModel(
            id=e.id,
            name=e.name,
            cabinet_member_account_ids=list(e.cabinet_member_account_ids),
            owner_account_id=e.owner_account_id,
            billing_account_id=e.billing_account_id,
            free_primary_child_id=e.free_primary_child_id,
            free_primary_pillbox_plan_id=e.free_primary_pillbox_plan_id,
            plan_code=e.plan_code,
            subscription_status=e.subscription_status,
            subscription_provider=e.subscription_provider,
            subscription_product_id=e.subscription_product_id,
            subscription_expires_at=e.subscription_expires_at,
        )

    async def list_all(self) -> list[Family]:
        result = await self._session.execute(select(FamilyModel).order_by(FamilyModel.name))
        return [self._to_entity(row) for row in result.scalars().all()]

    async def get_by_id(self, id: UUID) -> Family | None:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def add(self, entity: Family) -> Family:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Family) -> Family:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == entity.id))
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Family {entity.id} not found")
        row.name = entity.name
        row.cabinet_member_account_ids = list(entity.cabinet_member_account_ids)
        row.owner_account_id = entity.owner_account_id
        row.billing_account_id = entity.billing_account_id
        row.free_primary_child_id = entity.free_primary_child_id
        row.free_primary_pillbox_plan_id = entity.free_primary_pillbox_plan_id
        row.plan_code = entity.plan_code
        row.subscription_status = entity.subscription_status
        row.subscription_provider = entity.subscription_provider
        row.subscription_product_id = entity.subscription_product_id
        row.subscription_expires_at = entity.subscription_expires_at
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id: UUID) -> bool:
        result = await self._session.execute(select(FamilyModel).where(FamilyModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
