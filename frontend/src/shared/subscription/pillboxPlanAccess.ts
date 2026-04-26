import type { FamilySubscriptionAccess } from "@shared/types/api";

export function hasReachedPillboxPlanLimit(
  access: FamilySubscriptionAccess | null | undefined
): boolean {
  if (!access) {
    return false;
  }
  if (access.maxPillboxPlans === null || access.maxPillboxPlans === undefined) {
    return false;
  }
  return access.currentPillboxPlanCount >= access.maxPillboxPlans;
}

export function shouldLockPillboxPlanCreation(params: {
  access: FamilySubscriptionAccess | null | undefined;
  screen: "hub" | "details" | "setup" | "loading" | "analytics" | "medication";
  selectedPlanId: string | null;
}): boolean {
  const { access, screen, selectedPlanId } = params;
  if (screen === "details" || screen === "analytics") {
    return false;
  }
  if (selectedPlanId && selectedPlanId !== "new") {
    return false;
  }
  return hasReachedPillboxPlanLimit(access);
}

export function shouldShowPillboxFreeDowngradeNotice(
  access: FamilySubscriptionAccess | null | undefined
): boolean {
  if (!access) {
    return false;
  }
  return access.premiumActive === false && access.maxPillboxPlans === 1 && access.currentPillboxPlanCount > 1;
}
