export const PUBLIC_WEBSITE_SHARED_ROUTE_PATHS = [
  "/",
  "/join-family",
  "/legal",
  "/legal/privacy",
  "/legal/terms",
  "/legal/support",
] as const;

export type PublicWebsiteSharedRoutePath = (typeof PUBLIC_WEBSITE_SHARED_ROUTE_PATHS)[number];

export function isPublicWebsiteSharedRoute(path: string): path is PublicWebsiteSharedRoutePath {
  return (PUBLIC_WEBSITE_SHARED_ROUTE_PATHS as readonly string[]).includes(path);
}
