import assert from "node:assert/strict";
import test from "node:test";
import { buildRevenueCatSubscriptionInvalidationKeys } from "../src/client/subscription/revenueCatInvalidation.js";

test("buildRevenueCatSubscriptionInvalidationKeys targets family access and plus-sensitive queries", () => {
  assert.deepEqual(buildRevenueCatSubscriptionInvalidationKeys("account-1", "family-1"), [
    ["families", "account-1"],
    ["families", "me", "account-1"],
    ["families", "me", "access", "account-1"],
    ["families", "me", "access", "family-1"],
    ["children", "family-1"],
    ["pillbox-plans", "family-1"],
  ]);
});

test("buildRevenueCatSubscriptionInvalidationKeys keeps current null-key behavior for bootstrapping", () => {
  assert.deepEqual(buildRevenueCatSubscriptionInvalidationKeys(null, null), [
    ["families", null],
    ["families", "me", null],
    ["families", "me", "access", null],
    ["families", "me", "access", null],
    ["children", null],
    ["pillbox-plans", null],
  ]);
});
