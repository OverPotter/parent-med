import test from "node:test";
import assert from "node:assert/strict";

import {
  canSubmitRecoveryCode,
  canSubmitRecoveryPassword,
} from "../src/client/pages/authRecovery.js";
import { normalizeRecoveryCode } from "../src/shared/utils/recoveryCode.js";

test("canSubmitRecoveryCode requires email and sufficiently long code", () => {
  assert.equal(canSubmitRecoveryCode("email@example.com", "quiet-river-42"), true);
  assert.equal(canSubmitRecoveryCode("", "quiet-river-42"), false);
  assert.equal(canSubmitRecoveryCode("email@example.com", "1234567"), false);
  assert.equal(canSubmitRecoveryCode("email@example.com", "  тихая   река   42  "), true);
});

test("canSubmitRecoveryPassword requires matching password pair", () => {
  assert.equal(canSubmitRecoveryPassword("secret12", "secret12"), true);
  assert.equal(canSubmitRecoveryPassword("short", "short"), false);
  assert.equal(canSubmitRecoveryPassword("secret12", "secret34"), false);
});

test("normalizeRecoveryCode trims edges and collapses inner spaces", () => {
  assert.equal(normalizeRecoveryCode("  тихая   река   42  "), "тихая река 42");
});
