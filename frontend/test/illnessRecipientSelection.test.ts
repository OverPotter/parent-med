import assert from "node:assert/strict";
import test from "node:test";

import { resolveIllnessRecipientSelection } from "../src/client/pages/child-illness/recipientSelection.js";

test("resolveIllnessRecipientSelection treats empty selection as all eligible recipients", () => {
  assert.deepEqual(resolveIllnessRecipientSelection([], ["a", "b"], "b"), ["b"]);
});

test("resolveIllnessRecipientSelection keeps only eligible explicit recipients", () => {
  assert.deepEqual(resolveIllnessRecipientSelection(["a", "ghost"], ["a", "b"], "b"), ["a"]);
});

test("resolveIllnessRecipientSelection falls back to the first eligible member when current is unavailable", () => {
  assert.deepEqual(resolveIllnessRecipientSelection([], ["a", "b"], null), ["a"]);
});
