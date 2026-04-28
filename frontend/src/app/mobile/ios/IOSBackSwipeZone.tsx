import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { blurActiveField } from "@shared/utils/focus";
import {
  IOS_BACK_SWIPE_CANCEL_MS,
  IOS_BACK_SWIPE_COMMIT_MS,
  canStartIosBackSwipe,
  getIosBackSwipeOffset,
  getIosBackSwipeProgress,
  shouldCancelIosBackSwipe,
  shouldCommitIosBackSwipe,
  shouldIgnoreIosBackSwipeStartTarget,
  shouldIgnoreIosBackSwipeTarget,
  shouldLockIosBackSwipe,
  shouldPreventScrollDuringIosBackSwipe,
} from "@shared/navigation/iosBackSwipe";

export function IOSBackSwipeZone() {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousScreenSnapshot, setPreviousScreenSnapshot] = useState(() => {
    if (typeof window === "undefined") {
      return { html: "", scrollY: 0 };
    }
    return (
      (
        window as Window & {
          __PM_IOS_PREVIOUS_SCREEN_SNAPSHOT?: { html: string; scrollY: number };
        }
      ).__PM_IOS_PREVIOUS_SCREEN_SNAPSHOT ?? { html: "", scrollY: 0 }
    );
  });
  const swipeStateRef = useRef<{
    startX: number;
    startY: number;
    latestDx: number;
    renderedDx: number;
    horizontalLocked: boolean;
    active: boolean;
    resetTimeoutId: number | null;
  }>({
    startX: 0,
    startY: 0,
    latestDx: 0,
    renderedDx: 0,
    horizontalLocked: false,
    active: false,
    resetTimeoutId: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    document.documentElement.setAttribute("data-ios-back-swipe-zone", "true");
    return () => {
      if (swipeStateRef.current.resetTimeoutId !== null) {
        window.clearTimeout(swipeStateRef.current.resetTimeoutId);
      }
      document.documentElement.style.removeProperty("--ios-back-swipe-offset");
      document.documentElement.style.removeProperty("--ios-back-swipe-progress");
      document.documentElement.removeAttribute("data-ios-back-swipe-active");
      document.documentElement.removeAttribute("data-ios-back-swipe-commit");
      document.documentElement.removeAttribute("data-ios-back-swipe-cancel");
      document.documentElement.removeAttribute("data-ios-back-swipe-zone");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviousScreenSnapshot(
      (
        window as Window & {
          __PM_IOS_PREVIOUS_SCREEN_SNAPSHOT?: { html: string; scrollY: number };
        }
      ).__PM_IOS_PREVIOUS_SCREEN_SNAPSHOT ?? { html: "", scrollY: 0 }
    );
  }, [location.pathname, location.search]);

  const pillboxMode = new URLSearchParams(location.search).get("mode");
  const shouldDisableSwipeBack =
    location.pathname === "/" ||
    location.pathname === "/auth" ||
    location.pathname === "/start" ||
    location.pathname === "/children" ||
    location.pathname === "/medicine-cabinet" ||
    location.pathname === "/illnesses/active" ||
    (location.pathname === "/pillbox" && !pillboxMode);

  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios" ||
      shouldDisableSwipeBack
    ) {
      return;
    }

    const root = document.documentElement;

    const resetSwipeVisuals = () => {
      root.removeAttribute("data-ios-back-swipe-active");
      root.removeAttribute("data-ios-back-swipe-commit");
      root.removeAttribute("data-ios-back-swipe-cancel");
      root.style.removeProperty("--ios-back-swipe-offset");
      root.style.removeProperty("--ios-back-swipe-progress");
    };

    const finishCancel = () => {
      root.removeAttribute("data-ios-back-swipe-active");
      root.setAttribute("data-ios-back-swipe-cancel", "true");
      root.style.setProperty("--ios-back-swipe-offset", "0px");
      root.style.setProperty("--ios-back-swipe-progress", "0");
      swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
        resetSwipeVisuals();
        swipeStateRef.current.resetTimeoutId = null;
      }, IOS_BACK_SWIPE_CANCEL_MS);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || event.touches.length !== 1) {
        return;
      }
      if (shouldIgnoreIosBackSwipeStartTarget(event.target, touch.clientX)) {
        return;
      }
      if (!canStartIosBackSwipe(touch.clientX, window.innerWidth)) {
        return;
      }
      if (swipeStateRef.current.resetTimeoutId !== null) {
        window.clearTimeout(swipeStateRef.current.resetTimeoutId);
        swipeStateRef.current.resetTimeoutId = null;
      }
      swipeStateRef.current.startX = touch.clientX;
      swipeStateRef.current.startY = touch.clientY;
      swipeStateRef.current.latestDx = 0;
      swipeStateRef.current.renderedDx = 0;
      swipeStateRef.current.horizontalLocked = false;
      swipeStateRef.current.active = true;
      root.removeAttribute("data-ios-back-swipe-commit");
      root.removeAttribute("data-ios-back-swipe-cancel");
      root.removeAttribute("data-ios-back-swipe-active");
      root.style.removeProperty("--ios-back-swipe-offset");
      root.style.removeProperty("--ios-back-swipe-progress");
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (shouldIgnoreIosBackSwipeTarget(event.target)) {
        return;
      }
      const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
      const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
      swipeStateRef.current.latestDx = dx;

      if (!swipeStateRef.current.horizontalLocked && shouldLockIosBackSwipe(dx, dy)) {
        swipeStateRef.current.horizontalLocked = true;
        root.setAttribute("data-ios-back-swipe-active", "true");
        root.style.setProperty("--ios-back-swipe-offset", "0px");
        root.style.setProperty("--ios-back-swipe-progress", "0");
      }

      if (
        event.cancelable &&
        shouldPreventScrollDuringIosBackSwipe(dx, dy, swipeStateRef.current.horizontalLocked)
      ) {
        event.preventDefault();
      }

      if (shouldCancelIosBackSwipe(dx, dy, swipeStateRef.current.horizontalLocked)) {
        swipeStateRef.current.active = false;
        finishCancel();
        return;
      }

      if (!swipeStateRef.current.horizontalLocked) {
        return;
      }

      const offset = getIosBackSwipeOffset(dx, window.innerWidth);
      swipeStateRef.current.renderedDx = offset;
      root.style.setProperty("--ios-back-swipe-offset", `${offset}px`);
      root.style.setProperty(
        "--ios-back-swipe-progress",
        `${getIosBackSwipeProgress(offset, window.innerWidth)}`
      );
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (shouldIgnoreIosBackSwipeTarget(event.target)) {
        swipeStateRef.current.active = false;
        return;
      }
      swipeStateRef.current.active = false;
      const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
      const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
      const canCommit = shouldCommitIosBackSwipe(
        dx,
        dy,
        swipeStateRef.current.horizontalLocked,
        window.innerWidth
      );

      if (canCommit) {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLElement &&
          activeElement.closest("input, textarea, select, [contenteditable='true']")
        ) {
          blurActiveField();
          finishCancel();
          return;
        }

        root.removeAttribute("data-ios-back-swipe-active");
        root.setAttribute("data-ios-back-swipe-commit", "true");
        root.style.setProperty("--ios-back-swipe-offset", `${Math.min(dx, window.innerWidth)}px`);
        root.style.setProperty("--ios-back-swipe-progress", "1");
        swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
          resetSwipeVisuals();
          swipeStateRef.current.resetTimeoutId = null;
          navigate(-1);
        }, IOS_BACK_SWIPE_COMMIT_MS);
        return;
      }

      finishCancel();
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      if (swipeStateRef.current.resetTimeoutId !== null) {
        window.clearTimeout(swipeStateRef.current.resetTimeoutId);
        swipeStateRef.current.resetTimeoutId = null;
      }
      resetSwipeVisuals();
    };
  }, [navigate, shouldDisableSwipeBack]);

  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "ios" ||
    shouldDisableSwipeBack
  ) {
    return null;
  }

  return (
    <div aria-hidden="true" className="ios-back-swipe-underlay">
      {previousScreenSnapshot.html ? (
        <div className="ios-back-swipe-underlay-screen">
          <div
            style={{ transform: `translate3d(0, -${previousScreenSnapshot.scrollY}px, 0)` }}
            dangerouslySetInnerHTML={{ __html: previousScreenSnapshot.html }}
          />
        </div>
      ) : null}
    </div>
  );
}
