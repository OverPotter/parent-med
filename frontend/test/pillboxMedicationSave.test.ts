import test from "node:test";
import assert from "node:assert/strict";

import type { PillboxPlan } from "../src/shared/api/pillboxPlans.contract.js";
import type { MedicationItem } from "../src/client/pages/pillbox/shared.js";
import { buildOptimisticMedicationSavePlan } from "../src/client/pages/pillbox/medicationSave.js";

function buildPlan(): PillboxPlan {
  return {
    id: "plan-1",
    familyId: "family-1",
    title: "Plan",
    status: "active",
    memberAccountIds: ["account-1"],
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-02T10:00:00Z",
    medications: [
      {
        id: "med-1",
        householdMedicineId: null,
        customMedicineName: "Old name",
        doseAmount: "1 tab",
        mealRule: "before_meal",
        repeatDays: [1, 3, 5],
        times: ["08:00"],
        courseMode: "continuous",
        courseStartDate: null,
        courseEndDate: null,
        position: 0,
      },
      {
        id: "med-2",
        householdMedicineId: null,
        customMedicineName: "Second",
        doseAmount: "5 ml",
        mealRule: "after_meal",
        repeatDays: [2, 4],
        times: ["12:00"],
        courseMode: "period",
        courseStartDate: "2026-05-01",
        courseEndDate: "2026-05-10",
        position: 1,
      },
    ],
  };
}

function buildMedication(): MedicationItem {
  return {
    id: "med-1",
    title: "New name",
    dose: "2 tab",
    times: ["09:30", "21:30"],
    mealRule: "with_meal",
    repeatDays: [1, 2, 3],
    courseMode: "period",
    courseStartDate: "2026-05-02",
    courseEndDate: "2026-05-14",
  };
}

test("buildOptimisticMedicationSavePlan updates only the edited medication for fast details flow", () => {
  const plan = buildPlan();
  const medication = buildMedication();

  const next = buildOptimisticMedicationSavePlan({
    plan,
    medication,
    title: "  New name  ",
    dose: " 2 tab ",
    times: ["09:30", "21:30"],
  });

  assert.equal(next.medications[0]?.customMedicineName, "New name");
  assert.equal(next.medications[0]?.doseAmount, "2 tab");
  assert.deepEqual(next.medications[0]?.times, ["09:30", "21:30"]);
  assert.equal(next.medications[0]?.mealRule, "with_meal");
  assert.deepEqual(next.medications[0]?.repeatDays, [1, 2, 3]);
  assert.equal(next.medications[0]?.courseMode, "period");
  assert.equal(next.medications[0]?.courseStartDate, "2026-05-02");
  assert.equal(next.medications[0]?.courseEndDate, "2026-05-14");

  assert.equal(next.medications[1]?.customMedicineName, "Second");
  assert.deepEqual(next.medications[1]?.times, ["12:00"]);
  assert.notEqual(next, plan);
});

test("buildOptimisticMedicationSavePlan falls back to a default time when editor times are empty", () => {
  const next = buildOptimisticMedicationSavePlan({
    plan: buildPlan(),
    medication: buildMedication(),
    title: "New name",
    dose: "2 tab",
    times: [],
  });

  assert.deepEqual(next.medications[0]?.times, ["08:30"]);
});
