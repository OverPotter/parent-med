import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  getCurrentDeviceTimestampIso,
  isFutureDeviceDate,
  toDeviceDateTimeIso,
} from "../src/shared/utils/date.js";
import { isFutureFirstAdministrationSelection } from "../src/client/pages/child-illness/reminderTiming.js";

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

test("formatLocalizedDate hides the time part for invite-style dates", () => {
  assert.equal(formatLocalizedDate("2026-06-01T09:29:12.982125Z", "ru"), "01.06.2026");
  assert.equal(formatLocalizedDate("2026-06-01T09:29:12.982125Z", "en"), "06/01/2026");
});

test("formatLocalizedDateTime keeps the time part for invite expiry", () => {
  const localDate = new Date("2026-06-01T09:29:12.982125Z");
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  assert.equal(formatLocalizedDateTime("2026-06-01T09:29:12.982125Z", "ru"), `01.06.2026, ${hours}:${minutes}`);
  assert.equal(formatLocalizedDateTime("2026-06-01T09:29:12.982125Z", "en"), `06/01/2026, ${hours}:${minutes}`);
});

test("isFutureFirstAdministrationSelection rejects future time on the same day", () => {
  const now = new Date(2026, 3, 24, 10, 0, 0, 0);

  assert.equal(isFutureFirstAdministrationSelection("2026-04-24", "09:30", now), false);
  assert.equal(isFutureFirstAdministrationSelection("2026-04-24", "23:50", now), true);
});
