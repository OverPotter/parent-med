import assert from "node:assert/strict";
import test from "node:test";
import { getRestorePurchasesMessage } from "../src/client/subscription/restoreOutcomeCopy.js";

test("returns active restore success copy when restore found an active entitlement", () => {
  assert.equal(
    getRestorePurchasesMessage("en", "restored_active", "inactive"),
    "Purchases restored. Plus access is active again."
  );
});

test("suppresses inactive restore copy when family subscription is already active", () => {
  assert.equal(getRestorePurchasesMessage("en", "restored_inactive", "active"), null);
  assert.equal(getRestorePurchasesMessage("ru", "restored_inactive", "canceled"), null);
});

test("shows inactive restore copy only when the family subscription is not active", () => {
  assert.equal(
    getRestorePurchasesMessage("en", "restored_inactive", "inactive"),
    "Purchases were checked, but no active subscription was found for this account."
  );
  assert.equal(
    getRestorePurchasesMessage("ru", "restored_inactive", "expired"),
    "Покупки проверены, но активная подписка для этого аккаунта не найдена."
  );
});

test("returns null when there is no restore outcome", () => {
  assert.equal(getRestorePurchasesMessage("en", null, "inactive"), null);
});
