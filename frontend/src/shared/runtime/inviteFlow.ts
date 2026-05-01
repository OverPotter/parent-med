export const PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY = "pm_pending_family_invite_token_v1";
export const PENDING_FAMILY_INVITE_POST_INSTALL_KEY = "pm_pending_family_invite_post_install_v1";
export const PENDING_FAMILY_INVITE_APP_STORE_REDIRECT_KEY =
  "pm_pending_family_invite_app_store_redirect_v1";
export const PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY = "pm_pending_family_invite_route_v1";

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function normalizeInviteToken(token: string | null | undefined): string | null {
  const normalizedToken = token?.trim() ?? "";
  return normalizedToken ? normalizedToken : null;
}

function getStorage(storage?: MinimalStorage | null): MinimalStorage | null {
  if (storage) {
    return storage;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function buildJoinFamilyRoute(token: string | null | undefined): string {
  const normalizedToken = token?.trim() ?? "";
  return normalizedToken
    ? `/join-family?token=${encodeURIComponent(normalizedToken)}`
    : "/join-family";
}

export function isInviteRoute(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return url === "/join-family" || url.startsWith("/join-family?");
}

export function shouldOpenNativeRouteWithoutSession(url: string | null | undefined): boolean {
  return isInviteRoute(url);
}

export function normalizeInviteRoute(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url, "https://pillpath.local");
    const route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return isInviteRoute(route) ? route : null;
  } catch {
    return isInviteRoute(url) ? url : null;
  }
}

export function getInviteTokenFromRoute(url: string | null | undefined): string | null {
  const route = normalizeInviteRoute(url);
  if (!route) {
    return null;
  }

  try {
    const parsed = new URL(route, "https://pillpath.local");
    return normalizeInviteToken(parsed.searchParams.get("token"));
  } catch {
    return null;
  }
}

export function readPendingFamilyInviteRoute(storage?: MinimalStorage | null): string | null {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return null;
  }
  return normalizeInviteRoute(resolvedStorage.getItem(PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY));
}

export function persistPendingFamilyInviteRoute(
  route: string | null | undefined,
  storage?: MinimalStorage | null
): string | null {
  const normalizedRoute = normalizeInviteRoute(route);
  const resolvedStorage = getStorage(storage);
  if (!normalizedRoute || !resolvedStorage) {
    return null;
  }

  resolvedStorage.setItem(PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY, normalizedRoute);
  const inviteToken = getInviteTokenFromRoute(normalizedRoute);
  if (inviteToken) {
    resolvedStorage.setItem(PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY, inviteToken);
  }
  return normalizedRoute;
}

export function clearPendingFamilyInviteRoute(storage?: MinimalStorage | null) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }
  resolvedStorage.removeItem(PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY);
  resolvedStorage.removeItem(PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY);
}

export function resolveInviteAwareSignedOutPath(params: {
  currentUrl: string | null | undefined;
  defaultPath: string;
  pendingInviteRoute?: string | null | undefined;
}): string {
  const currentInviteRoute = normalizeInviteRoute(params.currentUrl);
  if (currentInviteRoute) {
    return currentInviteRoute;
  }

  const pendingInviteRoute = normalizeInviteRoute(params.pendingInviteRoute);
  if (pendingInviteRoute) {
    return pendingInviteRoute;
  }

  return params.defaultPath;
}
