import { useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { useAppStore } from "@shared/store/useAppStore";

interface ClientStartRouteResult {
  isResolving: boolean;
  startRoute: string;
  hasFamily: boolean;
  hasChildren: boolean;
  hasActiveEpisode: boolean;
}

export function useClientStartRoute(): ClientStartRouteResult {
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);

  const { data: families = [], isLoading: isFamiliesLoading } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const familyId = currentFamilyId ?? families[0]?.id ?? null;

  const { data: children = [], isLoading: isChildrenLoading } = useQuery({
    queryKey: ["children", familyId],
    queryFn: () => fetchChildrenByFamilyId(familyId!),
    enabled: !!familyId,
  });

  const hasFamily = Boolean(familyId);
  const hasChildren = children.length > 0;
  const hasActiveEpisode = false;

  let startRoute = "/family";
  if (hasFamily && !hasChildren) {
    startRoute = "/children";
  } else if (hasFamily) {
    startRoute = "/children";
  }

  return {
    isResolving: isFamiliesLoading || (hasFamily && isChildrenLoading),
    startRoute,
    hasFamily,
    hasChildren,
    hasActiveEpisode,
  };
}
