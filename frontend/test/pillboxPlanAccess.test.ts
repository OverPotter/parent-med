import assert from "node:assert/strict";
import test from "node:test";
import {
  hasReachedPillboxPlanLimit,
  shouldLockPillboxPlanCreation,
  shouldShowPillboxFreeDowngradeNotice,
} from "../src/shared/subscription/pillboxPlanAccess.js";

const freeAccess = {
  planCode: "free" as const,
  subscriptionStatus: "inactive" as const,
  premiumActive: false,
  hasPlusAccess: false,
  isBillingOwner: true,
  canManageSubscription: true,
  canInviteMembers: false,
  canManageMemberRoles: false,
  canUseLiveActivities: false,
  canExportCsv: false,
  maxChildren: 1,
  maxAdults: 1,
  maxPillboxPlans: 1,
  freePrimaryChildId: "child-1",
  freePrimaryPillboxPlanId: "plan-1",
  currentChildrenCount: 1,
  currentAdultsCount: 1,
  currentPillboxPlanCount: 2,
};

test("hasReachedPillboxPlanLimit returns true at free pillbox limit", () => {
  assert.equal(hasReachedPillboxPlanLimit(freeAccess), true);
});

test("shouldLockPillboxPlanCreation only locks create flow and not details screens", () => {
  assert.equal(
    shouldLockPillboxPlanCreation({
      access: freeAccess,
      screen: "hub",
      selectedPlanId: null,
    }),
    true
  );
  assert.equal(
    shouldLockPillboxPlanCreation({
      access: freeAccess,
      screen: "details",
      selectedPlanId: "plan-1",
    }),
    false
  );
});

test("shouldShowPillboxFreeDowngradeNotice appears only for downgraded multi-plan free state", () => {
  assert.equal(shouldShowPillboxFreeDowngradeNotice(freeAccess), true);
  assert.equal(
    shouldShowPillboxFreeDowngradeNotice({
      ...freeAccess,
      currentPillboxPlanCount: 1,
    }),
    false
  );
});
