import assert from "node:assert/strict";
import test from "node:test";
import { toFamilySubscriptionAccess } from "../src/shared/types/familySubscriptionAccess.js";

test("toFamilySubscriptionAccess normalizes missing fields to free defaults", () => {
  const access = toFamilySubscriptionAccess({});

  assert.equal(access.planCode, "free");
  assert.equal(access.subscriptionStatus, "inactive");
  assert.equal(access.premiumActive, false);
  assert.equal(access.canInviteMembers, false);
  assert.equal(access.canUseLiveActivities, false);
  assert.equal(access.maxChildren, null);
  assert.equal(access.currentChildrenCount, 0);
});

test("toFamilySubscriptionAccess keeps premium capabilities and limits", () => {
  const access = toFamilySubscriptionAccess({
    plan_code: "plus",
    subscription_status: "active",
    premium_active: true,
    has_plus_access: true,
    can_invite_members: true,
    can_manage_member_roles: true,
    can_use_live_activities: true,
    can_export_csv: true,
    max_children: null,
    max_adults: null,
    max_pillbox_plans: null,
    current_children_count: 3,
    current_adults_count: 2,
    current_pillbox_plan_count: 4,
  });

  assert.equal(access.planCode, "plus");
  assert.equal(access.subscriptionStatus, "active");
  assert.equal(access.premiumActive, true);
  assert.equal(access.hasPlusAccess, true);
  assert.equal(access.canInviteMembers, true);
  assert.equal(access.canManageMemberRoles, true);
  assert.equal(access.canUseLiveActivities, true);
  assert.equal(access.canExportCsv, true);
  assert.equal(access.maxChildren, null);
  assert.equal(access.currentChildrenCount, 3);
  assert.equal(access.currentAdultsCount, 2);
  assert.equal(access.currentPillboxPlanCount, 4);
});
