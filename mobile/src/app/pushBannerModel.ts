import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import type { MobilePushPreferences } from "../features/settings/api/settingsApi";
import type { PushSubscriptionSyncState } from "./usePushSubscriptionSync";

type PushBannerCopy = {
  title: string;
  body: string;
  actionLabel: string;
};

type PushBannerState = {
  visible: boolean;
  title: string;
  body: string;
  actionLabel: string;
  openTarget: "system" | "app";
};

function isRootModulePushEnabled(
  activeRootTab: MobileBottomTabKey,
  pushPreferences: MobilePushPreferences,
) {
  if (activeRootTab === "children") {
    return pushPreferences.childrenEnabled;
  }

  if (activeRootTab === "pillbox") {
    return pushPreferences.pillboxEnabled;
  }

  if (activeRootTab === "cabinet") {
    return (
      pushPreferences.cabinetNotify10Days ||
      pushPreferences.cabinetNotify7Days ||
      pushPreferences.cabinetNotify3Days
    );
  }

  return true;
}

function buildInAppDisabledCopy(locale: string): PushBannerCopy {
  if (locale === "ru") {
    return {
      title: "Уведомления выключены",
      body: "Включите их в настройках приложения.",
      actionLabel: "Включить",
    };
  }

  return {
    title: "Notifications are off",
    body: "Enable them in app settings.",
    actionLabel: "Enable",
  };
}

function isModuleBannerSupported(activeRootTab: MobileBottomTabKey) {
  return (
    activeRootTab === "children" ||
    activeRootTab === "pillbox" ||
    activeRootTab === "cabinet"
  );
}

export function buildPushBannerState(args: {
  activeRootTab: MobileBottomTabKey;
  locale: string;
  pushPreferences: MobilePushPreferences;
  pushSubscriptionState: PushSubscriptionSyncState;
  settingsContent: {
    notificationsPermissionPromptTitle: string;
    notificationsPermissionPromptBody: string;
  };
}): PushBannerState {
  const {
    activeRootTab,
    locale,
    pushPreferences,
    pushSubscriptionState,
    settingsContent,
  } = args;

  if (
    pushSubscriptionState.pushConfigEnabled &&
    pushSubscriptionState.permissionStatus === "denied"
  ) {
    return {
      visible: true,
      title: settingsContent.notificationsPermissionPromptTitle,
      body: settingsContent.notificationsPermissionPromptBody,
      actionLabel: locale === "ru" ? "Настройки" : "Settings",
      openTarget: "system",
    };
  }

  if (
    pushSubscriptionState.pushConfigEnabled &&
    pushSubscriptionState.permissionStatus === "granted" &&
    isModuleBannerSupported(activeRootTab) &&
    !isRootModulePushEnabled(activeRootTab, pushPreferences)
  ) {
    const copy = buildInAppDisabledCopy(locale);
    return {
      visible: true,
      title: copy.title,
      body: copy.body,
      actionLabel: copy.actionLabel,
      openTarget: "app",
    };
  }

  return {
    visible: false,
    title: "",
    body: "",
    actionLabel: "",
    openTarget: "app",
  };
}
