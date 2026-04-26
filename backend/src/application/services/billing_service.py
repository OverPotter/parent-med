"""Billing foundation and local stub subscription flows."""

from dataclasses import replace
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from src.application.dto.auth import AuthenticatedAccount
from src.application.dto.billing import (
    BillingDebugActionDto,
    BillingDebugResponseDto,
    BillingProviderSyncDto,
)
from src.application.dto.family import FamilyResponseDto
from src.application.services.subscription_access_service import SubscriptionAccessService
from src.core.config import settings
from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.domain.entities.billing_event import BillingEvent
from src.domain.entities.family import Family
from src.domain.entities.plan import Plan
from src.domain.entities.subscription import Subscription
from src.domain.repositories.billing_event_repository import BillingEventRepository
from src.domain.repositories.child_repository import ChildRepository
from src.domain.repositories.family_repository import FamilyRepository
from src.domain.repositories.feeding_record_repository import FeedingRecordRepository
from src.domain.repositories.plan_repository import PlanRepository
from src.domain.repositories.sleep_session_repository import SleepSessionRepository
from src.domain.repositories.subscription_repository import SubscriptionRepository


class BillingService:
    """Coordinates family subscription state and local billing stubs."""

    def __init__(
        self,
        family_repo: FamilyRepository,
        plan_repo: PlanRepository,
        subscription_repo: SubscriptionRepository,
        billing_event_repo: BillingEventRepository,
        child_repo: ChildRepository,
        feeding_repo: FeedingRecordRepository,
        sleep_repo: SleepSessionRepository,
        subscription_access_service: SubscriptionAccessService,
    ) -> None:
        self._family_repo = family_repo
        self._plan_repo = plan_repo
        self._subscription_repo = subscription_repo
        self._billing_event_repo = billing_event_repo
        self._child_repo = child_repo
        self._feeding_repo = feeding_repo
        self._sleep_repo = sleep_repo
        self._subscription_access_service = subscription_access_service

    @staticmethod
    def _family_to_response(entity: Family) -> FamilyResponseDto:
        premium_active = entity.plan_code in {"plus", "pro"} and entity.subscription_status in {
            "trialing",
            "active",
            "grace",
        }
        return FamilyResponseDto(
            id=entity.id,
            name=entity.name,
            cabinet_member_account_ids=list(entity.cabinet_member_account_ids),
            owner_account_id=entity.owner_account_id,
            billing_account_id=entity.billing_account_id,
            free_primary_child_id=entity.free_primary_child_id,
            plan_code=entity.plan_code,  # type: ignore[arg-type]
            subscription_status=entity.subscription_status,  # type: ignore[arg-type]
            subscription_provider=entity.subscription_provider,
            subscription_product_id=entity.subscription_product_id,
            subscription_expires_at=entity.subscription_expires_at,
            premium_active=premium_active,
        )

    def _ensure_local_debug_allowed(self) -> None:
        if not settings.is_local_environment:
            raise ForbiddenError(
                "Debug billing endpoints are only available in local development",
                code="BILLING_DEBUG_DISABLED",
            )

    async def _require_family_for_account(self, account: AuthenticatedAccount) -> Family:
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            raise NotFoundError("Семья не найдена", resource="family")
        if family.owner_account_id != account.id:
            raise ForbiddenError("Только владелец семьи может управлять billing debug")
        return family

    async def _require_subscription_manager_for_sync(
        self,
        account: AuthenticatedAccount,
    ) -> Family:
        family = await self._family_repo.get_by_id(account.family_id)
        if family is None:
            raise NotFoundError("Семья не найдена", resource="family")
        if family.owner_account_id != account.id:
            raise ForbiddenError(
                "Подпиской может управлять только владелец семьи",
                code="FAMILY_OWNER_REQUIRED",
            )
        return family

    async def _require_plan(self, plan_code: str) -> Plan:
        plan = await self._plan_repo.get_by_code(plan_code)
        if plan is None:
            raise ValidationError("План не найден", code="PLAN_NOT_FOUND")
        return plan

    async def _upsert_subscription(
        self,
        family: Family,
        plan: Plan,
        *,
        status: str,
        provider: str,
        provider_customer_id: str | None,
        provider_subscription_id: str | None,
        expires_at: datetime | None,
        trial_ends_at: datetime | None,
        payload: dict[str, object],
    ) -> Subscription:
        now = datetime.now(UTC)
        existing = await self._subscription_repo.get_current_by_family_id(family.id)
        if existing is None:
            entity = Subscription(
                id=uuid4(),
                family_id=family.id,
                plan_id=plan.id,
                provider=provider,
                provider_customer_id=provider_customer_id,
                provider_subscription_id=provider_subscription_id,
                status=status,
                starts_at=now,
                expires_at=expires_at,
                trial_ends_at=trial_ends_at,
                canceled_at=now if status in {"canceled", "expired"} else None,
                raw_payload_json=payload,
                created_at=now,
                updated_at=now,
            )
            return await self._subscription_repo.add(entity)

        updated = replace(
            existing,
            plan_id=plan.id,
            provider=provider,
            provider_customer_id=provider_customer_id,
            provider_subscription_id=provider_subscription_id,
            status=status,
            expires_at=expires_at,
            trial_ends_at=trial_ends_at,
            canceled_at=now if status in {"canceled", "expired"} else None,
            raw_payload_json=payload,
            updated_at=now,
        )
        return await self._subscription_repo.update(updated)

    async def _append_billing_event(
        self,
        *,
        family_id,
        subscription_id,
        event_type: str,
        payload: dict[str, object],
    ) -> None:
        external_event_id = f"stub:{event_type}:{uuid4()}"
        event = BillingEvent(
            id=uuid4(),
            subscription_id=subscription_id,
            family_id=family_id,
            provider="stub",
            event_type=event_type,
            external_event_id=external_event_id,
            payload_json=payload,
            processed_at=datetime.now(UTC),
            created_at=datetime.now(UTC),
        )
        await self._billing_event_repo.add(event)

    async def _sync_family_snapshot(
        self,
        family: Family,
        plan: Plan,
        *,
        status: str,
        provider: str,
        product_id: str | None,
        expires_at: datetime | None,
        billing_account_id,
    ) -> Family:
        free_primary_child_id = await self._resolve_free_primary_child_id(
            family,
            next_plan_code=plan.code,
            next_status=status,
        )
        updated = replace(
            family,
            billing_account_id=billing_account_id,
            free_primary_child_id=free_primary_child_id,
            plan_code=plan.code,
            subscription_status=status,
            subscription_provider=provider,
            subscription_product_id=product_id,
            subscription_expires_at=expires_at,
        )
        persisted = await self._family_repo.update(updated)
        await self._stop_non_primary_active_trackers_if_needed(
            persisted,
            next_plan_code=plan.code,
            next_status=status,
        )
        return persisted

    async def _resolve_free_primary_child_id(
        self,
        family: Family,
        *,
        next_plan_code: str,
        next_status: str,
    ):
        premium_active = next_plan_code in {"plus", "pro"} and next_status in {
            "trialing",
            "active",
            "grace",
        }
        if premium_active:
            return family.free_primary_child_id

        children = await self._child_repo.get_by_family_id(family.id)
        if not children:
            return None

        child_ids = {child.id for child in children}
        if family.free_primary_child_id in child_ids:
            return family.free_primary_child_id

        primary_child = min(children, key=lambda child: (child.created_at, str(child.id)))
        return primary_child.id

    async def _stop_non_primary_active_trackers_if_needed(
        self,
        family: Family,
        *,
        next_plan_code: str,
        next_status: str,
    ) -> None:
        premium_active = next_plan_code in {"plus", "pro"} and next_status in {
            "trialing",
            "active",
            "grace",
        }
        if premium_active:
            return

        primary_child_id = family.free_primary_child_id
        children = await self._child_repo.get_by_family_id(family.id)
        now = datetime.now(UTC)
        for child in children:
            if child.id == primary_child_id:
                continue
            await self._stop_active_feeding_for_child(child.id, now)
            await self._stop_active_sleep_for_child(child.id, now)

    async def _stop_active_feeding_for_child(self, child_id: UUID, stopped_at: datetime) -> None:
        active = await self._feeding_repo.get_active_by_child_id(child_id)
        if active is None:
            return
        started_at = active.started_at or active.recorded_at
        ended_at = stopped_at if stopped_at >= started_at else started_at
        duration_minutes = max(0, int((ended_at - started_at).total_seconds() // 60))
        await self._feeding_repo.update(
            replace(
                active,
                ended_at=ended_at,
                duration_minutes=duration_minutes,
                status="completed",
            )
        )

    async def _stop_active_sleep_for_child(self, child_id: UUID, stopped_at: datetime) -> None:
        active = await self._sleep_repo.get_active_by_child_id(child_id)
        if active is None:
            return
        ended_at = stopped_at if stopped_at >= active.started_at else active.started_at
        await self._sleep_repo.update(
            replace(
                active,
                ended_at=ended_at,
                status="completed",
            )
        )

    async def apply_debug_subscription_action(
        self,
        account: AuthenticatedAccount,
        dto: BillingDebugActionDto,
    ) -> BillingDebugResponseDto:
        self._ensure_local_debug_allowed()
        family = await self._require_family_for_account(account)
        plan = await self._require_plan(dto.plan_code)
        expires_at = dto.expires_at
        if expires_at is None and dto.status in {"active", "grace", "canceled"}:
            expires_at = datetime.now(UTC) + timedelta(days=30)

        payload = {
            "family_id": str(family.id),
            "plan_code": dto.plan_code,
            "status": dto.status,
            "expires_at": expires_at.isoformat() if expires_at else None,
        }
        subscription = await self._upsert_subscription(
            family,
            plan,
            status=dto.status,
            provider="stub",
            provider_customer_id=None,
            provider_subscription_id=None,
            expires_at=expires_at,
            trial_ends_at=None,
            payload=payload,
        )
        updated_family = await self._sync_family_snapshot(
            family,
            plan,
            status=dto.status,
            provider="stub",
            product_id=plan.apple_product_id,
            expires_at=expires_at,
            billing_account_id=family.owner_account_id,
        )
        await self._append_billing_event(
            family_id=family.id,
            subscription_id=subscription.id,
            event_type=f"debug_{dto.status}",
            payload=payload,
        )
        access = await self._subscription_access_service.get_for_account(account)
        return BillingDebugResponseDto(
            family=self._family_to_response(updated_family),
            access=access,
        )

    async def reset_debug_subscription_to_free(
        self,
        account: AuthenticatedAccount,
    ) -> BillingDebugResponseDto:
        self._ensure_local_debug_allowed()
        family = await self._require_family_for_account(account)
        plan = await self._require_plan("free")
        payload = {"family_id": str(family.id), "plan_code": "free", "status": "inactive"}
        subscription = await self._upsert_subscription(
            family,
            plan,
            status="inactive",
            provider="stub",
            provider_customer_id=None,
            provider_subscription_id=None,
            expires_at=None,
            trial_ends_at=None,
            payload=payload,
        )
        updated_family = await self._sync_family_snapshot(
            family,
            plan,
            status="inactive",
            provider="stub",
            product_id=plan.apple_product_id,
            expires_at=None,
            billing_account_id=family.billing_account_id,
        )
        await self._append_billing_event(
            family_id=family.id,
            subscription_id=subscription.id,
            event_type="debug_reset_free",
            payload=payload,
        )
        access = await self._subscription_access_service.get_for_account(account)
        return BillingDebugResponseDto(
            family=self._family_to_response(updated_family),
            access=access,
        )

    async def sync_provider_subscription(
        self,
        account: AuthenticatedAccount,
        dto: BillingProviderSyncDto,
    ) -> BillingDebugResponseDto:
        """Apply a normalized provider subscription snapshot to the current family."""
        family = await self._require_subscription_manager_for_sync(account)
        plan = await self._require_plan(dto.plan_code)
        payload = {
            "family_id": str(family.id),
            "provider": dto.provider,
            "plan_code": dto.plan_code,
            "status": dto.status,
            "product_id": dto.product_id,
            "provider_customer_id": dto.provider_customer_id,
            "provider_subscription_id": dto.provider_subscription_id,
            "entitlement_code": dto.entitlement_code,
            "expires_at": dto.expires_at.isoformat() if dto.expires_at else None,
            "trial_ends_at": dto.trial_ends_at.isoformat() if dto.trial_ends_at else None,
            "raw_payload": dto.raw_payload,
        }
        subscription = await self._upsert_subscription(
            family,
            plan,
            status=dto.status,
            provider=dto.provider,
            provider_customer_id=dto.provider_customer_id,
            provider_subscription_id=dto.provider_subscription_id,
            expires_at=dto.expires_at,
            trial_ends_at=dto.trial_ends_at,
            payload=payload,
        )
        updated_family = await self._sync_family_snapshot(
            family,
            plan,
            status=dto.status,
            provider=dto.provider,
            product_id=dto.product_id or plan.apple_product_id,
            expires_at=dto.expires_at,
            billing_account_id=family.owner_account_id,
        )
        await self._append_billing_event(
            family_id=family.id,
            subscription_id=subscription.id,
            event_type=f"sync_{dto.provider}_{dto.status}",
            payload=payload,
        )
        access = await self._subscription_access_service.get_for_account(account)
        return BillingDebugResponseDto(
            family=self._family_to_response(updated_family),
            access=access,
        )
