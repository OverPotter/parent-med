import test from "node:test";
import assert from "node:assert/strict";

import { resolveShouldUseAppEntryWebMode } from "../src/shared/runtime/publicWebsiteMode.js";

test("app entry web mode stays enabled for local development hostname", () => {
  assert.equal(
    resolveShouldUseAppEntryWebMode({
      mode: "development",
      hostname: "localhost",
    }),
    true
  );
});

test("app entry web mode stays enabled for mobile build modes", () => {
  assert.equal(
    resolveShouldUseAppEntryWebMode({
      mode: "mobile-stage",
      hostname: "pillpath-production-frontend.up.railway.app",
    }),
    true
  );
});

test("public website mode is used for non-local production web hosts", () => {
  assert.equal(
    resolveShouldUseAppEntryWebMode({
      mode: "production",
      hostname: "pillpath-production-frontend.up.railway.app",
    }),
    false
  );
});
