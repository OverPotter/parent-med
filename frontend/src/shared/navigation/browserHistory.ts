import type { NavigateFunction } from "react-router-dom";

export type BrowserBackPreference = {
  key: string;
  value: unknown;
};

export function hasBrowserBack(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.history.length > 1) {
    return true;
  }

  const historyState = window.history.state;
  if (typeof historyState !== "object" || historyState === null) {
    return false;
  }

  return typeof (historyState as { idx?: unknown }).idx === "number";
}

export function shouldPreferFallbackBack(
  locationState: unknown,
  preference?: BrowserBackPreference
): boolean {
  if (!preference || typeof locationState !== "object" || locationState === null) {
    return false;
  }

  return (locationState as Record<string, unknown>)[preference.key] === preference.value;
}

export function shouldUseBrowserBack(
  locationState?: unknown,
  preference?: BrowserBackPreference
): boolean {
  return hasBrowserBack() && !shouldPreferFallbackBack(locationState, preference);
}

export function navigateBackWithFallback(
  navigate: NavigateFunction,
  fallbackHref: string,
  options?: {
    fallbackReplace?: boolean;
    shouldUseBrowserBack?: boolean;
  }
) {
  if (options?.shouldUseBrowserBack ?? hasBrowserBack()) {
    navigate(-1);
    return;
  }

  navigate(fallbackHref, { replace: options?.fallbackReplace ?? true });
}
