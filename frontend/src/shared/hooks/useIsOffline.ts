import { useEffect, useState } from "react";

function getInitialOnlineState() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.onLine === false;
}

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(getInitialOnlineState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOffline;
}
