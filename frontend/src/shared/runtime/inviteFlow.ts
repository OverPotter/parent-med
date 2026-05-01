export const PENDING_FAMILY_INVITE_POST_INSTALL_KEY = "pm_pending_family_invite_post_install_v1";
export const PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY = "pm_pending_family_invite_route_v1";
export const PENDING_POST_INSTALL_APP_ROUTE_STORAGE_KEY = "pm_pending_post_install_app_route_v1";
export type InviteAuthIntent = "login" | "register";

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

export function buildAuthLoginRoute(): string {
  return "/auth?mode=login";
}

export function buildJoinFamilyRouteFromHandoff(handoffId: string | null | undefined): string {
  const normalizedHandoffId = handoffId?.trim() ?? "";
  return normalizedHandoffId
    ? `/join-family?hid=${encodeURIComponent(normalizedHandoffId)}`
    : "/join-family";
}

export function appendInviteAuthIntent(
  route: string | null | undefined,
  intent: InviteAuthIntent | null | undefined
): string | null {
  const normalizedRoute = normalizeInviteRoute(route);
  const normalizedIntent = intent?.trim() ?? "";
  if (!normalizedRoute || (normalizedIntent !== "login" && normalizedIntent !== "register")) {
    return normalizedRoute;
  }

  const parsed = new URL(normalizedRoute, "https://pillpath.local");
  parsed.searchParams.set("intent", normalizedIntent);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function buildJoinFamilyHandoffRoute(handoffId: string | null | undefined): string {
  const normalizedHandoffId = handoffId?.trim() ?? "";
  return normalizedHandoffId
    ? `/join-family-handoff?hid=${encodeURIComponent(normalizedHandoffId)}`
    : "/join-family-handoff";
}

export function isInviteRoute(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    url === "/join-family" ||
    url.startsWith("/join-family?") ||
    url === "/join-family-handoff" ||
    url.startsWith("/join-family-handoff?")
  );
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
    if (!isInviteRoute(route)) {
      return null;
    }
    return getInviteTokenFromRawRoute(route) ||
      getInviteHandoffIdFromRawRoute(route) ||
      isDevLatestInviteRoute(route)
      ? route
      : null;
  } catch {
    if (!isInviteRoute(url)) {
      return null;
    }
    return getInviteTokenFromRawRoute(url) ||
      getInviteHandoffIdFromRawRoute(url) ||
      isDevLatestInviteRoute(url)
      ? url
      : null;
  }
}

export function getInviteTokenFromRoute(url: string | null | undefined): string | null {
  const route = normalizeInviteRoute(url);
  if (!route) {
    return null;
  }

  return getInviteTokenFromRawRoute(route);
}

export function getInviteHandoffIdFromRoute(url: string | null | undefined): string | null {
  const route = normalizeInviteRoute(url);
  if (!route) {
    return null;
  }

  return getInviteHandoffIdFromRawRoute(route);
}

export function getInviteAuthIntentFromRoute(
  url: string | null | undefined
): InviteAuthIntent | null {
  const route = normalizeInviteRoute(url);
  if (!route) {
    return null;
  }

  try {
    const parsed = new URL(route, "https://pillpath.local");
    const intent = parsed.searchParams.get("intent")?.trim() ?? "";
    return intent === "login" || intent === "register" ? intent : null;
  } catch {
    return null;
  }
}

function normalizePostInstallAppRoute(url: string | null | undefined): string | null {
  const inviteRoute = normalizeInviteRoute(url);
  if (inviteRoute) {
    return inviteRoute;
  }

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url, "https://pillpath.local");
    if (parsed.pathname !== "/auth" || parsed.searchParams.get("mode") !== "login") {
      return null;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function getInviteTokenFromRawRoute(url: string): string | null {
  try {
    const parsed = new URL(url, "https://pillpath.local");
    if (parsed.pathname !== "/join-family") {
      return null;
    }
    return normalizeInviteToken(parsed.searchParams.get("token"));
  } catch {
    return null;
  }
}

function getInviteHandoffIdFromRawRoute(url: string): string | null {
  try {
    const parsed = new URL(url, "https://pillpath.local");
    if (parsed.pathname === "/join-family") {
      return normalizeInviteToken(parsed.searchParams.get("hid"));
    }
    if (parsed.pathname !== "/join-family-handoff") {
      return null;
    }
    return normalizeInviteToken(parsed.searchParams.get("hid"));
  } catch {
    return null;
  }
}

function isDevLatestInviteRoute(url: string): boolean {
  try {
    const parsed = new URL(url, "https://pillpath.local");
    return parsed.pathname === "/join-family" && parsed.searchParams.get("dev-latest") === "1";
  } catch {
    return false;
  }
}

export function resolveInviteAwareAuthSuccessPath(params: {
  requestedNext?: string | null | undefined;
  pendingInviteRoute?: string | null | undefined;
  defaultPath: string;
}): string {
  if (params.requestedNext !== "invite") {
    return params.defaultPath;
  }

  const pendingInviteRoute = normalizeInviteRoute(params.pendingInviteRoute);
  if (pendingInviteRoute) {
    return pendingInviteRoute;
  }

  return params.defaultPath;
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
  return normalizedRoute;
}

export function readPendingPostInstallAppRoute(storage?: MinimalStorage | null): string | null {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return null;
  }
  return normalizePostInstallAppRoute(
    resolvedStorage.getItem(PENDING_POST_INSTALL_APP_ROUTE_STORAGE_KEY)
  );
}

export function persistPendingPostInstallAppRoute(
  route: string | null | undefined,
  storage?: MinimalStorage | null
): string | null {
  const normalizedRoute = normalizePostInstallAppRoute(route);
  const resolvedStorage = getStorage(storage);
  if (!normalizedRoute || !resolvedStorage) {
    return null;
  }

  resolvedStorage.setItem(PENDING_POST_INSTALL_APP_ROUTE_STORAGE_KEY, normalizedRoute);
  return normalizedRoute;
}

export function clearPendingPostInstallAppRoute(storage?: MinimalStorage | null) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }
  resolvedStorage.removeItem(PENDING_POST_INSTALL_APP_ROUTE_STORAGE_KEY);
}

export function clearPendingFamilyInviteRoute(storage?: MinimalStorage | null) {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    return;
  }
  resolvedStorage.removeItem(PENDING_FAMILY_INVITE_ROUTE_STORAGE_KEY);
  resolvedStorage.removeItem(PENDING_FAMILY_INVITE_POST_INSTALL_KEY);
  clearPendingPostInstallAppRoute(resolvedStorage);
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
