import { useEffect, useState } from "react";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import {
  getExistingPushSubscription,
  getPushSupportIssue,
  isPushSupported,
  subscribeToPushNotifications,
  toPushSubscriptionPayload,
  withTimeout,
} from "@shared/utils/pushNotifications";
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
  isDeferredShellWorkReady: boolean;
  isIosPushUiReady: boolean;
  isInteractiveDataReady: boolean;
  copy: PushCopy;
};

export function useClientLayoutPushPrompt({
  authToken,
  accountId,
  isDeferredShellWorkReady,
  isIosPushUiReady,
  isInteractiveDataReady,
  copy,
}: UseClientLayoutPushPromptArgs) {
  const [pushStatus, setPushStatus] = useState<"checking" | "enabled" | "disabled">("checking");
  const [isPushPending, setIsPushPending] = useState(false);
  const [pushPromptError, setPushPromptError] = useState<string | null>(null);
  const [pushPromptSuccess, setPushPromptSuccess] = useState<string | null>(null);
  const [nativePushIssue, setNativePushIssue] = useState<"system" | "app" | null>(null);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(
      authToken &&
        accountId &&
        isDeferredShellWorkReady &&
        isIosPushUiReady &&
        isInteractiveDataReady
    ),
    staleTime: 5 * 60 * 1000,
  });

  const isPushPromptReady = Boolean(
    authToken && accountId && isDeferredShellWorkReady && isIosPushUiReady && pushConfig?.enabled
  );

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

    const checkPush = async () => {
      const nowTs = Date.now();
      if (isChecking || nowTs - lastCheckAt < MIN_PUSH_CHECK_INTERVAL_MS) {
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

        if (!isPushSupported() || Notification.permission !== "granted") {
          if (!isCancelled) {
            setPushStatus("disabled");
            setPushPromptSuccess(null);
            setNativePushIssue(null);
          }
          return;
        }

        const subscription = await getExistingPushSubscription();
        if (!isCancelled) {
          const nextStatus = subscription ? "enabled" : "disabled";
          setPushStatus(nextStatus);
          if (nextStatus === "disabled") {
            setPushPromptSuccess(null);
          }
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
      void checkPush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkPush();
      }
    };

    window.addEventListener("push:subscription-changed", handlePushSubscriptionChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.removeEventListener("push:subscription-changed", handlePushSubscriptionChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPushPromptReady]);

  const shouldShowPushPrompt =
    isPushPromptReady && !isNativePushSupported() && isPushSupported() && pushStatus === "disabled";
  const shouldShowNativePushPrompt = isPushPromptReady && nativePushIssue !== null;
  const shouldShowNotificationPrompt = shouldShowNativePushPrompt || shouldShowPushPrompt;
  const isNotificationBellActive = shouldShowNotificationPrompt;

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

    const pushSupportIssue = getPushSupportIssue();
    if (pushSupportIssue) {
      setPushPromptError(copy.clientLayout.pushErrors.supportMissing);
      return;
    }
    if (!pushConfig?.enabled || !pushConfig.vapidPublicKey) {
      setPushPromptError(copy.clientLayout.pushErrors.serverNotReady);
      return;
    }

    setPushPromptError(null);
    setPushPromptSuccess(null);
    setIsPushPending(true);

    try {
      const permission = await withTimeout(
        Notification.requestPermission(),
        8000,
        copy.clientLayout.pushErrors.permissionTimeout
      );
      if (permission !== "granted") {
        setPushPromptError(copy.clientLayout.pushErrors.permissionDenied);
        return;
      }

      const subscription = await withTimeout(
        subscribeToPushNotifications(pushConfig.vapidPublicKey),
        10000,
        copy.clientLayout.pushErrors.subscribeTimeout
      );

      await withTimeout(
        upsertPushSubscription(toPushSubscriptionPayload(subscription)),
        8000,
        copy.clientLayout.pushErrors.acceptTimeout
      );

      setPushStatus("enabled");
      setPushPromptSuccess(copy.clientLayout.pushErrors.enabled);
      window.dispatchEvent(new Event("push:subscription-changed"));
    } catch (error) {
      setPushPromptError(
        error instanceof Error ? error.message : copy.clientLayout.pushErrors.enableFailed
      );
    } finally {
      setIsPushPending(false);
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
    if (pushStatus === "enabled" && !nativePushIssue) {
      setIsPushDialogOpen(false);
    }
  }, [nativePushIssue, pushStatus]);

  return {
    pushPromptError,
    pushPromptSuccess,
    isPushPending,
    isPushDialogOpen,
    nativePushIssue,
    shouldShowNotificationPrompt,
    isNotificationBellActive,
    setIsPushDialogOpen,
    handleHidePushPrompt,
    handleEnablePush,
    openNativeNotificationSettings,
    copy,
  };
}
