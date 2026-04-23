import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveRecipientSelection,
  shouldAutoAssignCurrentRecipient,
} from "../src/shared/utils/recipientSelection.js";

test("resolveRecipientSelection keeps explicit recipients that are still eligible", () => {
  assert.deepEqual(
    resolveRecipientSelection(["member-2", "member-1"], "member-1", ["member-1", "member-2"]),
    ["member-2", "member-1"]
  );
});

test("resolveRecipientSelection falls back to current account when selection is empty", () => {
  assert.deepEqual(resolveRecipientSelection([], "member-1", ["member-1", "member-2"]), ["member-1"]);
});

test("resolveRecipientSelection drops ineligible ids before returning fallback", () => {
  assert.deepEqual(resolveRecipientSelection(["member-3"], "member-1", ["member-1", "member-2"]), [
    "member-1",
  ]);
});

test("shouldAutoAssignCurrentRecipient only auto-assigns when list is empty and current user is eligible", () => {
  assert.equal(shouldAutoAssignCurrentRecipient([], "member-1", ["member-1"]), true);
  assert.equal(shouldAutoAssignCurrentRecipient(["member-2"], "member-1", ["member-1"]), false);
  assert.equal(shouldAutoAssignCurrentRecipient([], "member-3", ["member-1"]), false);
});
