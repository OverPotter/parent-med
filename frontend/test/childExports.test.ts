import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChildExportArchiveFilename,
  buildChildExportFilename,
  extractFilenameFromContentDisposition,
  isNativeIosExportRuntime,
  resolveChildExportApiPeriod,
} from "../src/shared/api/childExports.js";

test("buildChildExportFilename normalizes spacing", () => {
  assert.equal(buildChildExportFilename(" Mia Rose ", "child_care"), "Mia_Rose_child_care.csv");
  assert.equal(
    buildChildExportFilename(" Mia Rose ", "child_care", "xlsx"),
    "Mia_Rose_child_care.xlsx"
  );
});

test("buildChildExportArchiveFilename normalizes spacing", () => {
  assert.equal(buildChildExportArchiveFilename(" Mia Rose "), "Mia_Rose_exports.zip");
  assert.equal(buildChildExportArchiveFilename(" Mia Rose ", "xlsx"), "Mia_Rose_exports.xlsx");
});

test("extractFilenameFromContentDisposition prefers utf filename", () => {
  const header =
    "attachment; filename=\"fallback.csv\"; filename*=UTF-8''%D0%9C%D0%B8%D1%8F_child_care.csv";

  assert.equal(extractFilenameFromContentDisposition(header), "Мия_child_care.csv");
});

test("extractFilenameFromContentDisposition falls back to plain filename", () => {
  assert.equal(
    extractFilenameFromContentDisposition("attachment; filename=\"summary.csv\""),
    "summary.csv"
  );
});

test("isNativeIosExportRuntime only enables native export for ios shell", () => {
  assert.equal(isNativeIosExportRuntime({ isNativePlatform: true, platform: "ios" }), true);
  assert.equal(isNativeIosExportRuntime({ isNativePlatform: true, platform: "android" }), false);
  assert.equal(isNativeIosExportRuntime({ isNativePlatform: false, platform: "ios" }), false);
});

test("resolveChildExportApiPeriod keeps all-time exports unchanged", () => {
  assert.deepEqual(resolveChildExportApiPeriod("all", new Date("2026-04-28T12:00:00Z")), {
    period: "all",
  });
});

test("resolveChildExportApiPeriod maps preset periods to custom date ranges", () => {
  assert.deepEqual(resolveChildExportApiPeriod("two_weeks", new Date("2026-04-28T12:00:00Z")), {
    period: "custom",
    startDate: "2026-04-15",
    endDate: "2026-04-28",
  });
  assert.deepEqual(resolveChildExportApiPeriod("month", new Date("2026-04-28T12:00:00Z")), {
    period: "custom",
    startDate: "2026-03-30",
    endDate: "2026-04-28",
  });
  assert.deepEqual(resolveChildExportApiPeriod("half_year", new Date("2026-04-28T12:00:00Z")), {
    period: "custom",
    startDate: "2025-10-28",
    endDate: "2026-04-28",
  });
});
