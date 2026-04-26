import type { QueryClient } from "@tanstack/react-query";
import { dispatchRevenueCatRefresh } from "@shared/utils/revenueCatSync";

type Options = {
  accountId: string | null;
  currentFamilyId: string | null;
  includeCareQueries?: boolean;
};

export async function invalidateSubscriptionQueries(
  queryClient: QueryClient,
  options: Options
) {
  const { accountId, currentFamilyId, includeCareQueries = false } = options;

  dispatchRevenueCatRefresh();

  const jobs = [
    queryClient.invalidateQueries({ queryKey: ["families", accountId] }),
    queryClient.invalidateQueries({ queryKey: ["families", "me", "access", accountId] }),
    queryClient.invalidateQueries({ queryKey: ["families", "me", "access", currentFamilyId] }),
    queryClient.invalidateQueries({ queryKey: ["children", currentFamilyId] }),
    queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
  ];

  if (includeCareQueries) {
    jobs.push(
      queryClient.invalidateQueries({ queryKey: ["feeding-record-active"] }),
      queryClient.invalidateQueries({ queryKey: ["feeding-records"] }),
      queryClient.invalidateQueries({ queryKey: ["sleep-session-active"] }),
      queryClient.invalidateQueries({ queryKey: ["sleep-sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] })
    );
  }

  await Promise.all(jobs);
}
