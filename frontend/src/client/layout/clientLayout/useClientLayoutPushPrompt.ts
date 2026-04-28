import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  fetchPushNotificationConfig,
  fetchPushNotificationPreferences,
  upsertPushSubscription,
} from "@shared/api/pushNotifications";
import { withTimeout } from "@shared/utils/pushNotifications";
import {
  getCachedNativePushSubscriptionPayload,
  getNativePushPermissionStatus,
  getNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  openNativeNotificationSettings,
  setNativePushOptOut,
} from "@shared/utils/nativePushNotifications";
import { useQuery } from "@tanstack/react-query";
import { hasCategoryPushIssue, resolvePushPromptState } from "./pushPromptState";

type PushCopy = {
  clientLayout: {
    pushErrors: {
      serverNotReady: string;
      subscribeTimeout: string;
      acceptTimeout: string;
      enabled: string;
      enableFailed: string;
      supportMissing: string;
      permissionTimeout: string;
      permissionDenied: string;
    };
    pushPrompt: {
      nativeBlockedTitle: string;
      title: string;
      nativeBlockedDescription: string;
      description: string;
      categoriesDisabledTitle: string;
      categoriesDisabledDescription: string;
      categoriesDisabledCta: string;
      openSettings: string;
      enabling: string;
      enable: string;
      hide: string;
    };
  };
};

type UseClientLayoutPushPromptArgs = {
  authToken: string | null;
  accountId: string | null;
  copy: PushCopy;
};

export function useClientLayoutPushPrompt({
  authToken,
  accountId,
  copy,
}: UseClientLayoutPushPromptArgs) {
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const [nativePushIssue, setNativePushIssue] = useState<"system" | "app" | null>(null);
  const [categoryPushIssue, setCategoryPushIssue] = useState(false);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);

  const isPushCheckReady = Boolean(authToken && accountId);

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: isPushCheckReady,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pushPreferences } = useQuery({
    queryKey: ["push", "preferences", "account", accountId],
    queryFn: fetchPushNotificationPreferences,
    enabled: isPushCheckReady,
    staleTime: 5 * 60 * 1000,
  });

  const isPushPromptReady = isPushCheckReady;

  useEffect(() => {
    setPushPromptError(null);
    setPushPromptSuccess(null);
  }, [accountId]);

  useEffect(() => {
    if (!isPushPromptReady) {
      setPushStatus("checking");
      setPushPromptSuccess(null);
      setNativePushIssue(null);
      return;
    }

    let isCancelled = false;
    let isChecking = false;
    let lastCheckAt = 0;
    const MIN_PUSH_CHECK_INTERVAL_MS = 2500;

    const checkPush = async (force = false) => {
      const nowTs = Date.now();
      if (!force && (isChecking || nowTs - lastCheckAt < MIN_PUSH_CHECK_INTERVAL_MS)) {
        return;
      }
      isChecking = true;
      lastCheckAt = nowTs;

      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            if (!isCancelled) {
              setPushStatus("disabled");
              setPushPromptSuccess(null);
              setNativePushIssue("app");
            }
            return;
          }
          const permission = await getNativePushPermissionStatus();
          if (permission === "denied") {
            if (!isCancelled) {
              setPushStatus("disabled");
              setPushPromptSuccess(null);
              setNativePushIssue("system");
            }
            return;
          }
          const payload = getCachedNativePushSubscriptionPayload();
          if (!isCancelled) {
            const nextStatus = payload ? "enabled" : "disabled";
            setPushStatus(nextStatus);
            setNativePushIssue(nextStatus === "disabled" ? "app" : null);
            if (nextStatus === "disabled") {
              setPushPromptSuccess(null);
            }
          }
          return;
        }

        if (!isCancelled) {
          setPushStatus("disabled");
          setPushPromptSuccess(null);
          setNativePushIssue(null);
        }
      } catch {
        if (!isCancelled) {
          setPushStatus("disabled");
          setPushPromptSuccess(null);
          setNativePushIssue(null);
        }
      } finally {
        isChecking = false;
      }
    };

    void checkPush();

    const handlePushSubscriptionChanged = () => {
      void checkPush(true);
    };

    const handleAppActive = () => {
      void checkPush(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkPush(true);
      }
    };

    let removeAppStateListener: (() => void) | undefined;
    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          handleAppActive();
        }
      }).then((listener) => {
        removeAppStateListener = () => {
          void listener.remove();
        };
      });
    }

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeAppStateListener?.();
    };
  }, [isPushPromptReady]);

  useEffect(() => {
    if (
      !isPushPromptReady ||
      pushStatus !== "enabled" ||
      nativePushIssue !== null ||
      !pushPreferences
    ) {
      setCategoryPushIssue(false);
      return;
    }

    setCategoryPushIssue(hasCategoryPushIssue(pushPreferences));
  }, [isPushPromptReady, nativePushIssue, pushPreferences, pushStatus]);

  const shouldShowPushPrompt =
    Boolean(pushConfig?.enabled) &&
    isPushPromptReady &&
    isNativePushSupported() &&
    nativePushIssue === null &&
    pushStatus === "disabled";
  const { shouldShowNotificationPrompt, isNotificationBellActive, notificationBellVariant } =
    resolvePushPromptState({
      isPushPromptReady,
      pushStatus,
      nativePushIssue,
      shouldShowDisabledPushPrompt: shouldShowPushPrompt,
      hasCategoryPushIssue: categoryPushIssue,
    });

  const handleEnablePush = async () => {
    if (isNativePushSupported()) {
      if (!pushConfig?.enabled) {
        setPushPromptError(copy.clientLayout.pushErrors.serverNotReady);
        return;
      }

      setPushPromptError(null);
      setPushPromptSuccess(null);
      setIsPushPending(true);

      try {
        setNativePushOptOut(false);
        const permission = await getNativePushPermissionStatus();
        if (permission === "denied") {
          setNativePushIssue("system");
          return;
        }

        const payload = await withTimeout(
          getNativePushSubscriptionPayload({ promptIfNeeded: true }),
          10000,
          copy.clientLayout.pushErrors.subscribeTimeout
        );
        if (!payload) {
          setNativePushIssue("app");
          return;
        }

        await withTimeout(
          upsertPushSubscription(payload),
          8000,
          copy.clientLayout.pushErrors.acceptTimeout
        );
        setPushStatus("enabled");
        setNativePushIssue(null);
        setPushPromptSuccess(copy.clientLayout.pushErrors.enabled);
        window.dispatchEvent(new Event("push:subscription-changed"));
      } catch (error) {
        setPushPromptError(
          error instanceof Error ? error.message : copy.clientLayout.pushErrors.enableFailed
        );
      } finally {
        setIsPushPending(false);
      }
      return;
    }
  };

  const handleHidePushPrompt = () => {
    setIsPushDialogOpen(false);
  };

  useEffect(() => {
    if (!shouldShowNotificationPrompt) {
      setIsPushDialogOpen(false);
    }
  }, [shouldShowNotificationPrompt]);

  useEffect(() => {
    if (pushStatus === "enabled" && !nativePushIssue && !categoryPushIssue) {
      setIsPushDialogOpen(false);
    }
  }, [categoryPushIssue, nativePushIssue, pushStatus]);

  return {
    pushPromptError,
    pushPromptSuccess,
    isPushPending,
    isPushDialogOpen,
    nativePushIssue,
    categoryPushIssue,
    shouldShowNotificationPrompt,
    isNotificationBellActive,
    notificationBellVariant,
    setIsPushDialogOpen,
    handleHidePushPrompt,
    handleEnablePush,
    openNativeNotificationSettings,
    copy,
  };
}
