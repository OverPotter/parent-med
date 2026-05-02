import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAuthenticatedLaunchUrl,
  normalizeNativeNavigationUrl,
} from "../src/shared/runtime/nativeNavigation.js";

test("normalizes custom scheme invite links into app routes", () => {
  assert.equal(
    normalizeNativeNavigationUrl("pillpath://localhost/join-family?token=abc#step"),
    "/join-family?token=abc#step"
  );
});

test("normalizes universal https invite links into app routes", () => {
  assert.equal(
    normalizeNativeNavigationUrl(
      "https://pillpath-production-frontend.up.railway.app/join-family?token=abc"
    ),
    "/join-family?token=abc"
  );
});

test("rejects non-route native navigation payloads", () => {
  assert.equal(normalizeNativeNavigationUrl("not-a-route"), null);
});

test("authenticated launch ignores auth routes that would loop after sign-in", () => {
  assert.equal(normalizeAuthenticatedLaunchUrl("pillpath://localhost/auth?mode=login"), null);
  assert.equal(
    normalizeAuthenticatedLaunchUrl("pillpath://localhost/recover-password"),
    null
  );
});

test("authenticated launch keeps regular deep links", () => {
  assert.equal(
    normalizeAuthenticatedLaunchUrl("pillpath://localhost/join-family?token=abc"),
    "/join-family?token=abc"
  );
});
