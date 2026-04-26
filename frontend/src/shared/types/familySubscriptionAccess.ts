import type { FamilySubscriptionAccess } from "./api";

export interface RawFamilySubscriptionAccess {
  plan_code?: "free" | "plus" | "pro" | null;
  subscription_status?: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired" | null;
  premium_active?: boolean | null;
  has_plus_access?: boolean | null;
  is_billing_owner?: boolean | null;
  can_manage_subscription?: boolean | null;
  can_invite_members?: boolean | null;
  can_manage_member_roles?: boolean | null;
  can_use_live_activities?: boolean | null;
  can_export_csv?: boolean | null;
  max_children?: number | null;
  max_adults?: number | null;
  max_pillbox_plans?: number | null;
  free_primary_child_id?: string | null;
  free_primary_pillbox_plan_id?: string | null;
  current_children_count?: number | null;
  current_adults_count?: number | null;
  current_pillbox_plan_count?: number | null;
}

export function toFamilySubscriptionAccess(
  raw: RawFamilySubscriptionAccess
): FamilySubscriptionAccess {
  return {
    planCode: raw.plan_code ?? "free",
    subscriptionStatus: raw.subscription_status ?? "inactive",
    premiumActive: raw.premium_active ?? false,
    hasPlusAccess: raw.has_plus_access ?? false,
    isBillingOwner: raw.is_billing_owner ?? false,
    canManageSubscription: raw.can_manage_subscription ?? false,
    canInviteMembers: raw.can_invite_members ?? false,
    canManageMemberRoles: raw.can_manage_member_roles ?? false,
    canUseLiveActivities: raw.can_use_live_activities ?? false,
    canExportCsv: raw.can_export_csv ?? false,
    maxChildren: raw.max_children ?? null,
    maxAdults: raw.max_adults ?? null,
    maxPillboxPlans: raw.max_pillbox_plans ?? null,
    freePrimaryChildId: raw.free_primary_child_id ?? null,
    freePrimaryPillboxPlanId: raw.free_primary_pillbox_plan_id ?? null,
    currentChildrenCount: raw.current_children_count ?? 0,
    currentAdultsCount: raw.current_adults_count ?? 0,
    currentPillboxPlanCount: raw.current_pillbox_plan_count ?? 0,
  };
}
