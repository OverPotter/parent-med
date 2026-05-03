export function getDisplayNameOnboardingSkipKey(accountId: string) {
  return `__pm_display_name_onboarding_skipped__:${accountId}`;
}

export function getRecoveryCodeOnboardingSkipKey(accountId: string) {
  return `__pm_recovery_code_onboarding_skipped__:${accountId}`;
}

export function getPostRegistrationOfferSeenKey(accountId: string) {
  return `__pm_post_registration_offer_seen__:${accountId}`;
}
