import { Capacitor } from "@capacitor/core";
import { useEffect, useLayoutEffect } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { useLocation, useNavigationType } from "react-router-dom";
import { detectIosShell } from "@shared/hooks/useIsIosShell";
import { scrollFieldIntoView } from "@shared/utils/focus";
import {
  type IOSScreenSnapshot,
  setIosPreviousScreenSnapshot,
  setIosRouteSnapshot,
} from "./snapshotState";

export function IOSRouteSnapshotSync() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    const root = document.documentElement;
    let frameId: number | null = null;
    let timeoutId: number | null = null;

    const captureSnapshot = (updatePrevious = false) => {
      const frame = document.querySelector(".app-shell-frame");
      if (!(frame instanceof HTMLElement)) {
        return;
      }
      const clone = frame.cloneNode(true);
      if (!(clone instanceof HTMLElement)) {
        return;
      }
      clone.classList.remove("app-shell-frame");
      clone.classList.add("app-shell-auth", "ios-back-swipe-underlay-screen__content");
      clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      const bottomNav = clone.querySelector(".app-bottom-nav-wrap");
      const bottomNavHtml = bottomNav instanceof HTMLElement ? bottomNav.outerHTML : "";
      bottomNav?.remove();
      const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const snapshot: IOSScreenSnapshot = {
        html: clone.outerHTML,
        bottomNavHtml,
        scrollY,
      };
      setIosRouteSnapshot(`${location.pathname}${location.search}`, snapshot);
      if (updatePrevious && root.getAttribute("data-ios-back-swipe-active") !== "true") {
        setIosPreviousScreenSnapshot(snapshot);
      }
    };

    const scheduleSnapshotCapture = () => {
      if (frameId !== null || timeoutId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        timeoutId = window.setTimeout(() => {
          timeoutId = null;
          captureSnapshot();
        }, 40);
      });
    };

    captureSnapshot(false);

    const frame = document.querySelector(".app-shell-frame");
    const observer =
      frame instanceof HTMLElement
        ? new MutationObserver(() => {
            scheduleSnapshotCapture();
          })
        : null;
    if (observer && frame instanceof HTMLElement) {
      observer.observe(frame, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    window.addEventListener("resize", scheduleSnapshotCapture);
    window.addEventListener("load", scheduleSnapshotCapture);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", scheduleSnapshotCapture);
      window.removeEventListener("load", scheduleSnapshotCapture);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      captureSnapshot(true);
    };
  }, [location.pathname, location.search, navigationType]);

  return null;
}

export function IOSKeyboardViewportSync() {
  useEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    const html = document.documentElement;
    const setKeyboardState = (isOpen: boolean, keyboardHeight = 0) => {
      html.toggleAttribute("data-keyboard-open", isOpen);
      html.style.setProperty("--app-keyboard-height", `${Math.max(0, keyboardHeight)}px`);
    };

    const handleFocusIn = (event: FocusEvent) => {
      scrollFieldIntoView(event.target, { delayMs: 140, block: "center" });
    };

    const willShow = Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardState(true, info.keyboardHeight);
      scrollFieldIntoView(document.activeElement, { delayMs: 120, block: "center" });
    });
    const didShow = Keyboard.addListener("keyboardDidShow", (info) => {
      setKeyboardState(true, info.keyboardHeight);
      scrollFieldIntoView(document.activeElement, { delayMs: 40, block: "center" });
    });
    const willHide = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardState(false, 0);
    });
    const didHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardState(false, 0);
    });

    window.addEventListener("focusin", handleFocusIn);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      void Promise.all([willShow, didShow, willHide, didHide]).then((listeners) => {
        listeners.forEach((listener) => {
          void listener.remove();
        });
      });
      document.documentElement.removeAttribute("data-keyboard-open");
      document.documentElement.style.removeProperty("--app-keyboard-height");
    };
  }, []);

  return null;
}

export function IOSLandingGestureGuard() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const shouldLockHorizontal = location.pathname === "/";
    html.classList.toggle("ios-lock-horizontal", shouldLockHorizontal);
    body.classList.toggle("ios-lock-horizontal", shouldLockHorizontal);

    return () => {
      html.classList.remove("ios-lock-horizontal");
      body.classList.remove("ios-lock-horizontal");
    };
  }, [location.pathname]);

  return null;
}
