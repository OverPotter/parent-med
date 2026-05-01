export const NATIVE_APP_BASE_URL = "pillpath://localhost";
export const NATIVE_APP_MARKETING_FLAG = "openInApp";
export const APPLE_APP_STORE_URL_PREFIX = "https://apps.apple.com/app/id";

export function buildNativeAppUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${NATIVE_APP_BASE_URL}${normalizedPath}`;
}

export function getSafeNativeMarketingUrl(rawUrl: string | null | undefined) {
  const candidate = rawUrl?.trim();
  if (!candidate) {
    return null;
  }

  return candidate.startsWith(`${NATIVE_APP_BASE_URL}/`) ? candidate : null;
}

function normalizeAppStoreId(rawId: string | null | undefined): string {
  const candidate = rawId?.trim() ?? "";
  return /^\d+$/.test(candidate) ? candidate : "";
}

export function buildAppStoreUrlFromId(appStoreId: string | null | undefined): string {
  const normalizedId = normalizeAppStoreId(appStoreId);
  return normalizedId ? `${APPLE_APP_STORE_URL_PREFIX}${normalizedId}` : "";
}

export function getAppStoreUrl() {
  const configured = import.meta.env.VITE_APP_STORE_URL?.trim() ?? "";
  if (/^https?:\/\//i.test(configured)) {
    return configured;
  }
  return buildAppStoreUrlFromId(import.meta.env.VITE_APP_STORE_ID);
}
