import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export function detectIosShell(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    return true;
  }

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const ua = nav.userAgent.toLowerCase();
  const isIosDevice =
    /iphone|ipad|ipod/.test(ua) || (ua.includes("macintosh") && (nav.maxTouchPoints ?? 0) > 1);

  if (!isIosDevice) {
    return false;
  }

  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function useIsIosShell() {
  const [isIosShell, setIsIosShell] = useState(detectIosShell);

  useEffect(() => {
    const sync = () => setIsIosShell(detectIosShell());
    const displayModeMedia = window.matchMedia("(display-mode: standalone)");

    sync();
    displayModeMedia.addEventListener("change", sync);
    window.addEventListener("resize", sync);

    return () => {
      displayModeMedia.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return isIosShell;
}
