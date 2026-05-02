import test from "node:test";
import assert from "node:assert/strict";

import {
  buildVerifiedFamilyCode,
  resetVerifiedFamilyCode,
  resolveFamilyCodeSubmitError,
  resolveFamilyCodeVerifyError,
} from "../src/client/pages/auth/familyCodeModel.js";

test("resolveFamilyCodeVerifyError requires a code before verification", () => {
  assert.equal(resolveFamilyCodeVerifyError("", "required"), "required");
  assert.equal(resolveFamilyCodeVerifyError("ABC12345", "required"), null);
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
