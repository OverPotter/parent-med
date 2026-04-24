import test from "node:test";
import assert from "node:assert/strict";

import {
  canSubmitRecoveryIdentity,
  canSubmitRecoveryPassword,
} from "../src/client/pages/authRecovery";

test("canSubmitRecoveryIdentity requires all recovery fields", () => {
  assert.equal(canSubmitRecoveryIdentity("login", "email@example.com", "Anna"), true);
  assert.equal(canSubmitRecoveryIdentity("", "email@example.com", "Anna"), false);
  assert.equal(canSubmitRecoveryIdentity("login", " ", "Anna"), false);
  assert.equal(canSubmitRecoveryIdentity("login", "email@example.com", " "), false);
});

test("canSubmitRecoveryPassword requires matching password pair", () => {
  assert.equal(canSubmitRecoveryPassword("secret12", "secret12"), true);
  assert.equal(canSubmitRecoveryPassword("short", "short"), false);
  assert.equal(canSubmitRecoveryPassword("secret12", "secret34"), false);
});
