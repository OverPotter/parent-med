import { useRef } from "react";
import type { RefObject } from "react";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";

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

  if (!isEnabled || !isIosShell) {
    return null;
  }

  const resetTargetStyles = () => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    target.style.transition = "";
    target.style.transform = "";
    target.style.boxShadow = "";
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 28,
        zIndex: 2,
        touchAction: "pan-y",
      }}
      onTouchStart={(event) => {
        const touch = event.touches.item(0);
        if (!touch) {
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
        const target = targetRef.current;
        if (target) {
          target.style.transition = "none";
        }
      }}
      onTouchMove={(event) => {
        const touch = event.touches.item(0);
        if (!touch || !swipeStateRef.current.active) {
          return;
        }
        const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
        const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
        swipeStateRef.current.latestDx = dx;
        if (!swipeStateRef.current.horizontalLocked && dx >= 18 && dx >= dy * 1.08) {
          swipeStateRef.current.horizontalLocked = true;
        }
        if (dy > (swipeStateRef.current.horizontalLocked ? 132 : 84)) {
          swipeStateRef.current.active = false;
          const target = targetRef.current;
          if (target) {
            target.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
            target.style.transform = "translate3d(0, 0, 0)";
            target.style.boxShadow = "";
            swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
              resetTargetStyles();
              swipeStateRef.current.resetTimeoutId = null;
            }, 280);
          }
          return;
        }
        if (!swipeStateRef.current.horizontalLocked) {
          return;
        }
        const previousOffset = swipeStateRef.current.renderedDx;
        const targetOffset = Math.min(dx, window.innerWidth);
        const offset =
          targetOffset >= previousOffset
            ? targetOffset
            : previousOffset + (targetOffset - previousOffset) * 0.38;
        swipeStateRef.current.renderedDx = Math.max(0, offset);
        const progress = Math.min(1, offset / Math.max(window.innerWidth, 1));
        const target = targetRef.current;
        if (target) {
          target.style.transform = `translate3d(${offset}px, 0, 0)`;
          target.style.boxShadow = `-18px 0 42px rgba(15, 23, 42, ${0.1 + progress * 0.14})`;
        }
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches.item(0);
        if (!touch || !swipeStateRef.current.active) {
          return;
        }
        swipeStateRef.current.active = false;
        const dx = Math.max(0, touch.clientX - swipeStateRef.current.startX);
        const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
        const canCommit =
          dx >= 40 &&
          (swipeStateRef.current.horizontalLocked || (dy <= 88 && dy <= dx * 1.35));
        const target = targetRef.current;

        if (canCommit) {
          if (target) {
            target.style.transition = "transform 240ms cubic-bezier(0.16, 1, 0.3, 1)";
            target.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
            target.style.boxShadow = "";
          }
          swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
            resetTargetStyles();
            swipeStateRef.current.resetTimeoutId = null;
            onBack();
          }, 240);
          return;
        }

        if (target) {
          target.style.transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
          target.style.transform = "translate3d(0, 0, 0)";
          target.style.boxShadow = "";
          swipeStateRef.current.resetTimeoutId = window.setTimeout(() => {
            resetTargetStyles();
            swipeStateRef.current.resetTimeoutId = null;
          }, 280);
        }
      }}
    />
  );
}
