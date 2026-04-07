export type CookieConsentDecision = "accepted" | "rejected";

const STORAGE_KEY = "pillpath_cookie_consent_v1";

export function getCookieConsentDecision(): CookieConsentDecision | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setCookieConsentDecision(decision: CookieConsentDecision): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, decision);
  window.dispatchEvent(new CustomEvent("cookie-consent:changed", { detail: decision }));
}
