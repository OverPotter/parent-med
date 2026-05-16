import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import { resolveIllnessRecipientSelection } from "../../illness/model/illnessRecipients";
import {
  deleteMobilePillboxPlan,
  getMobilePillboxPlan,
  listMobilePillboxPlans,
  takeMobilePillboxDose,
  toMobilePillboxPlanWrite,
  updateMobilePillboxPlan,
  type MobilePillboxMedication,
  type MobilePillboxPlan,
  type MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";
import {
  buildPillboxIntakeCardsFromSummaries,
  buildPillboxPlanCardsFromSummaries,
  buildPillboxSummaryStatsFromSummaries,
} from "../model/pillboxHomeScreen";

export function usePillboxHomeController({
  accessToken,
  currentAccountId,
  familyMembers,
  isOverlayActive = false,
  locale,
  onMarkIntake,
  onTabBarModeChange,
}: {
  accessToken: string | null;
  currentAccountId: string;
  familyMembers: MobileFamilyMember[];
  isOverlayActive?: boolean;
  locale: MobileLocale;
  onMarkIntake?: (intakeId: string) => void;
  onTabBarModeChange?: (mode: "foreground" | "background" | "hidden") => void;
}) {
  const [planSummaries, setPlanSummaries] = useState<MobilePillboxPlanSummary[]>([]);
  const [isPlanFlowVisible, setIsPlanFlowVisible] = useState(false);
  const [openSwipePlanId, setOpenSwipePlanId] = useState<string | null>(null);
  const [pendingDeletePlanId, setPendingDeletePlanId] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [openingPlanId, setOpeningPlanId] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedPlansById, setExpandedPlansById] = useState<
    Record<string, MobilePillboxPlan>
  >({});
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
    onTabBarModeChange?.(isPlanFlowVisible || isOverlayActive ? "hidden" : "foreground");
    return () => {
      onTabBarModeChange?.("foreground");
    };
  }, [isOverlayActive, isPlanFlowVisible, onTabBarModeChange]);

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
            : locale === "ru"
              ? "Не удалось загрузить планы."
              : "Could not load plans.";
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
    if (deletingPlanId) {
      return;
    }
    setPendingDeletePlanId(planId);
  };

  const handleCancelDeletePlan = () => {
    setPendingDeletePlanId(null);
  };

  const handleConfirmDeletePlan = () => {
    if (!pendingDeletePlanId || deletingPlanId || !accessToken) {
      return;
    }

    const planId = pendingDeletePlanId;
    setDeletingPlanId(planId);
    void deleteMobilePillboxPlan({ accessToken, planId })
      .then(() => {
        setPlanSummaries((current) => current.filter((plan) => plan.id !== planId));
        setOpenSwipePlanId(null);
        setExpandedPlansById((current) => {
          const next = { ...current };
          delete next[planId];
          return next;
        });
        setExpandedPlanId((current) => (current === planId ? null : current));
        setPendingDeletePlanId(null);
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error && error.message
            ? error.message
            : locale === "ru"
              ? "Не удалось удалить план."
              : "Could not delete the plan.";
        Alert.alert(
          locale === "ru" ? "Не удалось удалить" : "Could not delete",
          errorMessage,
        );
      })
      .finally(() => {
        setDeletingPlanId(null);
      });
  };

  const handleToggleExpandedPlan = (planId: string) => {
    setOpenSwipePlanId(null);

    if (!accessToken || openingPlanId) {
      setExpandedPlanId((current) => (current === planId ? null : planId));
      return;
    }

    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
      return;
    }

    setExpandedPlanId(planId);
    if (expandedPlansById[planId]) {
      return;
    }

    setOpeningPlanId(planId);
    void getMobilePillboxPlan({ accessToken, planId })
      .then((plan) => {
        setExpandedPlansById((current) => ({ ...current, [planId]: plan }));
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : locale === "ru"
              ? "Не удалось открыть план."
              : "Could not open the plan.";
        Alert.alert(locale === "ru" ? "Не удалось открыть" : "Could not open", message);
      })
      .finally(() => {
        setOpeningPlanId(null);
      });
  };

  const handleSavePlanRecipients = (planId: string, recipientIds: string[]) => {
    if (updatingPlanId || !accessToken) {
      return;
    }

    const plan = expandedPlansById[planId];
    if (!plan) {
      return;
    }

    const eligibleRecipientIds =
      familyMembers.length > 0
        ? familyMembers.map((member) => member.id)
        : plan.memberAccountIds;
    const normalizedRecipientIds = resolveIllnessRecipientSelection(
      recipientIds,
      eligibleRecipientIds,
      currentAccountId,
    );

    setUpdatingPlanId(planId);
    void getMobilePillboxPlan({ accessToken, planId })
      .then((currentPlan) =>
        updateMobilePillboxPlan({
          accessToken,
          planId: currentPlan.id,
          plan: {
            ...toMobilePillboxPlanWrite(currentPlan),
            memberAccountIds: normalizedRecipientIds,
          },
        }),
      )
      .then((updatedPlan) => {
        setExpandedPlansById((current) => ({
          ...current,
          [updatedPlan.id]: updatedPlan,
        }));
        return reloadPlans();
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : locale === "ru"
              ? "Не удалось обновить уведомления."
              : "Could not update notifications.";
        Alert.alert(locale === "ru" ? "Не удалось обновить" : "Could not update", message);
      })
      .finally(() => {
        setUpdatingPlanId(null);
      });
  };

  const handleMarkIntake = (
    planId: string,
    medicationId?: string | null,
    scheduledFor?: string | null,
  ) => {
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
      .then(async (updatedSummary) => {
        setPlanSummaries((current) =>
          current.map((item) => (item.id === updatedSummary.id ? updatedSummary : item)),
        );

        try {
          await reloadPlans();
          if (expandedPlansById[planId]) {
            const plan = await getMobilePillboxPlan({ accessToken, planId });
            setExpandedPlansById((current) => ({ ...current, [planId]: plan }));
          }
        } catch {
          // Keep the marked state from take response even if follow-up sync fails.
        }
        onMarkIntake?.(planId);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : locale === "ru"
              ? "Не удалось отметить приём."
              : "Could not mark the intake.";
        Alert.alert(locale === "ru" ? "Не удалось отметить" : "Could not mark", message);
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

  const handleSaveExpandedPlanMedicine = async ({
    planId,
    medicationId,
    medication,
  }: {
    planId: string;
    medicationId: string;
    medication: MobilePillboxMedication;
  }) => {
    if (!accessToken || updatingPlanId) {
      return;
    }

    const sourcePlan =
      expandedPlansById[planId] ?? (await getMobilePillboxPlan({ accessToken, planId }));
    const nextPlan: MobilePillboxPlan = {
      ...sourcePlan,
      medications: sourcePlan.medications.map((item) =>
        item.id === medicationId ? medication : item,
      ),
    };

    setUpdatingPlanId(planId);
    try {
      const updatedPlan = await updateMobilePillboxPlan({
        accessToken,
        planId,
        plan: toMobilePillboxPlanWrite(nextPlan),
      });
      setExpandedPlansById((current) => ({
        ...current,
        [updatedPlan.id]: updatedPlan,
      }));
      await reloadPlans();
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : locale === "ru"
            ? "Не удалось сохранить лекарство."
            : "Could not save the medicine.";
      Alert.alert(locale === "ru" ? "Не удалось сохранить" : "Could not save", message);
    } finally {
      setUpdatingPlanId(null);
    }
  };

  return {
    displayedPlans,
    todayIntakes,
    summaryStats,
    isPlanFlowVisible,
    setIsPlanFlowVisible,
    openSwipePlanId,
    setOpenSwipePlanId,
    pendingDeletePlanId,
    deletingPlanId,
    updatingPlanId,
    expandedPlanId,
    expandedPlansById,
    takingPlanId,
    isLoadingPlans,
    plansError,
    handleDeletePlan,
    handleCancelDeletePlan,
    handleConfirmDeletePlan,
    handleToggleExpandedPlan,
    handleSavePlanRecipients,
    handleSaveExpandedPlanMedicine,
    handleMarkIntake,
    handlePlanSaved,
    reloadPlans,
    setIsLoadingPlans,
  };
}
