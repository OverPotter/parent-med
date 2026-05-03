import test from "node:test";
import assert from "node:assert/strict";

import {
  buildVerifiedFamilyCode,
  normalizeFamilyCodeInput,
  resetVerifiedFamilyCode,
  resolveFamilyCodeSubmitError,
  resolveFamilyCodeVerifyError,
  shouldAutoVerifyFamilyCode,
} from "../src/client/pages/auth/familyCodeModel.js";

test("resolveFamilyCodeVerifyError requires a code before verification", () => {
  assert.equal(resolveFamilyCodeVerifyError("", "required"), "required");
  assert.equal(resolveFamilyCodeVerifyError("ABC12345", "required"), null);
});

test("normalizeFamilyCodeInput removes accidental whitespace from pasted codes", () => {
  assert.equal(normalizeFamilyCodeInput("  ABC1 2345 \n"), "ABC12345");
  assert.equal(
    normalizeFamilyCodeInput("  AbCd_1234-Token \t Value "),
    "AbCd_1234-TokenValue"
  );
});

test("shouldAutoVerifyFamilyCode accepts only full dev or production-looking tokens", () => {
  assert.equal(shouldAutoVerifyFamilyCode("ABC12345"), true);
  assert.equal(shouldAutoVerifyFamilyCode("abc123"), false);
  assert.equal(shouldAutoVerifyFamilyCode("abc12345678901234567890123456789"), true);
  assert.equal(shouldAutoVerifyFamilyCode("abc1234567890123456789"), false);
});

test("resolveFamilyCodeSubmitError blocks submit only when a code was entered but not verified", () => {
  assert.equal(resolveFamilyCodeSubmitError("", null, "verify first"), null);
  assert.equal(resolveFamilyCodeSubmitError("ABC12345", null, "verify first"), "verify first");
  assert.equal(
    resolveFamilyCodeSubmitError(
      "ABC12345",
      buildVerifiedFamilyCode("ABC12345", {
        familyName: "Семья Петровых",
        expiresAt: "2026-06-01T09:29:12.982125Z",
      }),
      "verify first"
    ),
    null
  );
});

test("buildVerifiedFamilyCode stores the verified invite preview for signup", () => {
  assert.deepEqual(
    buildVerifiedFamilyCode("ABC12345", {
      familyName: "Семья Петровых",
      expiresAt: "2026-06-01T09:29:12.982125Z",
    }),
    {
      token: "ABC12345",
      familyName: "Семья Петровых",
      expiresAt: "2026-06-01T09:29:12.982125Z",
    }
  );
});

test("resetVerifiedFamilyCode clears the verified family state", () => {
  assert.equal(resetVerifiedFamilyCode(), null);
});
