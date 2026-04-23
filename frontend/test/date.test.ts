import test from "node:test";
import assert from "node:assert/strict";
import {
  getCurrentDeviceTimestampIso,
  isFutureDeviceDate,
  toDeviceDateTimeIso,
} from "../src/shared/utils/date.js";

test("getCurrentDeviceTimestampIso serializes the provided device date", () => {
  const date = new Date(2026, 3, 23, 13, 45, 30, 123);
  const iso = getCurrentDeviceTimestampIso(date);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffsetMinutes / 60)).padStart(2, "0");
  const offsetRemainderMinutes = String(absoluteOffsetMinutes % 60).padStart(2, "0");

  assert.equal(
    iso,
    `${date.getFullYear()}-04-23T13:45:30.123${sign}${offsetHours}:${offsetRemainderMinutes}`
  );
  assert.equal(new Date(iso).getTime(), date.getTime());
});

test("toDeviceDateTimeIso converts local device date/time inputs into an instant", () => {
  const iso = toDeviceDateTimeIso("2026-04-23", "13:45");
  assert.ok(iso);

  const expected = new Date(2026, 3, 23, 13, 45, 0, 0).toISOString();
  assert.equal(iso, expected);
});

test("toDeviceDateTimeIso returns null for incomplete values", () => {
  assert.equal(toDeviceDateTimeIso("", "13:45"), null);
  assert.equal(toDeviceDateTimeIso("2026-04-23", ""), null);
  assert.equal(toDeviceDateTimeIso("bad", "13:45"), null);
});

test("isFutureDeviceDate compares against the device local day", () => {
  const now = new Date(2026, 3, 23, 20, 15, 0, 0);

  assert.equal(isFutureDeviceDate("2026-04-24", now), true);
  assert.equal(isFutureDeviceDate("2026-04-23", now), false);
  assert.equal(isFutureDeviceDate("2026-04-22", now), false);
  assert.equal(isFutureDeviceDate("bad", now), false);
});
