import assert from "node:assert/strict";
import test from "node:test";
import { shouldRenderDateFieldBadge } from "../src/shared/components/dateFieldBadge.js";

test("shouldRenderDateFieldBadge hides the badge when hideBadge is true", () => {
  assert.equal(shouldRenderDateFieldBadge(true), false);
});

test("shouldRenderDateFieldBadge keeps the badge when hideBadge is false", () => {
  assert.equal(shouldRenderDateFieldBadge(false), true);
});
