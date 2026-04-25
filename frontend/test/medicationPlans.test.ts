import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanAdministrationStats,
  calculateMedicationDoseRecommendation,
  formatDoseClock,
  formatDoseStatusLabel,
  getMedicationDosePerKgReference,
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

test("dose calculator converts mg per kg into ml when concentration is explicit", () => {
  const result = calculateMedicationDoseRecommendation(
    {
      medicineForm: "суспензия",
      medicineConcentration: "100 мг / 5 мл",
    },
    18.4,
    10,
    "ru"
  );

  assert.ok(result);
  assert.equal(result.calculatedDoseMg, 184);
  assert.equal(result.calculatedDoseValue, 9.2);
  assert.equal(result.calculatedDoseUnit, "ml");
  assert.equal(result.doseCalcMode, "mg_ml");
  assert.equal(result.suggestedDoseText, "9.2 мл");
});

test("dose calculator can infer tablet strength from form when concentration is per tablet-like unit", () => {
  const result = calculateMedicationDoseRecommendation(
    {
      medicineForm: "таблетки",
      medicineConcentration: "250 мг",
    },
    25,
    10,
    "ru"
  );

  assert.ok(result);
  assert.equal(result.calculatedDoseMg, 250);
  assert.equal(result.calculatedDoseValue, 1);
  assert.equal(result.calculatedDoseUnit, "tablet");
  assert.equal(result.doseCalcMode, "tablet");
  assert.match(result.doseCalcWarning ?? "", /форме препарата/i);
});

test("dose calculator falls back to mg only when safe unit conversion is unavailable", () => {
  const result = calculateMedicationDoseRecommendation(
    {
      medicineForm: "капли глазные",
      medicineConcentration: "0.05%",
    },
    12,
    15,
    "ru"
  );

  assert.ok(result);
  assert.equal(result.calculatedDoseMg, 180);
  assert.equal(result.calculatedDoseValue, null);
  assert.equal(result.calculatedDoseUnit, "mg");
  assert.equal(result.doseCalcMode, "mg_only");
  assert.match(result.doseCalcWarning ?? "", /не удалось подтвердить/i);
});

test("dose calculator rejects zero and negative values", () => {
  assert.equal(
    calculateMedicationDoseRecommendation(
      {
        medicineForm: "суспензия",
        medicineConcentration: "100 мг / 5 мл",
      },
      0,
      10,
      "ru"
    ),
    null
  );
  assert.equal(
    calculateMedicationDoseRecommendation(
      {
        medicineForm: "суспензия",
        medicineConcentration: "100 мг / 5 мл",
      },
      14.2,
      0,
      "ru"
    ),
    null
  );
  assert.equal(
    calculateMedicationDoseRecommendation(
      {
        medicineForm: "суспензия",
        medicineConcentration: "100 мг / 5 мл",
      },
      -14.2,
      10,
      "ru"
    ),
    null
  );
});

test("dose-per-kg reference prefers explicit catalog guidance when present", () => {
  const result = getMedicationDosePerKgReference(
    {
      medicineName: "Парацетамол детский",
      medicineDosage: "Обычно 15 мг/кг на приём по инструкции.",
    },
    "ru"
  );

  assert.ok(result);
  assert.equal(result.value, 15);
  assert.equal(result.sourceKind, "catalog");
  assert.match(result.sourceLabel, /15 мг\/кг/i);
});

test("dose-per-kg reference prefers structured snapshot data from the cabinet medicine", () => {
  const result = getMedicationDosePerKgReference(
    {
      medicineName: "Парацетамол детский",
      medicineDosage: "Старая текстовая подсказка",
      pediatricDoseMgPerKgMin: 10,
      pediatricDoseMgPerKgMax: 15,
      pediatricDoseNote: "по инструкции каждые 4-6 часов",
    },
    "ru"
  );

  assert.ok(result);
  assert.equal(result.value, 10);
  assert.equal(result.sourceKind, "catalog");
  assert.match(result.sourceLabel, /10-15 мг\/кг/i);
  assert.match(result.sourceLabel, /4-6 часов/i);
});

test("dose-per-kg reference uses the lower bound from an explicit range in guidance", () => {
  const result = getMedicationDosePerKgReference(
    {
      medicineName: "Парацетамол",
      medicineDosage: "Обычно 10-15 мг/кг на приём.",
    },
    "ru"
  );

  assert.ok(result);
  assert.equal(result.value, 10);
  assert.equal(result.sourceKind, "catalog");
  assert.match(result.sourceLabel, /10-15 мг\/кг/i);
});

test("dose-per-kg reference falls back to common ibuprofen pediatric guidance", () => {
  const result = getMedicationDosePerKgReference(
    {
      medicineName: "Нурофен детский",
      medicineDosage: "По возрастной инструкции на упаковке.",
    },
    "ru"
  );

  assert.ok(result);
  assert.equal(result.value, 10);
  assert.equal(result.sourceKind, "inferred");
  assert.match(result.sourceLabel, /10 мг\/кг/i);
});
