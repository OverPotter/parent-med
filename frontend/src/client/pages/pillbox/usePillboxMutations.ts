import { isAxiosError } from "axios";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import {
  createPillboxPlan,
  deletePillboxPlan,
  takePillboxDose,
  updatePillboxPlan,
} from "@shared/api/pillboxPlans";
import type {
  PillboxPlan,
  PillboxPlanSummary,
  PillboxPlanWrite,
} from "@shared/api/pillboxPlans.contract";
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
  void queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
  if (planId) {
    void queryClient.invalidateQueries({ queryKey: ["pillbox-plan", planId] });
  }
}

function toPlanSummary(
  plan: PillboxPlan,
  existingSummary?: PillboxPlanSummary | null
): PillboxPlanSummary {
  return {
    id: plan.id,
    title: plan.title,
    status: plan.status,
    memberAccountIds: plan.memberAccountIds,
    activeMedicationCount: plan.medications.length,
    nextDoseAt: existingSummary?.nextDoseAt ?? null,
    nextDoseLabel: existingSummary?.nextDoseLabel ?? null,
    nextMedicationId: existingSummary?.nextMedicationId ?? null,
    nextMedicationTitle: existingSummary?.nextMedicationTitle ?? null,
    courseSummaryKind: existingSummary?.courseSummaryKind ?? null,
    courseProgressRatio: existingSummary?.courseProgressRatio ?? null,
    courseDayLabel: existingSummary?.courseDayLabel ?? null,
  };
}

function upsertPlanSummaryInList(
  current: PillboxPlanSummary[] | undefined,
  summary: PillboxPlanSummary
): PillboxPlanSummary[] {
  const items = current ?? [];
  const next = items.some((item) => item.id === summary.id)
    ? items.map((item) => (item.id === summary.id ? { ...item, ...summary } : item))
    : [summary, ...items];
  return next;
}

function removePlanSummaryFromList(
  current: PillboxPlanSummary[] | undefined,
  planId: string
): PillboxPlanSummary[] {
  return (current ?? []).filter((item) => item.id !== planId);
}

function findPlanSummary(
  current: PillboxPlanSummary[] | undefined,
  planId: string
): PillboxPlanSummary | null {
  return (current ?? []).find((item) => item.id === planId) ?? null;
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
    onSuccess: (plan) => {
      setSavePlanError(null);
      queryClient.setQueryData<PillboxPlan>(["pillbox-plan", plan.id], plan);
      queryClient.setQueryData<PillboxPlanSummary[]>(
        ["pillbox-plans", currentFamilyId, language],
        (current) => upsertPlanSummaryInList(current, toPlanSummary(plan))
      );
      void queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
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
    onSuccess: (plan) => {
      setSavePlanError(null);
      queryClient.setQueryData<PillboxPlan>(["pillbox-plan", plan.id], plan);
      queryClient.setQueryData<PillboxPlanSummary[]>(
        ["pillbox-plans", currentFamilyId, language],
        (current) =>
          upsertPlanSummaryInList(current, toPlanSummary(plan, findPlanSummary(current, plan.id)))
      );
      refreshPillboxQueries(queryClient, currentFamilyId, plan.id);
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
    onSuccess: (plan) => {
      setPlanActionError(null);
      setPlanActionTarget(null);
      queryClient.setQueryData<PillboxPlan>(["pillbox-plan", plan.id], plan);
      queryClient.setQueryData<PillboxPlanSummary[]>(
        ["pillbox-plans", currentFamilyId, language],
        (current) =>
          upsertPlanSummaryInList(current, toPlanSummary(plan, findPlanSummary(current, plan.id)))
      );
      refreshPillboxQueries(queryClient, currentFamilyId, plan.id);
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
    onSuccess: (_result, planId) => {
      setPlanActionError(null);
      setPlanActionTarget(null);
      setDeleteTarget(null);
      queryClient.setQueryData<PillboxPlanSummary[]>(
        ["pillbox-plans", currentFamilyId, language],
        (current) => removePlanSummaryFromList(current, planId)
      );
      queryClient.removeQueries({ queryKey: ["pillbox-plan", planId] });
      void queryClient.invalidateQueries({ queryKey: ["pillbox-plans", currentFamilyId] });
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
    onSuccess: (summary, variables) => {
      queryClient.setQueryData<PillboxPlanSummary[]>(
        ["pillbox-plans", currentFamilyId, language],
        (current) => upsertPlanSummaryInList(current, summary)
      );
      refreshPillboxQueries(queryClient, currentFamilyId, variables.planId);
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
