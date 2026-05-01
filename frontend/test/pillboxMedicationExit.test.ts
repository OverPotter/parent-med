import test from "node:test";
import assert from "node:assert/strict";

import { resolveMedicationExitDraft, type MedicationItem } from "../src/client/pages/pillbox/shared.js";

function medication(overrides: Partial<MedicationItem> = {}): MedicationItem {
  return {
    id: "med-1",
    title: "Ибупрофен",
    dose: "5 мл",
    times: ["08:30"],
    mealRule: "after_meal",
    repeatDays: [1, 2, 3, 4, 5, 6, 7],
    courseMode: "continuous",
    courseStartDate: "",
    courseEndDate: "",
    ...overrides,
  };
}

test("resolveMedicationExitDraft keeps saved medication changes intact", () => {
  const editedMedication = medication({ times: ["12:10"] });

  const resolved = resolveMedicationExitDraft({
    medications: [editedMedication],
    pendingNewMedicationId: null,
    editorMedicationBaseline: medication({ times: ["08:30"] }),
    saveCommitted: true,
  });

  assert.deepEqual(resolved.medications, [editedMedication]);
  assert.equal(resolved.pendingNewMedicationId, null);
  assert.equal(resolved.editorMedicationBaseline, null);
});

test("resolveMedicationExitDraft removes unfinished pending medication on cancel", () => {
  const pendingMedication = medication({ id: "new-1", title: "", dose: "", times: [""] });

  const resolved = resolveMedicationExitDraft({
    medications: [pendingMedication],
    pendingNewMedicationId: "new-1",
    editorMedicationBaseline: null,
    saveCommitted: false,
  });

  assert.deepEqual(resolved.medications, []);
  assert.equal(resolved.pendingNewMedicationId, null);
  assert.equal(resolved.editorMedicationBaseline, null);
});

test("resolveMedicationExitDraft restores baseline medication on cancel", () => {
  const baselineMedication = medication({ times: ["08:30"] });
  const editedMedication = medication({ times: ["12:10"] });

  const resolved = resolveMedicationExitDraft({
    medications: [editedMedication],
    pendingNewMedicationId: null,
    editorMedicationBaseline: baselineMedication,
    saveCommitted: false,
  });

  assert.deepEqual(resolved.medications, [baselineMedication]);
  assert.equal(resolved.pendingNewMedicationId, null);
  assert.equal(resolved.editorMedicationBaseline, null);
});
