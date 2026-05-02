import test from "node:test";
import assert from "node:assert/strict";

import { getLocalizedAuthError } from "../src/shared/utils/authErrors.js";

test("getLocalizedAuthError localizes family code errors for english users", () => {
  assert.equal(
    getLocalizedAuthError("FAMILY_INVITE_EXPIRED", "Срок действия приглашения истёк", "en", "fallback"),
    "Family code expired."
  );
  assert.equal(
    getLocalizedAuthError("FAMILY_INVITE_ALREADY_USED", "Приглашение уже использовано", "en", "fallback"),
    "Family code was already used."
  );
  assert.equal(
    getLocalizedAuthError("FAMILY_INVITE_NOT_FOUND", "Приглашение не найдено", "en", "fallback"),
    "Family code not found."
  );
});
