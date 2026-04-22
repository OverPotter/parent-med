import { useQuery } from "@tanstack/react-query";
import { fetchFamilies } from "@shared/api/families";
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

  const { data: families = [], isLoading: isFamiliesLoading } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
  });

  const familyId = currentFamilyId ?? families[0]?.id ?? null;
  const hasFamily = Boolean(familyId);
  const hasChildren = false;
  const hasActiveEpisode = false;

  const startRoute = resolveClientStartRoute({
    hasFamily,
    hasChildren,
    hasActiveEpisode,
  });

  return {
    isResolving: isFamiliesLoading,
    startRoute,
    hasFamily,
    hasChildren,
    hasActiveEpisode,
  };
}
