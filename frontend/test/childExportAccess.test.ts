import assert from "node:assert/strict";
import test from "node:test";
import { resolveChildExportGateState } from "../src/client/pages/children/childExportAccess.js";

test("child export gate stays loading until family access is resolved", () => {
  const state = resolveChildExportGateState({
    familyAccess: undefined,
    isLoading: true,
  });

  assert.equal(state, "loading");
});

test("child export gate allows export only with plus access", () => {
  assert.equal(
    resolveChildExportGateState({
      familyAccess: { canExportCsv: true } as never,
      isLoading: false,
    }),
    "allowed"
  );

  assert.equal(
    resolveChildExportGateState({
      familyAccess: { canExportCsv: false } as never,
      isLoading: false,
    }),
    "locked"
  );
});
