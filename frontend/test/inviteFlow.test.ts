import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJoinFamilyRoute,
  clearPendingFamilyInviteRoute,
  getInviteTokenFromRoute,
  isInviteRoute,
  normalizeInviteRoute,
  persistPendingFamilyInviteRoute,
  readPendingFamilyInviteRoute,
  resolveInviteAwareSignedOutPath,
  shouldOpenNativeRouteWithoutSession,
} from "../src/shared/runtime/inviteFlow.js";

test("buildJoinFamilyRoute keeps invite token in the route", () => {
  assert.equal(buildJoinFamilyRoute("abc 123"), "/join-family?token=abc%20123");
});

test("isInviteRoute recognizes join-family routes with and without token", () => {
  assert.equal(isInviteRoute("/join-family"), true);
  assert.equal(isInviteRoute("/join-family?token=abc"), true);
  assert.equal(isInviteRoute("/auth?mode=login"), false);
});

test("shouldOpenNativeRouteWithoutSession allows invite routes before auth", () => {
  assert.equal(shouldOpenNativeRouteWithoutSession("/join-family?token=abc"), true);
  assert.equal(shouldOpenNativeRouteWithoutSession("/children"), false);
});

test("normalizeInviteRoute keeps invite routes and rejects others", () => {
  assert.equal(normalizeInviteRoute("/join-family?token=abc"), "/join-family?token=abc");
  assert.equal(
    normalizeInviteRoute("https://pillpath.app/join-family?dev-latest=1"),
    "/join-family?dev-latest=1"
  );
  assert.equal(normalizeInviteRoute("/auth?mode=login"), null);
});

test("getInviteTokenFromRoute reads invite token when present", () => {
  assert.equal(getInviteTokenFromRoute("/join-family?token=abc%20123"), "abc 123");
  assert.equal(getInviteTokenFromRoute("/join-family?dev-latest=1"), null);
});

test("pending invite route storage persists full invite route", () => {
  const storage = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };

  persistPendingFamilyInviteRoute("/join-family?token=abc", mockStorage);
  assert.equal(readPendingFamilyInviteRoute(mockStorage), "/join-family?token=abc");

  clearPendingFamilyInviteRoute(mockStorage);
  assert.equal(readPendingFamilyInviteRoute(mockStorage), null);
});

test("resolveInviteAwareSignedOutPath prefers invite route over generic auth", () => {
  assert.equal(
    resolveInviteAwareSignedOutPath({
      currentUrl: "/auth?mode=login",
      pendingInviteRoute: "/join-family?token=abc",
      defaultPath: "/auth?mode=login",
    }),
    "/join-family?token=abc"
  );

  assert.equal(
    resolveInviteAwareSignedOutPath({
      currentUrl: "/join-family?token=abc",
      pendingInviteRoute: null,
      defaultPath: "/auth?mode=login",
    }),
    "/join-family?token=abc"
  );
});
