import assert from "node:assert/strict";
import test from "node:test";

import { canManageChildrenList } from "../src/shared/permissions/familyAccess.js";
import type { FamilyAccessPolicy } from "../src/shared/types/api.js";

function policy(overrides: Partial<FamilyAccessPolicy> = {}): FamilyAccessPolicy {
  return {
    allChildren: false,
    childIds: [],
    childrenAccess: "view",
    cabinetAccess: "none",
    pillboxAccess: "none",
    cabinetPushEnabled: false,
    ...overrides,
  };
}

test("canManageChildrenList allows admins", () => {
  assert.equal(canManageChildrenList("admin", policy()), true);
});

test("canManageChildrenList allows members with full edit access to all children", () => {
  assert.equal(
    canManageChildrenList(
      "member",
      policy({
        allChildren: true,
        childrenAccess: "edit",
      })
    ),
    true
  );
});

test("canManageChildrenList rejects members with partial child edit scope", () => {
  assert.equal(
    canManageChildrenList(
      "member",
      policy({
        allChildren: false,
        childIds: ["child-1"],
        childrenAccess: "edit",
      })
    ),
    false
  );
});
