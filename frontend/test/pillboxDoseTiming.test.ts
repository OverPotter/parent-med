import test from "node:test";
import assert from "node:assert/strict";

import type { PillboxGroup } from "../src/client/pages/pillbox/shared.js";
import { canMarkGroupDose } from "../src/client/pages/pillbox/shared.js";

const REAL_DATE_NOW = Date.now;

function buildGroup(nextDoseAt: string): PillboxGroup {
  return {
    id: "plan-1",
    title: "Plan",
    status: "active",
    activeCount: 1,
    nextDoseAt,
    nextDose: "09:00",
    nextMedicationId: "med-1",
    nextMedicationTitle: "Ibuprofen",
    members: ["account-1"],
    courseSummaryKind: "continuous",
    progress: 0,
  };
}

test.afterEach(() => {
  Date.now = REAL_DATE_NOW;
});

test("canMarkGroupDose allows a short pre-due grace window", () => {
  const scheduledAt = new Date("2026-05-02T09:00:00.000Z");
  Date.now = () => scheduledAt.getTime() - 30_000;

  assert.equal(canMarkGroupDose(buildGroup(scheduledAt.toISOString())), true);
});

test("canMarkGroupDose still rejects slots that are too early", () => {
  const scheduledAt = new Date("2026-05-02T09:00:00.000Z");
  Date.now = () => scheduledAt.getTime() - 61_000;

  assert.equal(canMarkGroupDose(buildGroup(scheduledAt.toISOString())), false);
});
