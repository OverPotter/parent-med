import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIllnessLiveActivitySummary,
  buildIllnessMedicationLines,
  getIllnessDurationMeta,
} from "../src/shared/utils/illnessLiveActivitySummary.js";

function formatExpectedTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
  const lastEventAt = "2026-04-24T18:10:00+03:00";
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: null,
      lastAdministrationAt: null,
      medicineNames: [],
      lastEventAt,
    },
    null,
    "2026-04-23",
    "ru",
    new Date(2026, 3, 24, 20, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: formatExpectedTime(lastEventAt),
    primaryCaption: "Последняя запись",
    secondaryValue: "1 день",
    secondaryCaption: "Длится",
  });
});

test("illness live activity prioritizes temperature and next dose when both exist", () => {
  const eventAt = "2026-04-24T18:10:00+03:00";
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: 38.4,
      lastAdministrationAt: eventAt,
      medicineNames: ["Нурофен"],
      lastEventAt: eventAt,
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
    primaryCaption: `Была в ${formatExpectedTime(eventAt)}`,
    secondaryValue: null,
    secondaryCaption: null,
  });
});

test("illness live activity shows temperature time instead of latest event label", () => {
  const lastEventAt = "2026-04-24T21:25:00+03:00";
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: 37.8,
      lastAdministrationAt: null,
      medicineNames: [],
      lastEventAt,
    },
    null,
    "2026-04-23",
    "ru",
    new Date(2026, 3, 24, 22, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: "37.8°",
    primaryCaption: `Была в ${formatExpectedTime(lastEventAt)}`,
    secondaryValue: null,
    secondaryCaption: null,
  });
});

test("illness live activity uses latest medication when it is the strongest signal", () => {
  const lastAdministrationAt = "2026-04-24T20:40:00+03:00";
  const summary = buildIllnessLiveActivitySummary(
    {
      lastTemperatureCelsius: null,
      lastAdministrationAt,
      medicineNames: ["Нурофен"],
      lastEventAt: null,
    },
    null,
    "2026-04-22",
    "ru",
    new Date(2026, 3, 24, 21, 0)
  );

  assert.deepEqual(summary, {
    primaryValue: formatExpectedTime(lastAdministrationAt),
    primaryCaption: "Последнее лекарство · Нурофен",
    secondaryValue: "2 дня",
    secondaryCaption: "Длится",
  });
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
  const lastAdministrationAt = "2026-04-24T18:10:00+03:00";
  const lines = buildIllnessMedicationLines(
    {
      lastAdministrationAt,
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
    primaryLine: `Дать Нурофен в ${formatExpectedTime("2026-04-24T20:10:00+03:00")}`,
    secondaryLine: `Дали Парацетамол в ${formatExpectedTime(lastAdministrationAt)}`,
  });
});

test("illness medication lines switch to ready state when dose time is reached", () => {
  const lines = buildIllnessMedicationLines(
    {
      lastAdministrationAt: null,
      medicineNames: ["Нурофен"],
    },
    {
      nextDoseAt: new Date("2026-04-24T20:10:00+03:00"),
      medicineName: "Нурофен",
    },
    null,
    "ru",
    new Date("2026-04-24T20:10:00+03:00")
  );

  assert.deepEqual(lines, {
    primaryLine: "Можно дать Нурофен",
    secondaryLine: null,
  });
});
