import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchFamilies } from "@shared/api/families";
import { fetchActiveIllnessEpisodeByChildId } from "@shared/api/illnessEpisodes";
import {
  canViewAnyChildren,
  canViewCabinet,
  canViewPillbox,
} from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { resolveClientStartRoute } from "@client/startup/startupDecisions";

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
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);

  const { data: families = [], isLoading: isFamiliesLoading } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
    retry: false,
  });

  const familyId = currentFamilyId ?? families[0]?.id ?? null;
  const hasFamily = Boolean(familyId);
  const canSeeChildren = canViewAnyChildren(accountFamilyRole, accountAccessPolicy);
  const canSeePillbox = canViewPillbox(accountFamilyRole, accountAccessPolicy);
  const canSeeCabinet = canViewCabinet(accountFamilyRole, accountAccessPolicy);
  const { data: familyChildren = [], isLoading: isChildrenLoading } = useQuery({
    queryKey: ["children", familyId],
    queryFn: () => fetchChildrenByFamilyId(familyId!),
    enabled: Boolean(familyId && canSeeChildren),
  });
  const activeEpisodeQueries = useQueries({
    queries: familyChildren.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: Boolean(familyId && canSeeChildren),
      staleTime: 30 * 1000,
    })),
  });
  const isActiveEpisodeResolving = Boolean(familyId && canSeeChildren) && (
    isChildrenLoading ||
    activeEpisodeQueries.some((query) => query.isLoading || query.isPending)
  );
  const hasChildren = familyChildren.length > 0;
  const hasActiveEpisode = activeEpisodeQueries.some((query) => Boolean(query.data));

  const startRoute = resolveClientStartRoute({
    hasFamily,
    hasActiveEpisode,
    canSeeChildren,
    canSeePillbox,
    canSeeCabinet,
  });

  return {
    isResolving: isFamiliesLoading || isActiveEpisodeResolving,
    startRoute,
    hasFamily,
    hasChildren,
    hasActiveEpisode,
  };
}
