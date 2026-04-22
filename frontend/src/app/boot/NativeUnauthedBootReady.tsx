import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "@shared/store/useAppStore";

export function NativeUnauthedBootReady() {
  const authToken = useAppStore((s) => s.authToken);
  const accountId = useAppStore((s) => s.accountId);

  useEffect(() => {
    if (
      !Capacitor.isNativePlatform() ||
      Capacitor.getPlatform() !== "ios" ||
      authToken ||
      accountId ||
      typeof window === "undefined"
    ) {
      return;
    }

    const bootWindow = window as Window & { __PM_BOOT_READY?: boolean };
    if (bootWindow.__PM_BOOT_READY) {
      return;
    }

    const releaseBootSplash = () => {
      if (bootWindow.__PM_BOOT_READY) {
        return;
      }
      bootWindow.__PM_BOOT_READY = true;
      window.dispatchEvent(new Event("app:boot-ready"));
    };

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        releaseBootSplash();
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [accountId, authToken]);

  return null;
}
