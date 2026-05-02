import test from "node:test";
import assert from "node:assert/strict";
import { formatIllnessActiveLabel, formatIllnessDuration } from "../src/client/pages/children/shared.js";

test("formatIllnessActiveLabel does not show raw hours for date-only illness start on same day", () => {
  const now = new Date(2026, 3, 23, 20, 15, 0, 0).getTime();

  assert.equal(formatIllnessActiveLabel("2026-04-23", now, "ru"), "Наблюдение");
  assert.equal(formatIllnessDuration("2026-04-23", now, "ru"), "1 день");
});

test("formatIllnessActiveLabel uses day-based duration for date-only illness start across days", () => {
  const now = new Date(2026, 3, 25, 9, 0, 0, 0).getTime();

  assert.equal(formatIllnessActiveLabel("2026-04-23", now, "ru"), "Наблюдение · 3 дня");
  assert.equal(formatIllnessDuration("2026-04-23", now, "en"), "3 days");
});

test("formatIllnessActiveLabel does not show minute timer for timestamp illness start on same day", () => {
  const now = Date.parse("2026-04-23T11:43:00.000Z");

  assert.equal(
    formatIllnessActiveLabel("2026-04-23T11:42:00.000Z", now, "ru"),
    "Наблюдение"
  );
});
