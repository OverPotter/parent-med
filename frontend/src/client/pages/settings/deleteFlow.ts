export type SettingsDeleteAction = "delete_family" | "delete_account";
export type SettingsSubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "grace"
  | "canceled"
  | "expired";

const DELETE_BLOCKING_SUBSCRIPTION_STATUSES = new Set<SettingsSubscriptionStatus>([
  "trialing",
  "active",
  "grace",
  "canceled",
]);

export function resolveSettingsDeleteAction(isFamilyOwner: boolean): SettingsDeleteAction {
  return isFamilyOwner ? "delete_family" : "delete_account";
}

export function shouldBlockSettingsDeletion(
  canManageSubscription: boolean,
  subscriptionStatus: SettingsSubscriptionStatus
): boolean {
  return canManageSubscription && DELETE_BLOCKING_SUBSCRIPTION_STATUSES.has(subscriptionStatus);
}

export function isSettingsFreeSubscriptionState(
  subscriptionStatus: SettingsSubscriptionStatus
): boolean {
  return subscriptionStatus === "inactive" || subscriptionStatus === "expired";
}
