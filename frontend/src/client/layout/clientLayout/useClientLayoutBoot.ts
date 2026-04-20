import { useEffect, useState } from "react";
import {
  IOS_FIRST_INTERACTION_DEFER_MS,
  IOS_FIRST_LAUNCH_BOOT_DELAY_MS,
  IOS_FIRST_LAUNCH_IDLE_TIMEOUT_MS,
  IOS_FIRST_LAUNCH_PUSH_UI_DELAY_MS,
  IOS_FIRST_LAUNCH_SHELL_FALLBACK_DELAY_MS,
  IOS_FIRST_LAUNCH_SHELL_WORK_DELAY_MS,
  IOS_REPEAT_INTERACTION_DEFER_MS,
  IOS_REPEAT_LAUNCH_BOOT_DELAY_MS,
  IOS_REPEAT_LAUNCH_IDLE_TIMEOUT_MS,
  IOS_REPEAT_LAUNCH_PUSH_UI_DELAY_MS,
  IOS_REPEAT_LAUNCH_SHELL_FALLBACK_DELAY_MS,
  IOS_REPEAT_LAUNCH_SHELL_WORK_DELAY_MS,
  IOS_TYPING_RETRY_DELAY_MS,
} from "./constants";

export function useClientLayoutBoot({
  isIosShell,
  authToken,
  accountId,
}: {
  isIosShell: boolean;
  authToken: string | null;
  accountId: string | null;
}) {
  const firstNativeLaunchStorageKey = "pm_native_ios_first_launch_completed_v2";
  const [isDeferredBootReady, setIsDeferredBootReady] = useState(!isIosShell);
  const [isDeferredShellWorkReady, setIsDeferredShellWorkReady] = useState(!isIosShell);
  const [isIosPushUiReady, setIsIosPushUiReady] = useState(!isIosShell);
  const [isInteractiveDataReady, setIsInteractiveDataReady] = useState(!isIosShell);

  useEffect(() => {
    if (!isIosShell) {
      setIsInteractiveDataReady(true);
      return;
    }

    if (!isDeferredShellWorkReady) {
      setIsInteractiveDataReady(false);
      return;
    }

    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    setIsInteractiveDataReady(false);
    const timeoutId = window.setTimeout(
      () => {
        setIsInteractiveDataReady(true);
      },
      isFirstNativeLaunch ? IOS_FIRST_INTERACTION_DEFER_MS : IOS_REPEAT_INTERACTION_DEFER_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [firstNativeLaunchStorageKey, isDeferredShellWorkReady, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsIosPushUiReady(true);
      return;
    }

    setIsIosPushUiReady(false);
    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    const timeoutId = window.setTimeout(
      () => {
        setIsIosPushUiReady(true);
      },
      isFirstNativeLaunch ? IOS_FIRST_LAUNCH_PUSH_UI_DELAY_MS : IOS_REPEAT_LAUNCH_PUSH_UI_DELAY_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accountId, authToken, firstNativeLaunchStorageKey, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsDeferredBootReady(true);
      setIsDeferredShellWorkReady(true);
      return;
    }

    setIsDeferredBootReady(false);
    setIsDeferredShellWorkReady(false);
    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
    let timeoutId: number | null = null;
    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(
        () => {
          setIsDeferredBootReady(true);
        },
        isFirstNativeLaunch ? IOS_FIRST_LAUNCH_BOOT_DELAY_MS : IOS_REPEAT_LAUNCH_BOOT_DELAY_MS
      );
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [accountId, authToken, firstNativeLaunchStorageKey, isIosShell]);

  useEffect(() => {
    if (!isIosShell) {
      setIsDeferredShellWorkReady(true);
      return;
    }

    if (!isDeferredBootReady) {
      setIsDeferredShellWorkReady(false);
      return;
    }

    const isFirstNativeLaunch =
      typeof window !== "undefined" &&
      window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";
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

    const finishReady = () => {
      if (!cancelled) {
        setIsDeferredShellWorkReady(true);
      }
    };

    const armReady = () => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLElement &&
        Boolean(activeElement.closest("input, textarea, select, [contenteditable='true']"));

      if (isTyping) {
        timeoutId = window.setTimeout(armReady, IOS_TYPING_RETRY_DELAY_MS);
        return;
      }

      if (typeof windowWithIdleApi.requestIdleCallback === "function") {
        idleId = windowWithIdleApi.requestIdleCallback(() => finishReady(), {
          timeout: isFirstNativeLaunch
            ? IOS_FIRST_LAUNCH_IDLE_TIMEOUT_MS
            : IOS_REPEAT_LAUNCH_IDLE_TIMEOUT_MS,
        });
        return;
      }

      timeoutId = window.setTimeout(
        finishReady,
        isFirstNativeLaunch
          ? IOS_FIRST_LAUNCH_SHELL_FALLBACK_DELAY_MS
          : IOS_REPEAT_LAUNCH_SHELL_FALLBACK_DELAY_MS
      );
    };

    timeoutId = window.setTimeout(
      armReady,
      isFirstNativeLaunch
        ? IOS_FIRST_LAUNCH_SHELL_WORK_DELAY_MS
        : IOS_REPEAT_LAUNCH_SHELL_WORK_DELAY_MS
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
  }, [accountId, authToken, firstNativeLaunchStorageKey, isDeferredBootReady, isIosShell]);

  const isFirstNativeLaunch =
    isIosShell &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(firstNativeLaunchStorageKey) !== "1";

  return {
    isDeferredBootReady,
    isDeferredShellWorkReady,
    isIosPushUiReady,
    isInteractiveDataReady,
    isFirstNativeLaunch,
    firstNativeLaunchStorageKey,
  };
}
