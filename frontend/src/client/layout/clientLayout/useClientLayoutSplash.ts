import { useEffect, useState } from "react";
import { shouldShowClientBootSplash } from "@client/startup/startupDecisions";
import {
  IOS_FIRST_LAUNCH_SPLASH_SETTLE_MS,
  IOS_REPEAT_LAUNCH_SPLASH_SETTLE_MS,
} from "./constants";

type UseClientLayoutSplashArgs = {
  isIosShell: boolean;
  authToken: string | null;
  accountId: string | null;
  currentFamilyId: string | null;
  familiesCount: number;
  isFamiliesLoading: boolean;
  isFamiliesSuccess: boolean;
  isDeferredBootReady: boolean;
  isDeferredShellWorkReady: boolean;
  isFirstNativeLaunch: boolean;
  firstNativeLaunchStorageKey: string;
  isWarmupReady: boolean;
};

export function useClientLayoutSplash({
  isIosShell,
  authToken,
  accountId,
  currentFamilyId,
  familiesCount,
  isFamiliesLoading,
  isFamiliesSuccess,
  isDeferredBootReady,
  isDeferredShellWorkReady,
  isFirstNativeLaunch,
  firstNativeLaunchStorageKey,
  isWarmupReady,
}: UseClientLayoutSplashArgs) {
  const globalBootWindow =
    typeof window === "undefined" ? undefined : (window as Window & { __PM_BOOT_READY?: boolean });
  const wasBootReadyOnMount = Boolean(globalBootWindow?.__PM_BOOT_READY);
  const [isInitialBootSettled, setIsInitialBootSettled] = useState(wasBootReadyOnMount);
  const [isBootSplashMounted, setIsBootSplashMounted] = useState(!wasBootReadyOnMount);
  const [isBootSplashClosing, setIsBootSplashClosing] = useState(false);

  const shouldShowBootSplash = shouldShowClientBootSplash({
    authToken,
    accountId,
    currentFamilyId,
    familiesCount,
    isFamiliesLoading,
    isFamiliesSuccess,
    isDeferredBootReady,
    isDeferredShellWorkReady,
    isFirstNativeLaunch,
  });

  useEffect(() => {
    if (wasBootReadyOnMount) {
      return;
    }

    if (isInitialBootSettled || shouldShowBootSplash) {
      return;
    }

    const bootWindow = window as Window & {
      __PM_FIRST_COLD_BOOT_SETTLED?: boolean;
    };
    const settleDelay = isIosShell
      ? bootWindow.__PM_FIRST_COLD_BOOT_SETTLED
        ? 140
        : isFirstNativeLaunch
          ? IOS_FIRST_LAUNCH_SPLASH_SETTLE_MS
          : IOS_REPEAT_LAUNCH_SPLASH_SETTLE_MS
      : 140;

    const timeoutId = window.setTimeout(() => {
      bootWindow.__PM_FIRST_COLD_BOOT_SETTLED = true;
      if (isFirstNativeLaunch) {
        window.localStorage.setItem(firstNativeLaunchStorageKey, "1");
      }
      setIsInitialBootSettled(true);
    }, settleDelay);

    return () => window.clearTimeout(timeoutId);
  }, [
    firstNativeLaunchStorageKey,
    isFirstNativeLaunch,
    isInitialBootSettled,
    isIosShell,
    shouldShowBootSplash,
    isWarmupReady,
    wasBootReadyOnMount,
  ]);

  useEffect(() => {
    if (wasBootReadyOnMount) {
      setIsBootSplashMounted(false);
      setIsBootSplashClosing(false);
      return;
    }

    if (!isInitialBootSettled) {
      setIsBootSplashMounted(true);
      setIsBootSplashClosing(false);
      return;
    }

    if (shouldShowBootSplash) {
      return;
    }

    setIsBootSplashMounted(true);
    setIsBootSplashClosing(true);
    (window as Window & { __PM_BOOT_READY?: boolean }).__PM_BOOT_READY = true;
    window.dispatchEvent(new Event("app:boot-ready"));
    const timeoutId = window.setTimeout(() => {
      setIsBootSplashMounted(false);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isInitialBootSettled, shouldShowBootSplash, wasBootReadyOnMount]);

  return {
    isBootSplashMounted,
    isBootSplashClosing,
  };
}
