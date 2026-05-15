import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { resolveIllnessRecipientSelection } from "../../illness/model/illnessRecipients";
import {
  deleteMobilePillboxPlan,
  getMobilePillboxPlan,
  listMobilePillboxPlans,
  takeMobilePillboxDose,
  toMobilePillboxPlanWrite,
  updateMobilePillboxPlan,
  type MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";
import {
  buildPillboxIntakeCardsFromSummaries,
  buildPillboxPlanDetailFromEntity,
  buildPillboxPlanCardsFromSummaries,
  buildPillboxSummaryStatsFromSummaries,
  type PillboxPlanDetail,
} from "../model/pillboxHomeScreen";

export function usePillboxHomeController({
  accessToken,
  currentAccountId,
  familyMembers,
  locale,
  onMarkIntake,
  onTabBarModeChange,
}: {
  accessToken: string | null;
  currentAccountId: string;
  familyMembers: MobileFamilyMember[];
  locale: "ru" | "en";
  onMarkIntake?: (intakeId: string) => void;
  onTabBarModeChange?: (mode: "foreground" | "background" | "hidden") => void;
}) {
  const [planSummaries, setPlanSummaries] = useState<MobilePillboxPlanSummary[]>([]);
  const [isPlanFlowVisible, setIsPlanFlowVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PillboxPlanDetail | null>(null);
  const [openSwipePlanId, setOpenSwipePlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [openingPlanId, setOpeningPlanId] = useState<string | null>(null);
  const [takingPlanId, setTakingPlanId] = useState<string | null>(null);

  const displayedPlans = useMemo(
    () => buildPillboxPlanCardsFromSummaries({ summaries: planSummaries, locale }),
    [locale, planSummaries],
  );
  const todayIntakes = useMemo(
    () => buildPillboxIntakeCardsFromSummaries({ summaries: planSummaries, locale }),
    [locale, planSummaries],
  );
  const summaryStats = useMemo(
    () => buildPillboxSummaryStatsFromSummaries({ summaries: planSummaries, locale }),
    [locale, planSummaries],
  );

  useEffect(() => {
    onTabBarModeChange?.(isPlanFlowVisible || selectedPlan ? "hidden" : "foreground");
    return () => {
      onTabBarModeChange?.("foreground");
    };
  }, [isPlanFlowVisible, onTabBarModeChange, selectedPlan]);

  const reloadPlans = () => {
    if (!accessToken) {
      return Promise.resolve();
    }

    setPlansError(null);
    return listMobilePillboxPlans({ accessToken })
      .then((items) => {
        setPlanSummaries(items);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось загрузить планы.";
        setPlansError(message);
      });
  };

  useEffect(() => {
    if (!accessToken) {
      setPlanSummaries([]);
      return;
    }

    setIsLoadingPlans(true);
    void reloadPlans().finally(() => {
      setIsLoadingPlans(false);
    });
  }, [accessToken]);

  const handleDeletePlan = (planId: string) => {
    if (deletingPlanId || !accessToken) {
      return;
    }

    setDeletingPlanId(planId);
    void deleteMobilePillboxPlan({ accessToken, planId })
      .then(() => {
        setPlanSummaries((current) => current.filter((plan) => plan.id !== planId));
        setOpenSwipePlanId(null);
        if (selectedPlan?.id === planId) {
          setSelectedPlan(null);
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось удалить план.";
        Alert.alert("Не удалось удалить", message);
      })
      .finally(() => {
        setDeletingPlanId(null);
      });
  };

  const handleOpenPlan = (planId: string) => {
    if (!accessToken || openingPlanId) {
      return;
    }

    setOpeningPlanId(planId);
    void getMobilePillboxPlan({ accessToken, planId })
      .then((plan) => {
        setSelectedPlan(
          buildPillboxPlanDetailFromEntity({
            plan,
            locale,
            familyMembers,
          }),
        );
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось открыть план.";
        Alert.alert("Не удалось открыть", message);
      })
      .finally(() => {
        setOpeningPlanId(null);
      });
  };

  const handleTogglePlanPause = () => {
    if (!selectedPlan || updatingPlanId || !accessToken) {
      return;
    }

    setUpdatingPlanId(selectedPlan.id);
    void getMobilePillboxPlan({ accessToken, planId: selectedPlan.id })
      .then((plan) =>
        updateMobilePillboxPlan({
          accessToken,
          planId: plan.id,
          plan: {
            ...toMobilePillboxPlanWrite(plan),
            status: plan.status === "paused" ? "active" : "paused",
          },
        }),
      )
      .then((updatedPlan) => {
        setSelectedPlan(
          buildPillboxPlanDetailFromEntity({
            plan: updatedPlan,
            locale,
            familyMembers,
          }),
        );
        return reloadPlans();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось обновить план.";
        Alert.alert("Не удалось обновить", message);
      })
      .finally(() => {
        setUpdatingPlanId(null);
      });
  };

  const handleSavePlanRecipients = (recipientIds: string[]) => {
    if (!selectedPlan || updatingPlanId || !accessToken) {
      return;
    }

    const eligibleRecipientIds =
      familyMembers.length > 0 ? familyMembers.map((member) => member.id) : selectedPlan.recipientIds;
    const normalizedRecipientIds = resolveIllnessRecipientSelection(
      recipientIds,
      eligibleRecipientIds,
      currentAccountId,
    );

    setUpdatingPlanId(selectedPlan.id);
    void getMobilePillboxPlan({ accessToken, planId: selectedPlan.id })
      .then((plan) =>
        updateMobilePillboxPlan({
          accessToken,
          planId: plan.id,
          plan: {
            ...toMobilePillboxPlanWrite(plan),
            memberAccountIds: normalizedRecipientIds,
          },
        }),
      )
      .then((updatedPlan) => {
        setSelectedPlan(
          buildPillboxPlanDetailFromEntity({
            plan: updatedPlan,
            locale,
            familyMembers,
          }),
        );
        return reloadPlans();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось обновить уведомления.";
        Alert.alert("Не удалось обновить", message);
      })
      .finally(() => {
        setUpdatingPlanId(null);
      });
  };

  const handleMarkIntake = (planId: string, medicationId?: string | null, scheduledFor?: string | null) => {
    if (!accessToken || !medicationId || takingPlanId) {
      return;
    }

    setTakingPlanId(planId);
    void takeMobilePillboxDose({
      accessToken,
      planId,
      medicationId,
      scheduledFor,
    })
      .then((updatedSummary) => {
        setPlanSummaries((current) =>
          current.map((item) => (item.id === updatedSummary.id ? updatedSummary : item)),
        );
        onMarkIntake?.(planId);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Не удалось отметить приём.";
        Alert.alert("Не удалось отметить", message);
      })
      .finally(() => {
        setTakingPlanId(null);
      });
  };

  const handlePlanSaved = () => {
    setIsPlanFlowVisible(false);
    setIsLoadingPlans(true);
    void reloadPlans().finally(() => {
      setIsLoadingPlans(false);
    });
  };

  return {
    displayedPlans,
    todayIntakes,
    summaryStats,
    isPlanFlowVisible,
    setIsPlanFlowVisible,
    selectedPlan,
    setSelectedPlan,
    openSwipePlanId,
    setOpenSwipePlanId,
    deletingPlanId,
    updatingPlanId,
    isLoadingPlans,
    plansError,
    handleDeletePlan,
    handleOpenPlan,
    handleTogglePlanPause,
    handleSavePlanRecipients,
    handleMarkIntake,
    handlePlanSaved,
    reloadPlans,
    setIsLoadingPlans,
  };
}
