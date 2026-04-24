export function resolveConcurrentSecureTokenRead(args: {
  startedVersion: number;
  currentVersion: number;
  currentCache: { accessToken: string | null; refreshToken: string | null } | null;
  readTokens: { accessToken: string | null; refreshToken: string | null };
}) {
  const { startedVersion, currentVersion, currentCache, readTokens } = args;
  if (startedVersion !== currentVersion && currentCache) {
    return currentCache;
  }
  return readTokens;
}
