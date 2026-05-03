import assert from "node:assert/strict";
import test from "node:test";
import {
  runOptimisticRecipientSelectionUpdate,
  toggleNormalizedRecipientSelection,
} from "../src/shared/utils/optimisticRecipientSelection.js";

test("toggleNormalizedRecipientSelection removes a member and normalizes empty selection", () => {
  const nextIds = toggleNormalizedRecipientSelection("member-1", ["member-1"], (selectedIds) =>
    selectedIds.length > 0 ? selectedIds : ["member-1"]
  );

  assert.deepEqual(nextIds, ["member-1"]);
});

test("toggleNormalizedRecipientSelection adds a new member without dropping current selection", () => {
  const nextIds = toggleNormalizedRecipientSelection("member-2", ["member-1"], (selectedIds) =>
    selectedIds
  );

  assert.deepEqual(nextIds, ["member-1", "member-2"]);
});

test("runOptimisticRecipientSelectionUpdate keeps optimistic selection after successful submit", async () => {
  const appliedSelections: string[][] = [];
  const submittingStates: boolean[] = [];

  const committed = await runOptimisticRecipientSelectionUpdate({
    previousIds: ["member-1"],
    nextIds: ["member-1", "member-2"],
    applySelection: (ids) => {
      appliedSelections.push(ids);
    },
    setSubmitting: (value) => {
      submittingStates.push(value);
    },
    submitSelection: async (ids) => {
      assert.deepEqual(ids, ["member-1", "member-2"]);
    },
  });

  assert.equal(committed, true);
  assert.deepEqual(appliedSelections, [["member-1", "member-2"]]);
  assert.deepEqual(submittingStates, [true, false]);
});

test("runOptimisticRecipientSelectionUpdate rolls selection back after submit failure", async () => {
  const appliedSelections: string[][] = [];
  const submittingStates: boolean[] = [];

  const committed = await runOptimisticRecipientSelectionUpdate({
    previousIds: ["member-1"],
    nextIds: ["member-1", "member-2"],
    applySelection: (ids) => {
      appliedSelections.push(ids);
    },
    setSubmitting: (value) => {
      submittingStates.push(value);
    },
    submitSelection: async () => {
      throw new Error("network");
    },
  });

  assert.equal(committed, false);
  assert.deepEqual(appliedSelections, [["member-1", "member-2"], ["member-1"]]);
  assert.deepEqual(submittingStates, [true, false]);
});
