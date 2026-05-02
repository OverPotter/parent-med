import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAuthenticatedLaunchUrl,
  normalizeNativeNavigationUrl,
} from "../src/shared/runtime/nativeNavigation.js";

test("normalizes custom scheme app links into app routes", () => {
  assert.equal(
    normalizeNativeNavigationUrl("pillpath://localhost/family?tab=members#section"),
    "/family?tab=members#section"
  );
});

test("normalizes universal https app links into app routes", () => {
  assert.equal(
    normalizeNativeNavigationUrl("https://pillpath-production-frontend.up.railway.app/children"),
    "/children"
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
    normalizeAuthenticatedLaunchUrl("pillpath://localhost/family"),
    "/family"
  );
});
