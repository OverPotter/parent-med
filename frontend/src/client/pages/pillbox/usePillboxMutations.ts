import { isAxiosError } from "axios";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import {
  createPillboxPlan,
  deletePillboxPlan,
  takePillboxDose,
  updatePillboxPlan,
} from "@shared/api/pillboxPlans";
import type { PillboxPlanWrite } from "@shared/api/pillboxPlans.contract";
import type { AppLanguage } from "@shared/i18n";
import { tPillbox, type PillboxDeleteTarget, type PillboxPlanActionTarget } from "./shared";

interface UsePillboxMutationsOptions {
  language: AppLanguage;
  currentFamilyId: string | null;
  currentPillboxPlanLimitReached?: boolean;
  onPlanLimitReached?: () => void;
  queryClient: QueryClient;
  setSavePlanError: (value: string | null) => void;
  setPlanActionError: (value: string | null) => void;
  setDeleteTarget: (value: PillboxDeleteTarget | null) => void;
  setPlanActionTarget: (value: PillboxPlanActionTarget) => void;
  goToHub: () => void;
}

class PlanLimitReachedError extends Error {}

function getPlanErrorMessage(language: AppLanguage) {
  return language === "ru"
    ? "Не удалось обновить статус плана. Попробуйте ещё раз."
    : "Could not update the plan status. Please try again.";
}

async function refreshPillboxQueries(
  queryClient: QueryClient,
  currentFamilyId: string | null,
  planId?: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
    ...(planId
      ? [queryClient.invalidateQueries({ queryKey: ["pillbox-plan", planId] })]
      : []),
    queryClient.refetchQueries({ queryKey: ["pillbox-plans", currentFamilyId] }),
    ...(planId ? [queryClient.refetchQueries({ queryKey: ["pillbox-plan", planId] })] : []),
  ]);
}

export function usePillboxMutations({
  language,
  currentFamilyId,
  currentPillboxPlanLimitReached = false,
  onPlanLimitReached,
  queryClient,
  setSavePlanError,
  setPlanActionError,
  setDeleteTarget,
  setPlanActionTarget,
  goToHub,
}: UsePillboxMutationsOptions) {
  const createPlanMutation = useMutation({
    mutationFn: async (payload: PillboxPlanWrite) => {
      if (currentPillboxPlanLimitReached) {
        onPlanLimitReached?.();
        throw new PlanLimitReachedError("PILLBOX_PLAN_LIMIT_REACHED");
      }
      return createPillboxPlan(payload);
    },
    onSuccess: async () => {
      setSavePlanError(null);
      await queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
      goToHub();
    },
    onError: (error) => {
      if (error instanceof PlanLimitReachedError) {
        setSavePlanError(null);
        return;
      }
      if (error instanceof Error && error.message) {
        setSavePlanError(error.message);
        return;
      }
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setSavePlanError(detail || tPillbox(language, "savePlanFailed"));
        return;
      }
      setSavePlanError(tPillbox(language, "savePlanFailed"));
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PillboxPlanWrite }) =>
      updatePillboxPlan(planId, payload),
    onSuccess: async (plan) => {
      setSavePlanError(null);
      await refreshPillboxQueries(queryClient, currentFamilyId, plan.id);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setSavePlanError(detail || tPillbox(language, "savePlanFailed"));
        return;
      }
      setSavePlanError(tPillbox(language, "savePlanFailed"));
    },
  });

  const togglePlanStatusMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PillboxPlanWrite }) =>
      updatePillboxPlan(planId, payload),
    onSuccess: async (plan) => {
      setPlanActionError(null);
      setPlanActionTarget(null);
      await refreshPillboxQueries(queryClient, currentFamilyId, plan.id);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setPlanActionError(detail || getPlanErrorMessage(language));
        return;
      }
      setPlanActionError(getPlanErrorMessage(language));
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deletePillboxPlan,
    onSuccess: async () => {
      setPlanActionError(null);
      setDeleteTarget(null);
      setPlanActionTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
      goToHub();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const detail =
          typeof error.response?.data === "object" && error.response?.data
            ? (error.response.data as { detail?: string }).detail
            : null;
        setPlanActionError(detail || getPlanErrorMessage(language));
        return;
      }
      setPlanActionError(getPlanErrorMessage(language));
    },
  });

  const takeDoseMutation = useMutation({
    mutationFn: ({
      planId,
      medicationId,
      scheduledFor,
    }: {
      planId: string;
      medicationId: string;
      scheduledFor: string | null;
    }) =>
      takePillboxDose(planId, medicationId, {
        source: "manual",
        scheduled_for: scheduledFor,
      }),
    onSuccess: async (_, variables) => {
      await refreshPillboxQueries(queryClient, currentFamilyId, variables.planId);
    },
  });

  return {
    createPlanMutation,
    updatePlanMutation,
    togglePlanStatusMutation,
    deletePlanMutation,
    takeDoseMutation,
  };
}
