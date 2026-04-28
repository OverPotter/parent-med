import assert from "node:assert/strict";
import test from "node:test";
import {
  allExportsOption,
  clampExportSheetOffset,
  defaultExportPeriod,
  defaultExportSelection,
  resolvePrimaryExportAction,
  shouldDismissExportSheetSwipe,
  shouldTrackExportSheetSwipe,
} from "../src/client/pages/children/childExportDialogModel.js";

test("child export dialog defaults reset to summary and two-week period", () => {
  assert.equal(defaultExportSelection, "analytics_summary");
  assert.equal(defaultExportPeriod, "two_weeks");
});

test("primary export action switches to archive only for all files option", () => {
  assert.equal(resolvePrimaryExportAction("analytics_summary"), "single");
  assert.equal(resolvePrimaryExportAction(allExportsOption), "archive");
});

test("sheet swipe tracking ignores horizontal and upward gestures", () => {
  assert.equal(shouldTrackExportSheetSwipe(20, 80), true);
  assert.equal(shouldTrackExportSheetSwipe(90, 70), false);
  assert.equal(shouldTrackExportSheetSwipe(10, -10), false);
});

test("sheet dismiss swipe requires a strong downward drag", () => {
  assert.equal(shouldDismissExportSheetSwipe(20, 120), true);
  assert.equal(shouldDismissExportSheetSwipe(60, 80), false);
  assert.equal(shouldDismissExportSheetSwipe(120, 110), false);
});

test("sheet offset is clamped to a safe visual range", () => {
  assert.equal(clampExportSheetOffset(-10), 0);
  assert.equal(clampExportSheetOffset(80), 80);
  assert.equal(clampExportSheetOffset(400), 260);
});
