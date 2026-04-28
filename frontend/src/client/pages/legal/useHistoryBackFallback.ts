import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useHistoryBackFallback(fallbackHref: string) {
  const navigate = useNavigate();

  return useCallback(() => {
    const historyState = typeof window !== "undefined" ? window.history.state : null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallbackHref);
  }, [fallbackHref, navigate]);
}
