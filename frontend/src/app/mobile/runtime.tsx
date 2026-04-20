import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { useLocation } from "react-router-dom";
import { blurActiveField } from "@shared/utils/focus";
import { useAppStore } from "@shared/store/useAppStore";
import { appLog } from "@shared/utils/appLog";
import { useGlobalBootReady } from "@/app/boot/state";

export function RouteScrollReset() {
  const location = useLocation();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    blurActiveField();
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = location.pathname;

    if (previousPathname === location.pathname) {
      return;
    }

    const isCreateObservationRoute =
      location.pathname.startsWith("/children/") &&
      location.pathname.endsWith("/illness") &&
      new URLSearchParams(location.search).get("mode") === "create";

    if (isCreateObservationRoute) {
      return;
    }

    const isMobileViewport = window.innerWidth < 768;
    const isPrimaryMenuRoute = [
      "/children",
      "/pillbox",
      "/medicine-cabinet",
      "/home",
      "/more",
      "/illnesses/active",
      "/illnesses/history",
      "/family",
      "/account",
      "/settings",
      "/about",
      "/feedback",
      "/legal",
      "/legal/privacy",
      "/legal/terms",
      "/legal/support",
    ].some((path) => location.pathname === path);

    if (!isMobileViewport || !isPrimaryMenuRoute) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
}

export function PullToRefreshSync() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      return;
    }

    if (typeof window === "undefined" || !("ontouchstart" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    if (!mediaQuery.matches) {
      return;
    }

    let startY = 0;
    let pullDistance = 0;
    let canRefresh = false;
    let scrollElement: Element | null = null;

    const getScrollTop = () => {
      if (scrollElement instanceof HTMLElement) {
        return scrollElement.scrollTop;
      }
      return window.scrollY;
    };

    const refreshPageData = async () => {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      setIsRefreshing(true);

      try {
        await queryClient.refetchQueries({ type: "active" });
      } finally {
        refreshTimeoutRef.current = window.setTimeout(() => {
          isRefreshingRef.current = false;
          setIsRefreshing(false);
          refreshTimeoutRef.current = null;
        }, 420);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (event.touches.length !== 1 || !touch) {
        canRefresh = false;
        return;
      }

      scrollElement = document.scrollingElement;
      canRefresh = getScrollTop() <= 0;
      startY = touch.clientY;
      pullDistance = 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!canRefresh || event.touches.length !== 1 || !touch) {
        return;
      }

      const currentY = touch.clientY;
      pullDistance = currentY - startY;
    };

    const handleTouchEnd = () => {
      if (canRefresh && pullDistance > 96) {
        void refreshPageData();
      }

      canRefresh = false;
      startY = 0;
      pullDistance = 0;
      scrollElement = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [location.key, queryClient]);

  if (!isRefreshing) {
    return null;
  }

  return (
    <div className="soft-refresh-overlay" aria-live="polite" aria-label="Обновляем страницу">
      <div className="soft-refresh-indicator">
        <span className="soft-refresh-spinner" aria-hidden="true" />
        <span>Обновляем…</span>
      </div>
    </div>
  );
}

export function MobilePageResumeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let lastHiddenAt = Date.now();

    const refreshActiveQueries = () => {
      void queryClient.refetchQueries({ type: "active" });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        lastHiddenAt = Date.now();
        return;
      }

      if (Date.now() - lastHiddenAt > 1500) {
        refreshActiveQueries();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshActiveQueries();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", refreshActiveQueries);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", refreshActiveQueries);
    };
  }, [queryClient]);

  return null;
}

export function GlobalTapGuard() {
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      return;
    }

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 1024 ||
      (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    if (!isMobile) {
      return;
    }

    const lastTapByElement = new WeakMap<HTMLElement, number>();
    const tapBlockMs = 320;

    const findActionElement = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      return target.closest(
        "button, a[role='button'], [role='menuitem'], [role='menuitemradio'], .soft-button-primary, .soft-button-secondary, .soft-tab, .soft-tab-active, .app-btn-primary-md, .app-btn-danger-md"
      );
    };

    const isElementDisabled = (element: HTMLElement) => {
      if (element instanceof HTMLButtonElement) {
        return element.disabled;
      }
      return element.getAttribute("aria-disabled") === "true";
    };

    const handleClickCapture = (event: MouseEvent) => {
      const actionElement = findActionElement(event.target);
      if (!actionElement || isElementDisabled(actionElement)) {
        return;
      }
      const now = performance.now();
      const last = lastTapByElement.get(actionElement) ?? 0;
      if (now - last < tapBlockMs) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      lastTapByElement.set(actionElement, now);
    };

    document.addEventListener("click", handleClickCapture, true);
    return () => document.removeEventListener("click", handleClickCapture, true);
  }, []);

  return null;
}

export function MobileInteractionDiagnostics() {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 1024 ||
      (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios");
    if (!isMobile) {
      return;
    }

    let observer: PerformanceObserver | null = null;

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration >= 120) {
              appLog.warn(`UI long task detected: ${entry.duration.toFixed(0)}ms`);
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        observer = null;
      }
    }

    const findActionElement = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      return target.closest(
        "button, a[role='button'], [role='menuitem'], [role='menuitemradio'], .soft-button-primary, .soft-button-secondary, .soft-tab, .soft-tab-active, .app-btn-primary-md, .app-btn-danger-md"
      );
    };

    const handlePointerDown = (event: PointerEvent) => {
      const actionElement = findActionElement(event.target);
      if (!actionElement) {
        return;
      }
      const startedAt = performance.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const delay = performance.now() - startedAt;
          if (delay >= 140) {
            const text = actionElement.textContent?.trim()?.slice(0, 60) || "unknown";
            appLog.warn(`Slow tap reaction: ${delay.toFixed(0)}ms (${text})`);
          }
        });
      });
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      observer?.disconnect();
    };
  }, []);

  return null;
}

export function WarmRouteChunks() {
  const role = useAppStore((s) => s.role);
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);
  const isBootReady = useGlobalBootReady();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const [isInitialNativeLaunch] = useState(() => {
    if (!isNativeIos || typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
  });

  useEffect(() => {
    if (!(authToken || accountId) || role === "admin") {
      return;
    }

    const windowWithIdleApi = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (
          callback: IdleRequestCallback,
          options?: IdleRequestOptions
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
    let cancelled = false;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const warmRoutes = () => {
      if (cancelled) {
        return;
      }

      const activeElement = document.activeElement;
      const isUserTyping =
        activeElement instanceof HTMLElement &&
        Boolean(activeElement.closest("input, textarea, select, [contenteditable='true']"));

      if (isUserTyping) {
        timeoutId = window.setTimeout(warmRoutes, 1400);
        return;
      }

      void Promise.allSettled([
        import("@client/pages/ChildrenPage"),
        import("@client/pages/ChildSleepPage"),
        import("@client/pages/ChildFeedingPage"),
        import("@client/pages/ChildIllnessPage"),
        import("@client/pages/PillboxPage"),
        import("@client/pages/MedicineCabinetPage"),
        import("@client/pages/ActiveIllnessesPage"),
        import("@client/pages/MorePage"),
        import("@client/pages/SettingsPage"),
        import("@client/pages/FamilyPage"),
      ]);
    };

    const scheduleWarmRoutes = () => {
      if (!isBootReady) {
        timeoutId = window.setTimeout(warmRoutes, isNativeIos ? 900 : 120);
        return;
      }

      if (typeof windowWithIdleApi.requestIdleCallback === "function") {
        idleId = windowWithIdleApi.requestIdleCallback(
          () => {
            warmRoutes();
          },
          { timeout: isNativeIos ? 4600 : 3200 }
        );
        return;
      }

      timeoutId = window.setTimeout(warmRoutes, isNativeIos ? 3400 : 2200);
    };

    timeoutId = window.setTimeout(
      scheduleWarmRoutes,
      isBootReady
        ? isNativeIos
          ? isInitialNativeLaunch
            ? 4200
            : 2400
          : 1800
        : isNativeIos
          ? 900
          : 220
    );

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null && typeof windowWithIdleApi.cancelIdleCallback === "function") {
        windowWithIdleApi.cancelIdleCallback(idleId);
      }
    };
  }, [accountId, authToken, isBootReady, isInitialNativeLaunch, isNativeIos, role]);

  return null;
}
