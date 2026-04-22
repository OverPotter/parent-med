export interface StartRouteInputs {
  hasFamily: boolean;
  hasActiveEpisode: boolean;
  canSeeChildren: boolean;
  canSeePillbox: boolean;
  canSeeCabinet: boolean;
}

export function resolveClientStartRoute({
  hasFamily,
  hasActiveEpisode,
  canSeeChildren,
  canSeePillbox,
  canSeeCabinet,
}: StartRouteInputs): string {
  if (!hasFamily) {
    return "/family";
  }
  if (hasActiveEpisode) {
    return "/illnesses/active";
  }
  if (canSeeChildren) {
    return "/children";
  }
  if (canSeePillbox) {
    return "/pillbox";
  }
  if (canSeeCabinet) {
    return "/medicine-cabinet";
  }
  return "/workspace";
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
