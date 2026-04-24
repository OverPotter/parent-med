import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanAdministrationStats,
  formatDoseClock,
  formatDoseStatusLabel,
} from "../src/client/utils/medicationPlans.js";

test("new medication plan without administrations schedules first reminder from plan creation time", () => {
  const now = new Date("2026-04-24T10:00:00+03:00");
  const stats = buildPlanAdministrationStats(
    {
      householdMedicineId: null,
      customMedicineName: "Нурофен",
      minIntervalMinutes: 180,
      maxDosesPerDay: null,
      createdAt: "2026-04-24T09:30:00+03:00",
    },
    [],
    now
  );

  assert.equal(stats.lastAdministration, null);
  assert.equal(stats.blockedByInterval, true);
  assert.equal(stats.nextAllowedAt?.toISOString(), new Date("2026-04-24T12:30:00+03:00").toISOString());
  assert.equal(
    stats.availabilityLabel,
    `дать в ${formatDoseClock(new Date("2026-04-24T12:30:00+03:00"), "ru")}`
  );
});

test("medication plan still uses last administration when it exists", () => {
  const now = new Date("2026-04-24T10:00:00+03:00");
  const stats = buildPlanAdministrationStats(
    {
      householdMedicineId: null,
      customMedicineName: "Нурофен",
      minIntervalMinutes: 180,
      maxDosesPerDay: null,
      createdAt: "2026-04-24T09:30:00+03:00",
    },
    [
      {
        id: "admin-1",
        episodeId: "episode-1",
        householdMedicineId: null,
        customMedicineName: "Нурофен",
        administeredAt: "2026-04-24T09:50:00+03:00",
        administeredByAccountId: null,
        administeredByNameSnapshot: null,
        amount: "5 мл",
        unit: null,
        reason: null,
      },
    ],
    now
  );

  assert.equal(stats.nextAllowedAt?.toISOString(), new Date("2026-04-24T12:50:00+03:00").toISOString());
  assert.equal(
    stats.availabilityLabel,
    `дать в ${formatDoseClock(new Date("2026-04-24T12:50:00+03:00"), "ru")}`
  );
});

test("dose status label switches from absolute time to available now", () => {
  const scheduledAt = new Date("2026-04-24T12:50:00+03:00");

  assert.equal(
    formatDoseStatusLabel(scheduledAt, "ru", new Date("2026-04-24T10:00:00+03:00")),
    `Дать в ${formatDoseClock(scheduledAt, "ru")}`
  );
  assert.equal(
    formatDoseStatusLabel(scheduledAt, "ru", new Date("2026-04-24T12:50:00+03:00")),
    "Можно дать"
  );
});
