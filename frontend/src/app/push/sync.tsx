import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPushNotificationConfig, upsertPushSubscription } from "@shared/api/pushNotifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@shared/store/useAppStore";
import {
  getExistingPushSubscription,
  isPushSupported,
  toPushSubscriptionPayload,
} from "@shared/utils/pushNotifications";
import {
  isNativePushOptedOut,
  isNativePushSupported,
  NATIVE_PUSH_NAVIGATION_EVENT,
  refreshNativePushSubscriptionPayload,
} from "@shared/utils/nativePushNotifications";
import { appLog } from "@shared/utils/appLog";
import { useGlobalBootReady } from "@/app/boot/state";

const CONSUMED_LAUNCH_URL_SESSION_KEY = "pm_native_consumed_launch_url_v1";

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
          const nativePayload = await refreshNativePushSubscriptionPayload({
            promptIfNeeded: false,
            allowCachedFallback: true,
          });
          if (!nativePayload || isCancelled) {
            return;
          }
          await upsertPushSubscription(nativePayload);
          window.dispatchEvent(new Event("push:subscription-changed"));
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
        window.dispatchEvent(new Event("push:subscription-changed"));
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

type NativeForegroundBanner = {
  id: string;
  title: string;
  body: string;
  url: string | null;
};

export function NativePushForegroundBannerSync() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<NativeForegroundBanner | null>(null);

  useEffect(() => {
    if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) {
      return;
    }

    let dismissTimeoutId: number | null = null;
    let removeListener: (() => void) | null = null;

    const clearBanner = () => {
      if (dismissTimeoutId !== null) {
        window.clearTimeout(dismissTimeoutId);
        dismissTimeoutId = null;
      }
      setBanner(null);
    };

    void PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const data = notification.data ?? {};
      const nestedData = typeof data.data === "object" && data.data !== null ? data.data : {};
      const kind = data.kind ?? (nestedData as { kind?: unknown }).kind;
      if (kind === "test") {
        return;
      }
      const rawUrl = data.url ?? (nestedData as { url?: unknown }).url;
      const url = typeof rawUrl === "string" && rawUrl.startsWith("/") ? rawUrl : null;

      setBanner({
        id: String(notification.id ?? Date.now()),
        title: String(notification.title ?? "PillPath"),
        body: String(notification.body ?? ""),
        url,
      });

      if (dismissTimeoutId !== null) {
        window.clearTimeout(dismissTimeoutId);
      }
      dismissTimeoutId = window.setTimeout(() => {
        dismissTimeoutId = null;
        setBanner(null);
      }, 8000);
    }).then((listener) => {
      removeListener = () => {
        clearBanner();
        void listener.remove();
      };
    });

    return () => {
      if (dismissTimeoutId !== null) {
        window.clearTimeout(dismissTimeoutId);
      }
      removeListener?.();
    };
  }, []);

  if (!banner) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[120] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-[22px] border border-white/15 bg-[rgba(15,23,42,0.92)] text-white shadow-[0_18px_44px_rgba(15,23,42,0.34)] backdrop-blur-xl">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{banner.title}</p>
            {banner.body ? <p className="mt-1 text-sm leading-5 text-white/78">{banner.body}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="rounded-full px-2 py-1 text-xs font-semibold text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
        {banner.url ? (
          <button
            type="button"
            onClick={() => {
              setBanner(null);
              navigate(banner.url!);
            }}
            className="w-full border-t border-white/10 px-4 py-2.5 text-left text-sm font-semibold text-white/86 transition hover:bg-white/8"
          >
            Open
          </button>
        ) : null}
      </div>
    </div>
  );
}
