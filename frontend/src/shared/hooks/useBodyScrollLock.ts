import { useEffect } from "react";

type ScrollLockState = {
  count: number;
  scrollY: number;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  bodyOverscrollBehavior: string;
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
};

declare global {
  interface Window {
    __PM_BODY_SCROLL_LOCK__?: ScrollLockState;
  }
}

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const state =
      window.__PM_BODY_SCROLL_LOCK__ ??
      ({
        count: 0,
        scrollY: 0,
        bodyOverflow: "",
        bodyPosition: "",
        bodyTop: "",
        bodyWidth: "",
        bodyOverscrollBehavior: "",
        htmlOverflow: "",
        htmlOverscrollBehavior: "",
      } satisfies ScrollLockState);

    if (state.count === 0) {
      state.scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      state.bodyOverflow = body.style.overflow;
      state.bodyPosition = body.style.position;
      state.bodyTop = body.style.top;
      state.bodyWidth = body.style.width;
      state.bodyOverscrollBehavior = body.style.overscrollBehavior;
      state.htmlOverflow = documentElement.style.overflow;
      state.htmlOverscrollBehavior = documentElement.style.overscrollBehavior;

      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${state.scrollY}px`;
      body.style.width = "100%";
      body.style.overscrollBehavior = "none";
    }

    state.count += 1;
    window.__PM_BODY_SCROLL_LOCK__ = state;

    return () => {
      const currentState = window.__PM_BODY_SCROLL_LOCK__;
      if (!currentState) {
        return;
      }

      currentState.count = Math.max(0, currentState.count - 1);
      if (currentState.count > 0) {
        return;
      }

      documentElement.style.overflow = currentState.htmlOverflow;
      documentElement.style.overscrollBehavior = currentState.htmlOverscrollBehavior;
      body.style.overflow = currentState.bodyOverflow;
      body.style.position = currentState.bodyPosition;
      body.style.top = currentState.bodyTop;
      body.style.width = currentState.bodyWidth;
      body.style.overscrollBehavior = currentState.bodyOverscrollBehavior;
      window.scrollTo({ top: currentState.scrollY, behavior: "auto" });
      delete window.__PM_BODY_SCROLL_LOCK__;
    };
  }, [isLocked]);
}
