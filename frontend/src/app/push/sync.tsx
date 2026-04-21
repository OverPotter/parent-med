import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  isPushSupported,
  toPushSubscriptionPayload,
} from "@shared/utils/pushNotifications";
import {
  getCachedNativePushSubscriptionPayload,
  isNativePushOptedOut,
  isNativePushSupported,
  NATIVE_PUSH_NAVIGATION_EVENT,
} from "@shared/utils/nativePushNotifications";
import { appLog } from "@shared/utils/appLog";
import { useGlobalBootReady } from "@/app/boot/state";

const IOS_FIRST_LAUNCH_PUSH_SYNC_DELAY_MS = 6000;
const IOS_REPEAT_LAUNCH_PUSH_SYNC_DELAY_MS = 3000;
const CONSUMED_LAUNCH_URL_SESSION_KEY = "pm_native_consumed_launch_url_v1";

export function PushSubscriptionSync() {
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const isBootReady = useGlobalBootReady();
  const [isIosPushSyncReady, setIsIosPushSyncReady] = useState(
    !(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")
  );

  useEffect(() => {
    if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) {
      setIsIosPushSyncReady(true);
      return;
    }

    setIsIosPushSyncReady(false);
    const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
    const isInitialNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    const timeoutId = window.setTimeout(
      () => {
        setIsIosPushSyncReady(true);
      },
      isInitialNativeLaunch
        ? IOS_FIRST_LAUNCH_PUSH_SYNC_DELAY_MS
        : IOS_REPEAT_LAUNCH_PUSH_SYNC_DELAY_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

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
          const nativePayload = getCachedNativePushSubscriptionPayload();
          if (!nativePayload || isCancelled) {
            return;
          }
          await upsertPushSubscription(nativePayload);
          return;
        }

        if (!isPushSupported() || Notification.permission !== "granted") {
          return;
        }
        const webSubscription = await getExistingPushSubscription();
        if (!webSubscription || isCancelled) {
          return;
        }
        await upsertPushSubscription(toPushSubscriptionPayload(webSubscription));
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
  const navigate = useNavigate();
  const location = useLocation();
  const currentUrlRef = useRef("");
  const lastHandledRef = useRef<{ url: string; at: number } | null>(null);

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
      if (typeof rawUrl !== "string") {
        return;
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

      if (!url.startsWith("/")) {
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
      navigate(url, { replace: false });
    };

    const handleNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ url?: unknown }>).detail;
      navigateToNativeUrl(detail?.url, "event");
    };

    window.addEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);

    let removeAppUrlOpenListener: (() => void) | undefined;

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
    }

    return () => {
      window.removeEventListener(NATIVE_PUSH_NAVIGATION_EVENT, handleNavigate);
      removeAppUrlOpenListener?.();
    };
  }, [navigate]);

  return null;
}
