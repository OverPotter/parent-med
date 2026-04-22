export interface StartRouteInputs {
  hasFamily: boolean;
  hasChildren: boolean;
  hasActiveEpisode: boolean;
}

export function resolveClientStartRoute({
  hasFamily,
  hasChildren,
  hasActiveEpisode,
}: StartRouteInputs): string {
  if (!hasFamily) {
    return "/family";
  }
  if (!hasChildren) {
    return "/children";
  }
  if (hasActiveEpisode) {
    return "/illnesses/active";
  }
  return "/children";
}

export interface BootSplashInputs {
  authToken: string | null;
  accountId: string | null;
  currentFamilyId: string | null;
  familiesCount: number;
  isFamiliesLoading: boolean;
  isFamiliesSuccess: boolean;
  isDeferredBootReady: boolean;
  isDeferredShellWorkReady: boolean;
  isFirstNativeLaunch: boolean;
}

export function shouldShowClientBootSplash({
  authToken,
  accountId,
  currentFamilyId,
  familiesCount,
  isFamiliesLoading,
  isFamiliesSuccess,
  isDeferredBootReady,
  isDeferredShellWorkReady,
  isFirstNativeLaunch,
}: BootSplashInputs): boolean {
  const shouldBlockOnFamiliesBootstrap = Boolean(
    authToken &&
      accountId &&
      !currentFamilyId &&
      (isFamiliesLoading || (!isFamiliesSuccess && familiesCount === 0))
  );
  const isCurrentFamilyResolving = Boolean(
    !shouldBlockOnFamiliesBootstrap && isFamiliesSuccess && familiesCount > 0 && !currentFamilyId
  );

  return Boolean(authToken && accountId) &&
    (!isDeferredBootReady ||
      shouldBlockOnFamiliesBootstrap ||
      isCurrentFamilyResolving ||
      (isFirstNativeLaunch && !isDeferredShellWorkReady));
}
