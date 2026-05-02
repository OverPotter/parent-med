import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

type LiveQueryOptions = {
  staleTime: number;
  refetchOnMount: "always";
  refetchOnWindowFocus: true;
  refetchOnReconnect: true;
  refetchInterval: number | false;
  refetchIntervalInBackground: false;
};

export function useLiveQueryOptions(intervalMs = 15000): LiveQueryOptions {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === "undefined" ? true : document.visibilityState === "visible"
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    let removeAppStateListener: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        setIsVisible(isActive);
      }).then((listener) => {
        removeAppStateListener = () => {
          void listener.remove();
        };
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeAppStateListener?.();
    };
  }, []);

  return {
    staleTime: intervalMs,
    refetchOnMount: "always" as const,
    refetchOnWindowFocus: true as const,
    refetchOnReconnect: true as const,
    refetchInterval: isVisible ? intervalMs : false,
    refetchIntervalInBackground: false as const,
  };
}
