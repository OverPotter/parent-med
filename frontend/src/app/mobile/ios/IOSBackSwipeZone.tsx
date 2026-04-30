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
import {
  IOS_UNDERLAY_SNAPSHOT_CHANGE_EVENT,
  readIosActiveSnapshot,
} from "./snapshotState";
import { shouldDisableGlobalIosBackSwipe } from "./swipeRoutes";
import {
  cancelIosBackSwipeRootVisuals,
  clearIosBackSwipeRootFlags,
  commitIosBackSwipeRootVisuals,
  resetIosBackSwipeRootVisuals,
  startIosBackSwipeRootVisuals,
  updateIosBackSwipeRootProgress,
} from "./swipeVisuals";

function isInsideLocalSwipeRoot(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-ios-local-back-swipe='true']"));
}

export function IOSBackSwipeZone() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPathKey = `${location.pathname}${location.search}`;
  const [previousScreenSnapshot, setPreviousScreenSnapshot] = useState(() => {
    return readIosActiveSnapshot(currentPathKey);
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
      resetIosBackSwipeRootVisuals();
      document.documentElement.removeAttribute("data-ios-back-swipe-zone");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setPreviousScreenSnapshot(readIosActiveSnapshot(currentPathKey));
  }, [currentPathKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleSnapshotChange = () => {
      setPreviousScreenSnapshot(readIosActiveSnapshot(currentPathKey));
    };
    window.addEventListener(IOS_UNDERLAY_SNAPSHOT_CHANGE_EVENT, handleSnapshotChange);
    return () => window.removeEventListener(IOS_UNDERLAY_SNAPSHOT_CHANGE_EVENT, handleSnapshotChange);
  }, [currentPathKey]);

  const shouldDisableSwipeBack = shouldDisableGlobalIosBackSwipe(
    location.pathname,
    location.search
  );

  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios" ||
      shouldDisableSwipeBack
    ) {
      return;
    }
    const finishCancel = () => {
      cancelIosBackSwipeRootVisuals();
      swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
        resetIosBackSwipeRootVisuals();
        swipeStateRef.current.resetTimeoutId = null;
      }, IOS_BACK_SWIPE_CANCEL_MS);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || event.touches.length !== 1) {
        return;
      }
      if (isInsideLocalSwipeRoot(event.target)) {
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
      clearIosBackSwipeRootFlags();
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (isInsideLocalSwipeRoot(event.target)) {
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
        startIosBackSwipeRootVisuals();
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
      updateIosBackSwipeRootProgress(
        offset,
        getIosBackSwipeProgress(offset, window.innerWidth)
      );
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (isInsideLocalSwipeRoot(event.target)) {
        swipeStateRef.current.active = false;
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

        commitIosBackSwipeRootVisuals(Math.min(dx, window.innerWidth));
        swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
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
      resetIosBackSwipeRootVisuals();
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
          {previousScreenSnapshot.bottomNavHtml ? (
            <div dangerouslySetInnerHTML={{ __html: previousScreenSnapshot.bottomNavHtml }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
