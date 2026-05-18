import * as SecureStore from "expo-secure-store";

function getDisplayNameOnboardingSkipKey(accountId: string) {
  return `__pm_mobile_display_name_onboarding_skipped__:${accountId}`;
}

function getRecoveryCodeOnboardingSkipKey(accountId: string) {
  return `__pm_mobile_recovery_code_onboarding_skipped__:${accountId}`;
}

function getPostAuthPaywallShownKey(accountId: string) {
  return `__pm_mobile_post_auth_paywall_shown__:${accountId}`;
}

export async function readPostAuthOnboardingSkips(accountId: string) {
  try {
    const [displayName, recoveryCode] = await Promise.all([
      SecureStore.getItemAsync(getDisplayNameOnboardingSkipKey(accountId)),
      SecureStore.getItemAsync(getRecoveryCodeOnboardingSkipKey(accountId)),
    ]);

    return {
      skippedDisplayName: displayName === "1",
      skippedRecoveryCode: recoveryCode === "1",
    };
  } catch {
    return {
      skippedDisplayName: false,
      skippedRecoveryCode: false,
    };
  }
}

export async function markDisplayNameOnboardingSkipped(accountId: string) {
  await SecureStore.setItemAsync(
    getDisplayNameOnboardingSkipKey(accountId),
    "1",
  );
}

export async function markRecoveryCodeOnboardingSkipped(accountId: string) {
  await SecureStore.setItemAsync(
    getRecoveryCodeOnboardingSkipKey(accountId),
    "1",
  );
}

export async function clearPostAuthOnboardingSkips(accountId: string) {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(getDisplayNameOnboardingSkipKey(accountId)),
    SecureStore.deleteItemAsync(getRecoveryCodeOnboardingSkipKey(accountId)),
  ]);
}

export async function readPostAuthPaywallShown(accountId: string) {
  try {
    return (await SecureStore.getItemAsync(getPostAuthPaywallShownKey(accountId))) === "1";
  } catch {
    return false;
  }
}

export async function markPostAuthPaywallShown(accountId: string) {
  await SecureStore.setItemAsync(getPostAuthPaywallShownKey(accountId), "1");
}
