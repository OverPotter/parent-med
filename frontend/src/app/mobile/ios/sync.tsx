import { Capacitor } from "@capacitor/core";
import { useEffect, useLayoutEffect } from "react";
import { Keyboard } from "@capacitor/keyboard";
import { useLocation, useNavigationType } from "react-router-dom";
import { detectIosShell } from "@shared/hooks/useIsIosShell";
import { scrollFieldIntoView } from "@shared/utils/focus";

export function IOSRouteSnapshotSync() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    return () => {
      if (navigationType === "REPLACE") {
        return;
      }
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
      const scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      (
        window as Window & {
          __PM_IOS_PREVIOUS_SCREEN_SNAPSHOT?: { html: string; scrollY: number };
        }
      ).__PM_IOS_PREVIOUS_SCREEN_SNAPSHOT = {
        html: clone.outerHTML,
        scrollY,
      };
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
