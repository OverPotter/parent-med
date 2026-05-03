import test from "node:test";
import assert from "node:assert/strict";

import {
  getDisplayNameOnboardingSkipKey,
  getPostRegistrationOfferSeenKey,
  getRecoveryCodeOnboardingSkipKey,
} from "../src/client/components/displayNameOnboardingKeys.js";
import {
  shouldShowDisplayNameOnboarding,
  shouldShowRecoveryCodeOnboarding,
} from "../src/client/components/profileOnboarding.js";

test("display name onboarding skip key is account-specific", () => {
  assert.equal(
    getDisplayNameOnboardingSkipKey("account-1"),
    "__pm_display_name_onboarding_skipped__:account-1"
  );
  assert.notEqual(
    getDisplayNameOnboardingSkipKey("account-1"),
    getDisplayNameOnboardingSkipKey("account-2")
  );
});

test("recovery code onboarding skip key is account-specific", () => {
  assert.equal(
    getRecoveryCodeOnboardingSkipKey("account-1"),
    "__pm_recovery_code_onboarding_skipped__:account-1"
  );
  assert.notEqual(
    getRecoveryCodeOnboardingSkipKey("account-1"),
    getRecoveryCodeOnboardingSkipKey("account-2")
  );
});

test("post-registration offer key is account-specific", () => {
  assert.equal(
    getPostRegistrationOfferSeenKey("account-1"),
    "__pm_post_registration_offer_seen__:account-1"
  );
  assert.notEqual(
    getPostRegistrationOfferSeenKey("account-1"),
    getPostRegistrationOfferSeenKey("account-2")
  );
});

test("display name onboarding only appears when profile is incomplete", () => {
  assert.equal(
    shouldShowDisplayNameOnboarding({
      accountId: "account-1",
      needsProfileCompletion: true,
      didSkipDisplayName: false,
    }),
    true
  );
  assert.equal(
    shouldShowDisplayNameOnboarding({
      accountId: "account-1",
      needsProfileCompletion: false,
      didSkipDisplayName: false,
    }),
    false
  );
});

test("recovery code onboarding is hidden when recovery code already exists", () => {
  assert.equal(
    shouldShowRecoveryCodeOnboarding({
      accountId: "account-1",
      hasRecoveryCode: false,
      didSkipRecoveryCode: false,
    }),
    true
  );
  assert.equal(
    shouldShowRecoveryCodeOnboarding({
      accountId: "account-1",
      hasRecoveryCode: true,
      didSkipRecoveryCode: false,
    }),
    false
  );
});
