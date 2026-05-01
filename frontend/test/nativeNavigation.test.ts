import test from "node:test";
import assert from "node:assert/strict";

import { normalizeNativeNavigationUrl } from "../src/shared/runtime/nativeNavigation.js";

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
