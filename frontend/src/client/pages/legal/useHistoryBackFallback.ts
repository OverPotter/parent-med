import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPaywallReturnTo } from "./legalRouteState";
import { markUpgradeDialogReopenPending } from "@client/subscription/upgradeDialogReopen";
import { navigateBackWithFallback, shouldUseBrowserBack } from "@shared/navigation/browserHistory";

export function useHistoryBackFallback(fallbackHref: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = getPaywallReturnTo(location.state);

  return useCallback(() => {
    if (returnTo) {
      markUpgradeDialogReopenPending(returnTo);
      navigate(returnTo, { replace: true });
      return;
    }
    navigateBackWithFallback(navigate, fallbackHref, {
      fallbackReplace: false,
      shouldUseBrowserBack: shouldUseBrowserBack(),
    });
  }, [fallbackHref, navigate, returnTo]);
}
