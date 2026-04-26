import assert from "node:assert/strict";
import test from "node:test";
import { buildRevenueCatProviderSyncPayload } from "../src/shared/utils/revenueCatPayload.js";
import {
  clearRevenueCatSyncSuppressionForAccount,
  isRevenueCatSyncSuppressedForAccount,
  suppressRevenueCatSyncForAccount,
} from "../src/shared/utils/revenueCatSyncSuppression.js";

test("buildRevenueCatProviderSyncPayload maps active plus entitlement to provider payload", () => {
  const payload = buildRevenueCatProviderSyncPayload({
    configured: true,
    appUserId: "acc_1",
    originalAppUserId: "acc_1",
    entitlementCode: "plus",
    entitlementActive: true,
    status: "trialing",
    productId: "pillpath_plus_monthly",
    latestPurchaseDate: "2026-04-25T10:00:00Z",
    originalPurchaseDate: "2026-04-25T10:00:00Z",
    expirationDate: "2026-05-25T10:00:00Z",
    willRenew: true,
    isSandbox: true,
    ownershipType: "purchased",
    providerCustomerId: null,
    providerSubscriptionId: null,
    rawPayload: { source: "test" },
  });

  assert.equal(payload.provider, "revenuecat");
  assert.equal(payload.plan_code, "plus");
  assert.equal(payload.status, "trialing");
  assert.equal(payload.product_id, "pillpath_plus_monthly");
});

test("buildRevenueCatProviderSyncPayload downgrades inactive entitlement to free", () => {
  const payload = buildRevenueCatProviderSyncPayload({
    configured: true,
    appUserId: "acc_1",
    originalAppUserId: "acc_1",
    entitlementCode: "plus",
    entitlementActive: false,
    status: "expired",
    productId: "pillpath_plus_monthly",
    latestPurchaseDate: null,
    originalPurchaseDate: null,
    expirationDate: null,
    willRenew: false,
    isSandbox: true,
    ownershipType: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    rawPayload: {},
  });

  assert.equal(payload.plan_code, "free");
  assert.equal(payload.status, "inactive");
});

test("buildRevenueCatProviderSyncPayload maps premium entitlement to plus commercial plan", () => {
  const payload = buildRevenueCatProviderSyncPayload({
    configured: true,
    appUserId: "acc_1",
    originalAppUserId: "acc_1",
    entitlementCode: "premium",
    entitlementActive: true,
    status: "active",
    productId: "com.pillpath.premium.monthly",
    latestPurchaseDate: "2026-04-25T10:00:00Z",
    originalPurchaseDate: "2026-04-25T10:00:00Z",
    expirationDate: "2026-05-25T10:00:00Z",
    willRenew: true,
    isSandbox: true,
    ownershipType: "purchased",
    providerCustomerId: null,
    providerSubscriptionId: null,
    rawPayload: {},
  });

  assert.equal(payload.plan_code, "plus");
  assert.equal(payload.entitlement_code, "premium");
  assert.equal(payload.status, "active");
});

test("RevenueCat sync suppression can force a local free-mode for one account", () => {
  const storage = new Map<string, string>();
  globalThis.window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      key: () => null,
      get length() {
        return storage.size;
      },
    },
  } as unknown as typeof window;

  assert.equal(isRevenueCatSyncSuppressedForAccount("acc_1"), false);
  suppressRevenueCatSyncForAccount("acc_1");
  assert.equal(isRevenueCatSyncSuppressedForAccount("acc_1"), true);
  clearRevenueCatSyncSuppressionForAccount("acc_1");
  assert.equal(isRevenueCatSyncSuppressedForAccount("acc_1"), false);
});
