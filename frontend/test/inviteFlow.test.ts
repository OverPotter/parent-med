import test from "node:test";
import assert from "node:assert/strict";

import {
  buildJoinFamilyRoute,
  isInviteRoute,
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
