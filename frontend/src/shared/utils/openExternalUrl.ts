import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { appLog } from "./appLog";

export async function openExternalUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return;
  }

  const isAbsoluteHttpUrl = /^https?:\/\//i.test(trimmedUrl);
  const isInAppPath = trimmedUrl.startsWith("/");

  if (isInAppPath) {
    window.location.assign(trimmedUrl);
    return;
  }

  if (Capacitor.isNativePlatform() && isAbsoluteHttpUrl) {
    try {
      await Browser.open({ url: trimmedUrl });
      return;
    } catch (error) {
      appLog.warn("Browser.open failed, falling back to location.assign", {
        url: trimmedUrl,
        error,
      });
      window.location.assign(trimmedUrl);
      return;
    }
  }

  if (isAbsoluteHttpUrl) {
    window.open(trimmedUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const resolvedUrl = new URL(trimmedUrl, window.location.href).toString();
  if (Capacitor.isNativePlatform()) {
    window.location.assign(resolvedUrl);
    return;
  }

  window.open(resolvedUrl, "_blank", "noopener,noreferrer");
}
