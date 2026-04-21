export const NATIVE_APP_BASE_URL = "pillpath://localhost";
export const NATIVE_APP_MARKETING_FLAG = "openInApp";

export function buildNativeAppUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${NATIVE_APP_BASE_URL}${normalizedPath}`;
}
