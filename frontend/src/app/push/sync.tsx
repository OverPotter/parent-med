import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getCachedNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  NATIVE_PUSH_NAVIGATION_EVENT,
  refreshNativePushSubscriptionPayload,
} from "@shared/utils/nativePushNotifications";
import { appLog } from "@shared/utils/appLog";
import { useGlobalBootReady } from "@/app/boot/state";

const CONSUMED_LAUNCH_URL_SESSION_KEY = "pm_native_consumed_launch_url_v1";
const PENDING_NATIVE_URL_SESSION_KEY = "pm_native_pending_url_v1";

export function normalizeNativeNavigationUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") {
    return null;
  }

  let url = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "pillpath:" && parsed.pathname.startsWith("/")) {
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } else if (parsed.pathname.startsWith("/")) {
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // noop: keep raw value
  }

  return url.startsWith("/") ? url : null;
}

export function readPendingNativeNavigationUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(PENDING_NATIVE_URL_SESSION_KEY);
}

function writePendingNativeNavigationUrl(url: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PENDING_NATIVE_URL_SESSION_KEY, url);
}

export function clearPendingNativeNavigationUrl() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PENDING_NATIVE_URL_SESSION_KEY);
}

export function clearNativeNavigationSessionState() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PENDING_NATIVE_URL_SESSION_KEY);
  window.sessionStorage.removeItem(CONSUMED_LAUNCH_URL_SESSION_KEY);
}

export function PushSubscriptionSync() {
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const isBootReady = useGlobalBootReady();
  const [isIosPushSyncReady] = useState(true);

  const { data: pushConfig } = useQuery({
    queryKey: ["push", "config", accountId],
    queryFn: fetchPushNotificationConfig,
    enabled: Boolean(authToken && accountId && isBootReady && isIosPushSyncReady),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isBootReady || !isIosPushSyncReady || !authToken || !accountId || !pushConfig?.enabled) {
      return;
    }

    let isCancelled = false;

    const sync = async () => {
      try {
        if (isNativePushSupported()) {
          if (isNativePushOptedOut()) {
            return;
          }

          const cachedPayload = getCachedNativePushSubscriptionPayload();
          if (cachedPayload && !isCancelled) {
            await upsertPushSubscription(cachedPayload);
            window.dispatchEvent(new Event("push:subscription-changed"));
          }

          const freshPayload = await refreshNativePushSubscriptionPayload({
            promptIfNeeded: false,
            allowCachedFallback: false,
          });
          if (!freshPayload || isCancelled) {
            return;
          }

          const payloadChanged =
            !cachedPayload ||
            cachedPayload.endpoint !== freshPayload.endpoint ||
            cachedPayload.device_id !== freshPayload.device_id ||
            cachedPayload.platform !== freshPayload.platform;

          if (!payloadChanged) {
            return;
          }

          await upsertPushSubscription(freshPayload);
          window.dispatchEvent(new Event("push:subscription-changed"));
        }
      } catch (error) {
        appLog.dev("Push: синхронизация подписки пропущена", error);
      }
    };

    void sync();

    return () => {
      isCancelled = true;
    };
  }, [accountId, authToken, isBootReady, isIosPushSyncReady, pushConfig?.enabled]);

  return null;
}

export function NativePushNavigationSync() {
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUrlRef = useRef("");
  const lastHandledRef = useRef<{ url: string; at: number } | null>(null);
  const hasSession = Boolean(authToken || accountId);

  const isConsumedLaunchUrl = (url: string) => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.sessionStorage.getItem(CONSUMED_LAUNCH_URL_SESSION_KEY) === url;
  };

  const markLaunchUrlConsumed = (url: string) => {
    if (typeof window === "undefined") {
      return;
    }
    window.sessionStorage.setItem(CONSUMED_LAUNCH_URL_SESSION_KEY, url);
  };

  useEffect(() => {
    currentUrlRef.current = `${location.pathname}${location.search}${location.hash}`;
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    const navigateToNativeUrl = (rawUrl: unknown, source: "launch" | "event" = "event") => {
      const url = normalizeNativeNavigationUrl(rawUrl);
      if (!url) {
        return;
      }

      if (!hasSession) {
        writePendingNativeNavigationUrl(url);
        return;
      }

      if (source === "launch" && isConsumedLaunchUrl(url)) {
        return;
      }

      const now = Date.now();
      const isImmediateDuplicate =
        lastHandledRef.current?.url === url &&
        now - lastHandledRef.current.at < 1200 &&
        currentUrlRef.current === url;

      if (isImmediateDuplicate) {
        return;
      }

      lastHandledRef.current = { url, at: now };
      if (source === "launch") {
        markLaunchUrlConsumed(url);
      }
      clearPendingNativeNavigationUrl();
      navigate(url, { replace: false });
    };

    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: unknown }>).detail;
      navigateToNativeUrl(detail?.url, "event");
    };

    window.addEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);

    let removeAppUrlOpenListener: (() => void) | undefined;
    let removePushActionListener: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.getLaunchUrl().then((result) => {
        navigateToNativeUrl(result?.url, "launch");
      });

      void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        navigateToNativeUrl(url, "event");
      }).then((listener) => {
        removeAppUrlOpenListener = () => {
          void listener.remove();
        };
      });

      void PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
        const data = event.notification.data ?? {};
        const nestedData = typeof data.data === "object" && data.data !== null ? data.data : {};
        const url = data.url ?? (nestedData as { url?: unknown }).url;
        navigateToNativeUrl(url, "event");
      }).then((listener) => {
        removePushActionListener = () => {
          void listener.remove();
        };
      });
    }

    return () => {
      window.removeEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);
      removeAppUrlOpenListener?.();
      removePushActionListener?.();
    };
  }, [hasSession, navigate]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    const pendingUrl = readPendingNativeNavigationUrl();
    if (!pendingUrl) {
      return;
    }

    clearPendingNativeNavigationUrl();
    navigate(pendingUrl, { replace: false });
  }, [hasSession, navigate]);

  return null;
}
