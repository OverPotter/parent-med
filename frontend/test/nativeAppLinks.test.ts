import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAppStoreUrlFromId,
  buildNativeAppUrl,
  getSafeNativeMarketingUrl,
} from "../src/shared/config/nativeAppLinks.js";

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

test("buildAppStoreUrlFromId builds public app store links from numeric ids", () => {
  assert.equal(
    buildAppStoreUrlFromId("6762408566"),
    "https://apps.apple.com/app/id6762408566"
  );
});

test("buildAppStoreUrlFromId rejects invalid ids", () => {
  assert.equal(buildAppStoreUrlFromId("app-6762408566"), "");
  assert.equal(buildAppStoreUrlFromId(""), "");
});
