export function resolveClientStartRoute({ hasFamily, hasChildren, hasActiveEpisode, }) {
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
export function shouldShowClientBootSplash({ authToken, accountId, currentFamilyId, familiesCount, isFamiliesLoading, isFamiliesSuccess, isDeferredBootReady, isDeferredShellWorkReady, isFirstNativeLaunch, }) {
    const shouldBlockOnFamiliesBootstrap = Boolean(authToken &&
        accountId &&
        !currentFamilyId &&
        (isFamiliesLoading || (!isFamiliesSuccess && familiesCount === 0)));
    const isCurrentFamilyResolving = Boolean(!shouldBlockOnFamiliesBootstrap && isFamiliesSuccess && familiesCount > 0 && !currentFamilyId);
    return Boolean(authToken && accountId) &&
        (!isDeferredBootReady ||
            shouldBlockOnFamiliesBootstrap ||
            isCurrentFamilyResolving ||
            (isFirstNativeLaunch && !isDeferredShellWorkReady));
}
