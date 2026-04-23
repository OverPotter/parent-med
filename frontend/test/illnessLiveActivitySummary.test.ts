import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIllnessLiveActivitySummary,
  buildIllnessMedicationLines,
  buildIllnessStatusLabel,
  getIllnessDurationMeta,
} from "../src/shared/utils/illnessLiveActivitySummary.js";

test("illness live activity keeps a simple empty card when no data exists", () => {
  const summary = buildIllnessLiveActivitySummary(null, null, "2026-04-24", "ru", new Date(2026, 3, 24, 12, 0));

  assert.deepEqual(summary, {
    primaryValue: "Сегодня",
    primaryCaption: "Началось",
    secondaryValue: null,
    secondaryCaption: null,
  });
});

test("illness live activity prioritizes last event over empty temperature state", () => {
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: null,
      lastAdministrationAt: null,
      medicineNames: [],
      lastEventAt: "2026-04-24T18:10:00+03:00",
    },
    null,
    "2026-04-23",
    "ru",
    new Date(2026, 3, 24, 20, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: "18:10",
    primaryCaption: "Последняя запись",
    secondaryValue: "1 день",
    secondaryCaption: "Длится",
  });
});

test("illness live activity prioritizes temperature and next dose when both exist", () => {
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: 38.4,
      lastAdministrationAt: "2026-04-24T18:10:00+03:00",
      medicineNames: ["Нурофен"],
      lastEventAt: "2026-04-24T18:10:00+03:00",
    },
    {
      nextDoseAt: new Date("2026-04-24T20:10:00+03:00"),
      medicineName: "Нурофен",
    },
    "2026-04-24",
    "ru",
    new Date("2026-04-24T18:10:00+03:00")
  );

  assert.deepEqual(summary, {
    primaryValue: "38.4°",
    primaryCaption: "Была в 18:10",
    secondaryValue: "через 2 ч",
    secondaryCaption: "Нурофен",
  });
});

test("illness live activity shows temperature time instead of latest event label", () => {
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: 37.8,
      lastAdministrationAt: null,
      medicineNames: [],
      lastEventAt: "2026-04-24T21:25:00+03:00",
    },
    null,
    "2026-04-23",
    "ru",
    new Date(2026, 3, 24, 22, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: "37.8°",
    primaryCaption: "Была в 21:25",
    secondaryValue: "1 день",
    secondaryCaption: "Длится",
  });
});

test("illness live activity uses latest medication when it is the strongest signal", () => {
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: null,
      lastAdministrationAt: "2026-04-24T20:40:00+03:00",
      medicineNames: ["Нурофен"],
      lastEventAt: null,
    },
    null,
    "2026-04-22",
    "ru",
    new Date(2026, 3, 24, 21, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: "20:40",
    primaryCaption: "Последнее лекарство · Нурофен",
    secondaryValue: "2 дня",
    secondaryCaption: "Длится",
  });
});

test("illness status label prefers actionable context over episode title", () => {
  const label = buildIllnessStatusLabel(
    "Простуда",
    {
      lastAdministrationAt: "2026-04-24T18:10:00+03:00",
      medicineNames: ["Нурофен"],
      lastEventAt: "2026-04-24T21:10:00+03:00",
    },
    "ru"
  );

  assert.equal(label, "Нурофен · запись 21:10");
});

test("illness duration meta keeps same-day episodes on a simple started state", () => {
  assert.deepEqual(
    getIllnessDurationMeta("2026-04-24", "ru", new Date(2026, 3, 24, 10, 0)),
    {
      value: "Сегодня",
      caption: "Началось",
    }
  );
});

test("illness medication lines show next dose and last administration under child name", () => {
  const lines = buildIllnessMedicationLines(
    {
      lastAdministrationAt: "2026-04-24T18:10:00+03:00",
      medicineNames: ["Нурофен"],
    },
    {
      nextDoseAt: new Date("2026-04-24T20:10:00+03:00"),
      medicineName: "Нурофен",
    },
    "Парацетамол",
    "ru",
    new Date("2026-04-24T18:10:00+03:00")
  );

  assert.deepEqual(lines, {
    primaryLine: "Нурофен · через 2 ч",
    secondaryLine: "Парацетамол дали в 18:10",
  });
});
