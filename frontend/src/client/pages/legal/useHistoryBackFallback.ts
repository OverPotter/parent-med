import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPaywallReturnTo } from "./legalRouteState";
import { markUpgradeDialogReopenPending } from "@client/subscription/upgradeDialogReopen";

export function useHistoryBackFallback(fallbackHref: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getPaywallReturnTo(location.state);

  useEffect(() => {
    if (!returnTo || typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      markUpgradeDialogReopenPending(returnTo);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [returnTo]);

  return useCallback(() => {
    if (returnTo) {
      markUpgradeDialogReopenPending(returnTo);
      navigate(returnTo, { replace: true });
      return;
    }
    const historyState = typeof window !== "undefined" ? window.history.state : null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallbackHref);
  }, [fallbackHref, navigate, returnTo]);
}
