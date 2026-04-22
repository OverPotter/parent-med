import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

const IOS_FIRST_LAUNCH_NON_CRITICAL_DELAY_MS = 1400;
const IOS_REPEAT_LAUNCH_NON_CRITICAL_DELAY_MS = 600;

export function RouteFallback() {
  return null;
}

export function useGlobalBootReady() {
  const [isBootReady, setIsBootReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean((window as Window & { __PM_BOOT_READY?: boolean }).__PM_BOOT_READY);
  });

  useEffect(() => {
    if (typeof window === "undefined" || isBootReady) {
      return;
    }

    const handleBootReady = () => setIsBootReady(true);
    window.addEventListener("app:boot-ready", handleBootReady, { once: true });
    return () => window.removeEventListener("app:boot-ready", handleBootReady);
  }, [isBootReady]);

  return isBootReady;
}

export function useDeferredNonCriticalStartupReady() {
  const isBootReady = useGlobalBootReady();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const [isInitialNativeLaunch] = useState(() => {
    if (!isNativeIos || typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
  });
  const [isReady, setIsReady] = useState(!isNativeIos);

  useEffect(() => {
    if (!isNativeIos) {
      setIsReady(true);
      return;
    }

    if (!isBootReady) {
      setIsReady(false);
      return;
    }

    setIsReady(false);
    const timeoutId = window.setTimeout(
      () => setIsReady(true),
      isInitialNativeLaunch
        ? IOS_FIRST_LAUNCH_NON_CRITICAL_DELAY_MS
        : IOS_REPEAT_LAUNCH_NON_CRITICAL_DELAY_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [isBootReady, isInitialNativeLaunch, isNativeIos]);

  return isReady;
}
