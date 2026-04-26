"""SQLAlchemy repository for plans."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.plan import Plan
from src.domain.repositories.plan_repository import PlanRepository
from src.infrastructure.database.models.plan import PlanModel


class SqlPlanRepository(PlanRepository):
    """Plan repository implementation."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _to_entity(self, model: PlanModel) -> Plan:
        return Plan(
            id=model.id,
            code=model.code,
            name=model.name,
            is_active=model.is_active,
            apple_product_id=model.apple_product_id,
            revenuecat_entitlement_code=model.revenuecat_entitlement_code,
            sort_order=model.sort_order,
            created_at=model.created_at,
        )

    def _to_model(self, entity: Plan) -> PlanModel:
        return PlanModel(
            id=entity.id,
            code=entity.code,
            name=entity.name,
            is_active=entity.is_active,
            apple_product_id=entity.apple_product_id,
            revenuecat_entitlement_code=entity.revenuecat_entitlement_code,
            sort_order=entity.sort_order,
            created_at=entity.created_at,
        )

    async def get_by_id(self, id):  # noqa: ANN001
        result = await self._session.execute(select(PlanModel).where(PlanModel.id == id))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_code(self, code: str) -> Plan | None:
        result = await self._session.execute(select(PlanModel).where(PlanModel.code == code))
        row = result.scalars().one_or_none()
        return self._to_entity(row) if row else None

    async def list_active(self) -> list[Plan]:
        result = await self._session.execute(
            select(PlanModel)
            .where(PlanModel.is_active.is_(True))
            .order_by(PlanModel.sort_order.asc(), PlanModel.created_at.asc())
        )
        return [self._to_entity(row) for row in result.scalars().all()]

    async def add(self, entity: Plan) -> Plan:
        model = self._to_model(entity)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update(self, entity: Plan) -> Plan:
        result = await self._session.execute(select(PlanModel).where(PlanModel.id == entity.id))
        row = result.scalars().one_or_none()
        if not row:
            raise ValueError(f"Plan {entity.id} not found")
        row.code = entity.code
        row.name = entity.name
        row.is_active = entity.is_active
        row.apple_product_id = entity.apple_product_id
        row.revenuecat_entitlement_code = entity.revenuecat_entitlement_code
        row.sort_order = entity.sort_order
        await self._session.flush()
        await self._session.refresh(row)
        return self._to_entity(row)

    async def delete(self, id):  # noqa: ANN001
        result = await self._session.execute(select(PlanModel).where(PlanModel.id == id))
        row = result.scalars().one_or_none()
        if row:
            await self._session.delete(row)
            await self._session.flush()
            return True
        return False
