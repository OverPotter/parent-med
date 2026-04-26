import assert from "node:assert/strict";
import test from "node:test";
import { getUpgradeDialogCopy } from "../src/client/subscription/upgradeDialogCopy.js";

test("getUpgradeDialogCopy returns family invite upgrade copy", () => {
  const copy = getUpgradeDialogCopy("ru", "invite_family");
  assert.match(copy.title, /Plus/);
  assert.equal(copy.highlights.length, 3);
});

test("getUpgradeDialogCopy returns second child upgrade copy", () => {
  const copy = getUpgradeDialogCopy("en", "second_child");
  assert.match(copy.description, /multiple children/i);
  assert.equal(copy.highlights.length, 3);
});
