import test from "node:test";
import assert from "node:assert/strict";
import {
  canSubmitMedicationPlanComposer,
  hasDoseUnitHint,
} from "../src/client/pages/child-illness/reminderUtils.js";

test("numeric-only dose shows a hint but does not block reminder submit", () => {
  assert.equal(hasDoseUnitHint("1"), true);
  assert.equal(
    canSubmitMedicationPlanComposer({
      isPending: false,
      planMode: "manual",
      selectedMedicineId: "",
      customMedicineName: "Нурофен",
      minIntervalInput: "3",
      parsedIntervalMinutes: 180,
      hasFutureFirstDoseSelection: false,
    }),
    true
  );
});

test("reminder submit stays blocked when required medicine or interval data is missing", () => {
  assert.equal(
    canSubmitMedicationPlanComposer({
      isPending: false,
      planMode: "cabinet",
      selectedMedicineId: "",
      customMedicineName: "",
      minIntervalInput: "3",
      parsedIntervalMinutes: 180,
      hasFutureFirstDoseSelection: false,
    }),
    false
  );

  assert.equal(
    canSubmitMedicationPlanComposer({
      isPending: false,
      planMode: "manual",
      selectedMedicineId: "",
      customMedicineName: "Нурофен",
      minIntervalInput: "",
      parsedIntervalMinutes: null,
      hasFutureFirstDoseSelection: false,
    }),
    false
  );
});
