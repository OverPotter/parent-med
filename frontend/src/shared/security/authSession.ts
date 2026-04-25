import { Capacitor } from "@capacitor/core";

export const COOKIE_SESSION_MARKER = "__pm_cookie_session__";

export function isNativeClientRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isCookieSessionMarker(value: string | null | undefined): boolean {
  return value === COOKIE_SESSION_MARKER;
}

export function buildClientSessionTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): { accessToken: string | null; refreshToken: string | null } {
  if (isNativeClientRuntime()) {
    return {
      accessToken: tokens.accessToken ?? null,
      refreshToken: tokens.refreshToken ?? null,
    };
  }

  return {
    accessToken: COOKIE_SESSION_MARKER,
    refreshToken: COOKIE_SESSION_MARKER,
  };
}

export function sanitizeBearerToken(token: string | null | undefined): string | null {
  if (!token || isCookieSessionMarker(token)) {
    return null;
  }
  return token;
}

export function sanitizeRefreshToken(token: string | null | undefined): string | null {
  if (!token || isCookieSessionMarker(token)) {
    return null;
  }
  return token;
}
