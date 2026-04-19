import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
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

  const activeEpisodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id, "start-route"],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!familyId && !!child.id,
      staleTime: 15_000,
    })),
  });

  const hasFamily = Boolean(familyId);
  const hasChildren = children.length > 0;
  const hasActiveEpisode = activeEpisodeQueries.some((query) => Boolean(query.data));
  const isActiveEpisodeLoading =
    hasChildren && activeEpisodeQueries.some((query) => query.isLoading || query.isPending);

  let startRoute = "/family";
  if (hasFamily && !hasChildren) {
    startRoute = "/children";
  } else if (hasActiveEpisode) {
    startRoute = "/illnesses/active";
  } else if (hasFamily) {
    startRoute = "/children";
  }

  return {
    isResolving: isFamiliesLoading || (hasFamily && (isChildrenLoading || isActiveEpisodeLoading)),
    startRoute,
    hasFamily,
    hasChildren,
    hasActiveEpisode,
  };
}
