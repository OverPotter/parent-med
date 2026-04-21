import { Capacitor } from "@capacitor/core";
import { useEffect, useLayoutEffect } from "react";
import { detectIosShell } from "@shared/hooks/useIsIosShell";
import { useAppStore } from "@shared/store/useAppStore";

export function ThemeSync() {
  const effectiveTheme = useAppStore((s) => s.effectiveTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    document.documentElement.style.colorScheme = effectiveTheme;
    const background = effectiveTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
    document.documentElement.style.background = background;
    document.body.style.colorScheme = effectiveTheme;
    document.body.style.background = background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
    document
      .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      ?.setAttribute("content", effectiveTheme === "dark" ? "black-translucent" : "default");
  }, [effectiveTheme]);

  useEffect(() => {
    const syncThemeAfterRestore = () => {
      const background = effectiveTheme === "dark" ? "#1e1b2e" : "#ebe4ff";
      document.documentElement.setAttribute("data-theme", effectiveTheme);
      document.documentElement.style.colorScheme = effectiveTheme;
      document.documentElement.style.background = background;
      document.body.style.colorScheme = effectiveTheme;
      document.body.style.background = background;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
      document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.setAttribute("content", effectiveTheme === "dark" ? "black-translucent" : "default");
    };

    window.addEventListener("pageshow", syncThemeAfterRestore);
    document.addEventListener("visibilitychange", syncThemeAfterRestore);
    return () => {
      window.removeEventListener("pageshow", syncThemeAfterRestore);
      document.removeEventListener("visibilitychange", syncThemeAfterRestore);
    };
  }, [effectiveTheme]);

  return null;
}

export function DisplayModeSync() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const applyDisplayMode = () => {
      const isStandalone =
        mediaQuery.matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      document.documentElement.setAttribute(
        "data-display-mode",
        isStandalone ? "standalone" : "browser"
      );
    };

    applyDisplayMode();
    mediaQuery.addEventListener("change", applyDisplayMode);

    return () => mediaQuery.removeEventListener("change", applyDisplayMode);
  }, []);

  return null;
}

export function RuntimePlatformSync() {
  useEffect(() => {
    const root = document.documentElement;
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isIosShell = detectIosShell();
    root.setAttribute("data-runtime", isNative ? "native" : "web");
    root.setAttribute("data-platform", platform);
    root.setAttribute("data-ios-shell", isIosShell ? "true" : "false");
    return () => {
      root.removeAttribute("data-runtime");
      root.removeAttribute("data-platform");
      root.removeAttribute("data-ios-shell");
    };
  }, []);

  return null;
}

export function IosSafeAreaSync() {
  useLayoutEffect(() => {
    if (!detectIosShell()) {
      return;
    }

    const root = document.documentElement;
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "fixed";
    probe.style.top = "0";
    probe.style.left = "0";
    probe.style.width = "0";
    probe.style.height = "0";
    probe.style.opacity = "0";
    probe.style.pointerEvents = "none";
    probe.style.paddingTop = "env(safe-area-inset-top)";
    probe.style.paddingBottom = "env(safe-area-inset-bottom)";
    document.body.appendChild(probe);

    let rafId = 0;
    let timeoutId: number | null = null;

    const applySafeArea = () => {
      const styles = window.getComputedStyle(probe);
      const top = Number.parseFloat(styles.paddingTop || "0");
      const bottom = Number.parseFloat(styles.paddingBottom || "0");
      root.style.setProperty("--app-safe-top-runtime", `${Math.max(0, top)}px`);
      root.style.setProperty("--app-safe-bottom-runtime", `${Math.max(0, bottom)}px`);
    };

    const scheduleApply = () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      rafId = window.requestAnimationFrame(() => {
        applySafeArea();
        timeoutId = window.setTimeout(applySafeArea, 180);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleApply();
      }
    };

    scheduleApply();
    window.addEventListener("resize", scheduleApply);
    window.addEventListener("pageshow", scheduleApply);
    window.addEventListener("orientationchange", scheduleApply);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", scheduleApply);
      window.removeEventListener("pageshow", scheduleApply);
      window.removeEventListener("orientationchange", scheduleApply);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      probe.remove();
    };
  }, []);

  return null;
}
