import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import {
  IOS_BACK_SWIPE_CANCEL_MS,
  IOS_BACK_SWIPE_COMMIT_MS,
  canStartIosBackSwipe,
  getIosBackSwipeOffset,
  shouldCancelIosBackSwipe,
  shouldCommitIosBackSwipe,
  shouldIgnoreIosBackSwipeStartTarget,
  shouldIgnoreIosBackSwipeTarget,
  shouldLockIosBackSwipe,
  shouldPreventScrollDuringIosBackSwipe,
} from "@shared/navigation/iosBackSwipe";

export function IosEdgeBackGesture({
  isEnabled,
  onBack,
  targetRef,
}: {
  isEnabled: boolean;
  onBack: () => void;
  targetRef: RefObject<HTMLElement | null>;
}) {
  const isIosShell = useIsIosShell();
  const swipeStateRef = useRef({
    startX: 0,
    startY: 0,
    latestDx: 0,
    renderedDx: 0,
    horizontalLocked: false,
    active: false,
    resetTimeoutId: null as number | null,
  });

  const resetTargetStyles = () => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    target.style.transition = "";
    target.style.transform = "";
    target.style.boxShadow = "";
  };

  useEffect(() => {
    if (!isEnabled || !isIosShell) {
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    target.setAttribute("data-ios-local-back-swipe", "true");

    const finishCancel = () => {
      target.style.transition = `transform ${IOS_BACK_SWIPE_CANCEL_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)`;
      target.style.transform = "translate3d(0, 0, 0)";
      target.style.boxShadow = "";
      swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
        resetTargetStyles();
        swipeStateRef.current.resetTimeoutId = null;
      }, IOS_BACK_SWIPE_CANCEL_MS);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || event.touches.length !== 1) {
        return;
      }
      if (
        shouldIgnoreIosBackSwipeStartTarget(event.target, touch.clientX, {
          includeLocalSwipeRoot: false,
        })
      ) {
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
      target.style.transition = "none";
      target.style.transform = "";
      target.style.boxShadow = "";
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (shouldIgnoreIosBackSwipeTarget(event.target, { includeLocalSwipeRoot: false })) {
        return;
      }
      const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
      const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
      swipeStateRef.current.latestDx = dx;

      if (!swipeStateRef.current.horizontalLocked && shouldLockIosBackSwipe(dx, dy)) {
        swipeStateRef.current.horizontalLocked = true;
        target.style.transition = "none";
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
      const progress = Math.min(1, offset / Math.max(window.innerWidth * 0.82, 1));
      target.style.transform = `translate3d(${offset}px, 0, 0)`;
      target.style.boxShadow = `-18px 0 42px rgba(15, 23, 42, ${0.08 + progress * 0.12})`;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches.item(0);
      if (!touch || !swipeStateRef.current.active) {
        return;
      }
      if (shouldIgnoreIosBackSwipeTarget(event.target, { includeLocalSwipeRoot: false })) {
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
        target.style.transition = `transform ${IOS_BACK_SWIPE_COMMIT_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)`;
        target.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
        target.style.boxShadow = "";
        swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
          resetTargetStyles();
          swipeStateRef.current.resetTimeoutId = null;
          onBack();
        }, IOS_BACK_SWIPE_COMMIT_MS);
        return;
      }

      finishCancel();
    };

    target.addEventListener("touchstart", handleTouchStart, { passive: true });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd, { passive: true });
    target.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
      target.removeEventListener("touchcancel", handleTouchEnd);
      target.removeAttribute("data-ios-local-back-swipe");
      if (swipeStateRef.current.resetTimeoutId !== null) {
        window.clearTimeout(swipeStateRef.current.resetTimeoutId);
        swipeStateRef.current.resetTimeoutId = null;
      }
      resetTargetStyles();
    };
  }, [isEnabled, isIosShell, onBack, targetRef]);

  return null;
}
