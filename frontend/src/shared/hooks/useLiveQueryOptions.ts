import { useEffect, useState } from "react";

type LiveQueryOptions = {
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
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return {
    refetchOnWindowFocus: true as const,
    refetchOnReconnect: true as const,
    refetchInterval: isVisible ? intervalMs : false,
    refetchIntervalInBackground: false as const,
  };
}
