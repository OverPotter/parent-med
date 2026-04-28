export type PushPromptStatus = "checking" | "enabled" | "disabled";

export type NativePushIssue = "system" | "app" | null;

export type PushPromptCategoryPreferences = {
  childrenEnabled: boolean;
  pillboxEnabled: boolean;
  cabinetNotify10Days: boolean;
  cabinetNotify7Days: boolean;
  cabinetNotify3Days: boolean;
};

export function hasCategoryPushIssue(
  preferences: PushPromptCategoryPreferences | null | undefined
): boolean {
  if (!preferences) {
    return false;
  }

  const hasChildrenDisabled = !preferences.childrenEnabled;
  const hasPillboxDisabled = !preferences.pillboxEnabled;
  const hasCabinetDisabled =
    !preferences.cabinetNotify10Days &&
    !preferences.cabinetNotify7Days &&
    !preferences.cabinetNotify3Days;

  return hasChildrenDisabled || hasPillboxDisabled || hasCabinetDisabled;
}

export function resolvePushPromptState(input: {
  isPushPromptReady: boolean;
  pushStatus: PushPromptStatus;
  nativePushIssue: NativePushIssue;
  shouldShowDisabledPushPrompt: boolean;
  hasCategoryPushIssue: boolean;
}): {
  shouldShowCategoryPrompt: boolean;
  shouldShowNotificationPrompt: boolean;
  isNotificationBellActive: boolean;
  notificationBellVariant: "danger" | "warning";
} {
  const shouldShowNativePushPrompt = input.isPushPromptReady && input.nativePushIssue !== null;
  const shouldShowCategoryPrompt =
    input.isPushPromptReady &&
    input.pushStatus === "enabled" &&
    input.nativePushIssue === null &&
    input.hasCategoryPushIssue;
  const shouldShowNotificationPrompt =
    shouldShowNativePushPrompt || input.shouldShowDisabledPushPrompt || shouldShowCategoryPrompt;

  return {
    shouldShowCategoryPrompt,
    shouldShowNotificationPrompt,
    isNotificationBellActive: shouldShowNotificationPrompt,
    notificationBellVariant:
      shouldShowNativePushPrompt || input.shouldShowDisabledPushPrompt ? "danger" : "warning",
  };
}
