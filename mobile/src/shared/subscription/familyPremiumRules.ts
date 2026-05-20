type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "grace"
  | "canceled"
  | "expired";

export function isAddChildLocked(params: {
  premiumActive: boolean;
  currentChildrenCount: number;
}) {
  return !params.premiumActive && params.currentChildrenCount >= 1;
}

export function hasLockedExtraChildren(params: {
  premiumActive: boolean;
  currentChildrenCount: number;
}) {
  return !params.premiumActive && params.currentChildrenCount > 1;
}

export function isFamilyInviteLocked(params: { premiumActive: boolean }) {
  return !params.premiumActive;
}

export function isCabinetCatalogLocked(params: { premiumActive: boolean }) {
  return !params.premiumActive;
}

export function isPillboxPlanCreationLocked(params: {
  premiumActive: boolean;
  currentPillboxPlanCount: number;
}) {
  return !params.premiumActive && params.currentPillboxPlanCount >= 1;
}

export function isLiveActivitiesLocked(params: {
  canUseLiveActivities: boolean;
}) {
  return !params.canUseLiveActivities;
}

export function shouldOpenSubscriptionPurchasePaywall(params: {
  premiumActive: boolean;
  subscriptionStatus: SubscriptionStatus;
}) {
  return (
    !params.premiumActive ||
    params.subscriptionStatus === "inactive" ||
    params.subscriptionStatus === "expired"
  );
}
