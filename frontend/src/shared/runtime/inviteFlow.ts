export const PENDING_FAMILY_INVITE_TOKEN_STORAGE_KEY = "pm_pending_family_invite_token_v1";
export const PENDING_FAMILY_INVITE_POST_INSTALL_KEY = "pm_pending_family_invite_post_install_v1";
export const PENDING_FAMILY_INVITE_APP_STORE_REDIRECT_KEY =
  "pm_pending_family_invite_app_store_redirect_v1";

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
