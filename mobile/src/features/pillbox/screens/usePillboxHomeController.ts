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

function getPillboxHomeErrorText(
  locale: MobileLocale,
  key:
    | "loadPlansMessage"
    | "deletePlanMessage"
    | "deletePlanTitle"
    | "openPlanMessage"
    | "openPlanTitle"
    | "updateNotificationsMessage"
    | "updateNotificationsTitle"
    | "markIntakeMessage"
    | "markIntakeTitle"
    | "saveMedicineMessage"
    | "saveMedicineTitle",
) {
  if (locale === "ru") {
    return {
      loadPlansMessage: "Не удалось загрузить планы.",
      deletePlanMessage: "Не удалось удалить план.",
      deletePlanTitle: "Не удалось удалить",
      openPlanMessage: "Не удалось открыть план.",
      openPlanTitle: "Не удалось открыть",
      updateNotificationsMessage: "Не удалось обновить уведомления.",
      updateNotificationsTitle: "Не удалось обновить",
      markIntakeMessage: "Не удалось отметить приём.",
      markIntakeTitle: "Не удалось отметить",
      saveMedicineMessage: "Не удалось сохранить лекарство.",
      saveMedicineTitle: "Не удалось сохранить",
    }[key];
  }
  if (locale === "de") {
    return {
      loadPlansMessage: "Die Pläne konnten nicht geladen werden.",
      deletePlanMessage: "Der Plan konnte nicht gelöscht werden.",
      deletePlanTitle: "Löschen nicht möglich",
      openPlanMessage: "Der Plan konnte nicht geöffnet werden.",
      openPlanTitle: "Öffnen nicht möglich",
      updateNotificationsMessage: "Die Benachrichtigungen konnten nicht aktualisiert werden.",
      updateNotificationsTitle: "Aktualisierung nicht möglich",
      markIntakeMessage: "Die Einnahme konnte nicht markiert werden.",
      markIntakeTitle: "Markierung nicht möglich",
      saveMedicineMessage: "Das Medikament konnte nicht gespeichert werden.",
      saveMedicineTitle: "Speichern nicht möglich",
    }[key];
  }
  if (locale === "pl") {
    return {
      loadPlansMessage: "Nie udało się załadować planów.",
      deletePlanMessage: "Nie udało się usunąć planu.",
      deletePlanTitle: "Nie można usunąć",
      openPlanMessage: "Nie udało się otworzyć planu.",
      openPlanTitle: "Nie można otworzyć",
      updateNotificationsMessage: "Nie udało się zaktualizować powiadomień.",
      updateNotificationsTitle: "Nie można zaktualizować",
      markIntakeMessage: "Nie udało się oznaczyć przyjęcia.",
      markIntakeTitle: "Nie można oznaczyć",
      saveMedicineMessage: "Nie udało się zapisać leku.",
      saveMedicineTitle: "Nie można zapisać",
    }[key];
  }
  return {
    loadPlansMessage: "Could not load plans.",
    deletePlanMessage: "Could not delete the plan.",
    deletePlanTitle: "Could not delete",
    openPlanMessage: "Could not open the plan.",
    openPlanTitle: "Could not open",
    updateNotificationsMessage: "Could not update notifications.",
    updateNotificationsTitle: "Could not update",
    markIntakeMessage: "Could not mark the intake.",
    markIntakeTitle: "Could not mark",
    saveMedicineMessage: "Could not save the medicine.",
    saveMedicineTitle: "Could not save",
  }[key];
}

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
            : getPillboxHomeErrorText(locale, "loadPlansMessage");
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
            : getPillboxHomeErrorText(locale, "deletePlanMessage");
        Alert.alert(
          getPillboxHomeErrorText(locale, "deletePlanTitle"),
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
            : getPillboxHomeErrorText(locale, "openPlanMessage");
        Alert.alert(getPillboxHomeErrorText(locale, "openPlanTitle"), message);
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
            : getPillboxHomeErrorText(locale, "updateNotificationsMessage");
        Alert.alert(getPillboxHomeErrorText(locale, "updateNotificationsTitle"), message);
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
            : getPillboxHomeErrorText(locale, "markIntakeMessage");
        Alert.alert(getPillboxHomeErrorText(locale, "markIntakeTitle"), message);
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
          : getPillboxHomeErrorText(locale, "saveMedicineMessage");
      Alert.alert(getPillboxHomeErrorText(locale, "saveMedicineTitle"), message);
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
