import test from "node:test";
import assert from "node:assert/strict";

import {
  appendInviteAuthIntent,
  buildAuthLoginRoute,
  buildJoinFamilyRoute,
  clearPendingFamilyInviteRoute,
  getInviteAuthIntentFromRoute,
  getInviteTokenFromRoute,
  isInviteRoute,
  normalizeInviteRoute,
  persistPendingFamilyInviteRoute,
  readPendingFamilyInviteRoute,
  resolveInviteAwareAuthSuccessPath,
  resolveInviteAwareSignedOutPath,
  shouldOpenNativeRouteWithoutSession,
} from "../src/shared/runtime/inviteFlow.js";

test("buildJoinFamilyRoute keeps invite token in the route", () => {
  assert.equal(buildJoinFamilyRoute("abc 123"), "/join-family?token=abc%20123");
});

test("buildAuthLoginRoute points to native login entry", () => {
  assert.equal(buildAuthLoginRoute(), "/auth?mode=login");
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
  assert.equal(normalizeInviteRoute("/join-family"), null);
  assert.equal(normalizeInviteRoute("/auth?mode=login"), null);
});

test("getInviteTokenFromRoute reads invite token when present", () => {
  assert.equal(getInviteTokenFromRoute("/join-family?token=abc%20123"), "abc 123");
  assert.equal(getInviteTokenFromRoute("/join-family?dev-latest=1"), null);
});

test("appendInviteAuthIntent stores login intent on invite routes", () => {
  assert.equal(
    appendInviteAuthIntent("/join-family?token=abc", "login"),
    "/join-family?token=abc&intent=login"
  );
  assert.equal(getInviteAuthIntentFromRoute("/join-family?token=abc&intent=login"), "login");
  assert.equal(appendInviteAuthIntent("/auth?mode=login", "login"), null);
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

test("pending invite route storage ignores incomplete invite routes", () => {
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

  persistPendingFamilyInviteRoute("/join-family", mockStorage);
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
 
  assert.equal(
    resolveInviteAwareSignedOutPath({
      currentUrl: "/join-family",
      pendingInviteRoute: null,
      defaultPath: "/auth?mode=login",
    }),
    "/auth?mode=login"
  );
});

test("resolveInviteAwareAuthSuccessPath resumes invite only when auth was explicitly invite-driven", () => {
  assert.equal(
    resolveInviteAwareAuthSuccessPath({
      requestedNext: "invite",
      pendingInviteRoute: "/join-family?token=abc",
      defaultPath: "/family",
    }),
    "/join-family?token=abc"
  );

  assert.equal(
    resolveInviteAwareAuthSuccessPath({
      requestedNext: null,
      pendingInviteRoute: "/join-family?token=abc",
      defaultPath: "/family",
    }),
    "/family"
  );
});
