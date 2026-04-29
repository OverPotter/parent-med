import { useEffect, useRef, useState, type TouchEvent } from "react";

type UseSwipeToDismissSheetArgs = {
  isOpen: boolean;
  onDismiss: () => void;
  scrollRef: React.RefObject<HTMLElement>;
};

const DISMISS_DISTANCE_PX = 78;
const DISMISS_ANIMATION_MS = 300;

function getDismissTravelDistance() {
  if (typeof window === "undefined") {
    return 720;
  }
  return Math.max(window.innerHeight, 720);
}

export function useSwipeToDismissSheet({
  isOpen,
  onDismiss,
  scrollRef,
}: UseSwipeToDismissSheetArgs) {
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const [isSheetDismissAnimating, setIsSheetDismissAnimating] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSheetOffsetY(0);
    setIsSheetDismissAnimating(false);
    swipeStartRef.current = null;

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch || scrollRef.current?.scrollTop) {
      swipeStartRef.current = null;
      return;
    }
    setIsSheetDismissAnimating(false);
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    const touch = event.touches[0];
    if (!start || !touch || (scrollRef.current?.scrollTop ?? 0) > 0) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = touch.clientY - start.y;
    if (deltaY <= 0 || deltaY < deltaX * 1.1) {
      return;
    }

    setSheetOffsetY(Math.min(Math.max(deltaY, 0), getDismissTravelDistance()));
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) {
      return;
    }

    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = touch.clientY - start.y;
    const shouldDismiss = deltaY >= DISMISS_DISTANCE_PX && deltaY >= deltaX * 1.05;
    setIsSheetDismissAnimating(true);

    if (!shouldDismiss) {
      setSheetOffsetY(0);
      return;
    }

    setSheetOffsetY(getDismissTravelDistance());
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setSheetOffsetY(0);
      setIsSheetDismissAnimating(false);
      onDismiss();
    }, DISMISS_ANIMATION_MS);
  };

  return {
    sheetOffsetY,
    isSheetDismissAnimating,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
