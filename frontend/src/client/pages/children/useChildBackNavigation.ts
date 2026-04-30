import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  hasBrowserBack,
  shouldPreferFallbackBack,
  shouldUseBrowserBack,
  navigateBackWithFallback,
} from "@shared/navigation/browserHistory";

type ChildBackNavigationOptions = {
  fallbackHref: string;
  underlaySnapshotKey?: string;
  preferFallbackWhenState?: {
    key: string;
    value: unknown;
  };
};

export function useChildBackNavigation({
  fallbackHref,
  underlaySnapshotKey = fallbackHref,
  preferFallbackWhenState,
}: ChildBackNavigationOptions) {
  const location = useLocation();
  const navigate = useNavigate();

  const hasHistoryBack = hasBrowserBack();
  const shouldFallback = shouldPreferFallbackBack(location.state, preferFallbackWhenState);
  const shouldUseHistoryBack = shouldUseBrowserBack(location.state, preferFallbackWhenState);

  const handleBack = useCallback(() => {
    navigateBackWithFallback(navigate, fallbackHref, { shouldUseBrowserBack: shouldUseHistoryBack });
  }, [fallbackHref, navigate, shouldUseHistoryBack]);

  return {
    hasBrowserBack: hasHistoryBack,
    shouldPreferFallbackBack: shouldFallback,
    shouldUseHistoryBack,
    enableLocalSwipe: !shouldUseHistoryBack,
    localUnderlaySnapshotKey: !shouldUseHistoryBack ? underlaySnapshotKey : undefined,
    handleBack,
  };
}
