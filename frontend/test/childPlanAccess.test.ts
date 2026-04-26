import assert from "node:assert/strict";
import test from "node:test";
import {
  hasReachedChildLimit,
  isChildLockedByPlan,
  isChildIllnessMutationLockedByPlan,
} from "../src/shared/subscription/childPlanAccess.js";

test("hasReachedChildLimit returns true when family is at free child limit", () => {
  assert.equal(
    hasReachedChildLimit({
      planCode: "free",
      subscriptionStatus: "inactive",
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
      currentChildrenCount: 1,
      currentAdultsCount: 1,
      currentPillboxPlanCount: 0,
    }),
    true
  );
});

test("stale access snapshot can underreport child count, so page-level checks must not rely on it alone", () => {
  assert.equal(
    hasReachedChildLimit({
      planCode: "free",
      subscriptionStatus: "inactive",
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
      currentChildrenCount: 0,
      currentAdultsCount: 1,
      currentPillboxPlanCount: 0,
    }),
    false
  );
});

test("isChildLockedByPlan keeps primary child active and locks other children after downgrade", () => {
  const access = {
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
    currentChildrenCount: 2,
    currentAdultsCount: 1,
    currentPillboxPlanCount: 0,
  };

  assert.equal(isChildLockedByPlan("child-1", access), false);
  assert.equal(
    isChildLockedByPlan("child-2", access),
    true
  );
});

test("isChildIllnessMutationLockedByPlan keeps active illness editable for downgraded non-primary child", () => {
  const access = {
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
    currentChildrenCount: 2,
    currentAdultsCount: 1,
    currentPillboxPlanCount: 0,
  };

  assert.equal(isChildIllnessMutationLockedByPlan("child-2", access, true), false);
  assert.equal(isChildIllnessMutationLockedByPlan("child-2", access, false), true);
});
