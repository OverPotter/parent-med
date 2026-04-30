import assert from "node:assert/strict";
import test from "node:test";
import { buildNativeAppUrl, getSafeNativeMarketingUrl } from "../src/shared/config/nativeAppLinks.js";

test("getSafeNativeMarketingUrl accepts native PillPath URLs", () => {
  assert.equal(
    getSafeNativeMarketingUrl(buildNativeAppUrl("/auth?mode=login")),
    "pillpath://localhost/auth?mode=login"
  );
});

test("getSafeNativeMarketingUrl rejects external URLs", () => {
  assert.equal(getSafeNativeMarketingUrl("https://evil.example/auth"), null);
  assert.equal(getSafeNativeMarketingUrl("javascript:alert(1)"), null);
});

test("getSafeNativeMarketingUrl rejects malformed custom scheme URLs", () => {
  assert.equal(getSafeNativeMarketingUrl("pillpath://evil-host/auth"), null);
  assert.equal(getSafeNativeMarketingUrl("pillpath://localhost.evil/auth"), null);
});
