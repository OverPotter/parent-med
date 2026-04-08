import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/hooks/useI18n";

type ConnectionWithEffectiveType = {
  effectiveType?: string;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function getEffectiveConnectionType(): string | null {
  const nav = navigator as Navigator & {
    connection?: ConnectionWithEffectiveType;
    mozConnection?: ConnectionWithEffectiveType;
    webkitConnection?: ConnectionWithEffectiveType;
  };
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  return connection?.effectiveType ?? null;
}

function isSlowConnection(type: string | null): boolean {
  return type === "slow-2g" || type === "2g";
}

export function NetworkStatusBanner() {
  const { language } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [effectiveType, setEffectiveType] = useState<string | null>(getEffectiveConnectionType());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleConnectionChange = () => setEffectiveType(getEffectiveConnectionType());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const nav = navigator as Navigator & {
      connection?: ConnectionWithEffectiveType;
      mozConnection?: ConnectionWithEffectiveType;
      webkitConnection?: ConnectionWithEffectiveType;
    };
    const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
    connection?.addEventListener?.("change", handleConnectionChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      connection?.removeEventListener?.("change", handleConnectionChange);
    };
  }, []);

  const mode = useMemo<"offline" | "slow" | null>(() => {
    if (!isOnline) {
      return "offline";
    }
    if (isSlowConnection(effectiveType)) {
      return "slow";
    }
    return null;
  }, [effectiveType, isOnline]);

  if (!mode) {
    return null;
  }

  const text =
    mode === "offline"
      ? language === "ru"
        ? "Нет сети. Работаем в офлайн-режиме, данные обновятся при подключении."
        : "No connection. Working in offline mode, data will sync when back online."
      : language === "ru"
        ? "Сеть медленная. Обновления могут загружаться дольше обычного."
        : "Connection is slow. Updates may take longer than usual.";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[120] px-3 sm:px-4">
      <div
        className={[
          "mx-auto w-full max-w-5xl rounded-2xl border px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm",
          mode === "offline"
            ? "border-amber-500/45 bg-amber-500/20 text-amber-900 dark:text-amber-100"
            : "border-blue-500/35 bg-blue-500/18 text-blue-900 dark:text-blue-100",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {text}
      </div>
    </div>
  );
}
