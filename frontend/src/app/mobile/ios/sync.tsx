import { Capacitor } from "@capacitor/core";
import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { detectIosShell } from "@shared/hooks/useIsIosShell";

export function IOSRouteSnapshotSync() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return;
    }

    return () => {
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
      (
        window as Window & { __PM_IOS_PREVIOUS_SCREEN_HTML?: string }
      ).__PM_IOS_PREVIOUS_SCREEN_HTML = clone.outerHTML;
    };
  }, [location.pathname, location.search]);

  return null;
}

export function IOSKeyboardViewportSync() {
  useEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    return () => {
      document.documentElement.removeAttribute("data-keyboard-open");
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
