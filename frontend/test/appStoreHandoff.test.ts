import test from "node:test";
import assert from "node:assert/strict";

import { shouldAutoRedirectPublicPageToAppStore } from "../src/shared/runtime/appStoreHandoff.js";

test("auto redirects public handoff pages to App Store on iPhone", () => {
  assert.equal(
    shouldAutoRedirectPublicPageToAppStore({
      isPublicWebsiteMode: true,
      appStoreUrl: "https://apps.apple.com/app/id123",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      maxTouchPoints: 5,
    }),
    true
  );
});

test("does not auto redirect when App Store URL is missing", () => {
  assert.equal(
    shouldAutoRedirectPublicPageToAppStore({
      isPublicWebsiteMode: true,
      appStoreUrl: "",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      maxTouchPoints: 5,
    }),
    false
  );
});

test("does not auto redirect on desktop browsers", () => {
  assert.equal(
    shouldAutoRedirectPublicPageToAppStore({
      isPublicWebsiteMode: true,
      appStoreUrl: "https://apps.apple.com/app/id123",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      maxTouchPoints: 0,
    }),
    false
  );
});

test("treats iPadOS safari reported as Macintosh as iOS device", () => {
  assert.equal(
    shouldAutoRedirectPublicPageToAppStore({
      isPublicWebsiteMode: true,
      appStoreUrl: "https://apps.apple.com/app/id123",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      maxTouchPoints: 5,
    }),
    true
  );
});
