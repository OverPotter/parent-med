import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchIllnessHistorySummary } from "@shared/api/illnessEpisodes";
import { fetchPillboxHistorySummary, fetchPillboxPlan } from "@shared/api/pillboxPlans";
import type { AppLanguage } from "@shared/i18n";
import type { Child } from "@shared/types/api";
import type { PillboxPlanSummary } from "@shared/api/pillboxPlans.contract";

const WARMUP_TIMEOUT_MS = 1800;

export function useClientLayoutWarmup({
  authToken,
  accountId,
  language,
  currentFamilyId,
  navChildren,
  pillboxPlans,
  isDeferredBootReady,
  isIosShell,
}: {
  authToken: string | null;
  accountId: string | null;
  language: AppLanguage;
  currentFamilyId: string | null;
  navChildren: Child[];
  pillboxPlans: PillboxPlanSummary[];
  isDeferredBootReady: boolean;
  isIosShell: boolean;
}) {
  const queryClient = useQueryClient();
  const [isWarmupReady, setIsWarmupReady] = useState(false);

  useEffect(() => {
    if (isIosShell || !authToken || !accountId || !currentFamilyId || !isDeferredBootReady) {
      setIsWarmupReady(true);
      return;
    }

    let cancelled = false;
    setIsWarmupReady(false);

    const warmupPromise = Promise.allSettled([
      ...navChildren.map((child) =>
        queryClient.prefetchQuery({
          queryKey: ["illness-history-summary", child.id, "half_year"],
          queryFn: () => fetchIllnessHistorySummary(child.id, "half_year"),
          staleTime: 60_000,
        })
      ),
      ...pillboxPlans.map(async (plan) => {
        const detail = await queryClient.fetchQuery({
          queryKey: ["pillbox-plan", plan.id],
          queryFn: () => fetchPillboxPlan(plan.id),
          staleTime: 60_000,
        });
        const hasCourseDates = detail.medications.some(
          (item) => item.courseStartDate && item.courseEndDate
        );
        const period = hasCourseDates ? "all" : "half_year";
        await queryClient.prefetchQuery({
          queryKey: ["pillbox-history-summary", plan.id, period, language],
          queryFn: () => fetchPillboxHistorySummary(plan.id, period, language),
          staleTime: 60_000,
        });
      }),
    ]);

    const timeoutPromise = new Promise<void>((resolve) => {
      window.setTimeout(resolve, WARMUP_TIMEOUT_MS);
    });

    void Promise.race([warmupPromise, timeoutPromise]).then(() => {
      if (!cancelled) {
        setIsWarmupReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    accountId,
    authToken,
    currentFamilyId,
    isDeferredBootReady,
    isIosShell,
    language,
    navChildren,
    pillboxPlans,
    queryClient,
  ]);

  return { isWarmupReady };
}
