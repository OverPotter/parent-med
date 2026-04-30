import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchMyFamilyAccess, fetchMyFamilyMembers } from "@shared/api/families";
import { hasNetworkUnavailableError } from "@shared/api/network";
import { fetchPillboxPlan, fetchPillboxPlans } from "@shared/api/pillboxPlans";
import { getEligiblePillboxRecipients } from "@shared/familyAccess/recipients";
import { ModuleOfflineState } from "@shared/components/ModuleOfflineState";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState } from "@shared/components/Surface";
import { familyAccessQueryOptions } from "@shared/hooks/useFamilyAccessQueryOptions";
import { useIsOffline } from "@shared/hooks/useIsOffline";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { canActPillbox, canEditPillbox, canViewPillbox } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import {
  shouldLockPillboxPlanCreation,
  shouldShowPillboxFreeDowngradeNotice,
} from "@shared/subscription/pillboxPlanAccess";
import { shouldAutoAssignCurrentRecipient } from "@shared/utils/recipientSelection";
import { SubscriptionUpgradeDialog } from "@client/subscription/SubscriptionUpgradeDialog";
import { useSubscriptionUpgradeDialogState } from "@client/subscription/useSubscriptionUpgradeDialogState";
import { useUpgradeDialogOpenState } from "@client/subscription/useUpgradeDialogOpenState";
import {
  buildPillboxAnalyticsRoute,
  buildPillboxDetailsRoute,
  buildPillboxHubRoute,
  buildPillboxMedicationRoute,
  buildPillboxSetupRoute,
  getPillboxBackSource,
  getPillboxListFilter,
  getPillboxRouteOrigin,
  getPillboxScreen,
  resolvePillboxMedicationUnderlaySnapshotKey,
  resolvePillboxSetupUnderlaySnapshotKey,
} from "./pillbox/navigation";
import { PillboxAnalyticsScreen } from "./pillbox/analytics";
import { PillboxMedicationScreen } from "./pillbox/medicationScreen";
import {
  PillboxDetailsScreen,
  PillboxHubScreen,
  PillboxLoadingScreen,
  PillboxSetupScreen,
} from "./pillbox/screens";
import {
  buildDraft,
  CoursePreset,
  createMedication,
  displayPillboxText,
  finalizeTimeInput,
  getCoursePreset,
  isMedicationReady,
  MedicationItem,
  normalizeTimeInput,
  PillboxDeleteTarget,
  PillboxGroup,
  PillboxPlanActionTarget,
  PillboxPlanListFilter,
  resetMedicationEditorFields,
  SetupDraft,
  tPillbox,
  toGroupSummary,
  toPlanWrite,
  toPlanWriteFromPlan,
} from "./pillbox/shared";
import { buildPillboxPlanTargetTitle } from "./pillbox/planTarget";
import { usePillboxMutations } from "./pillbox/usePillboxMutations";

export function PillboxPage() {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const isOffline = useIsOffline();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const pillboxLiveQueryOptions = useLiveQueryOptions(isIosShell ? 10000 : 5000);
  const canSeePillbox = canViewPillbox(accountFamilyRole, accountAccessPolicy);
  const canActInPillbox = canActPillbox(accountFamilyRole, accountAccessPolicy);
  const canMutatePillbox = canEditPillbox(accountFamilyRole, accountAccessPolicy);
  const disablePillboxEditingActions = !canMutatePillbox;
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDose, setEditorDose] = useState("");
  const [editorTimes, setEditorTimes] = useState<string[]>([""]);
  const [editorCoursePreset, setEditorCoursePreset] = useState<CoursePreset>("custom");
  const [deleteTarget, setDeleteTarget] = useState<PillboxDeleteTarget | null>(null);
  const [planActionTarget, setPlanActionTarget] = useState<PillboxPlanActionTarget>(null);
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [pendingNewMedicationId, setPendingNewMedicationId] = useState<string | null>(null);
  const [editorMedicationBaseline, setEditorMedicationBaseline] = useState<MedicationItem | null>(
    null
  );
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [savePlanError, setSavePlanError] = useState<string | null>(null);
  const { isUpgradeDialogOpen, setIsUpgradeDialogOpen, openUpgradeDialog, closeUpgradeDialog } =
    useUpgradeDialogOpenState();
  const screen = getPillboxScreen(searchParams);
  const isEditorScreen = screen === "setup" || screen === "medication" || screen === "details";
  const previousScreenRef = useRef(screen);
  const activeMedicationId = searchParams.get("med");
  const selectedPlanId = searchParams.get("plan");
  const backSource = getPillboxBackSource(searchParams);
  const routeOrigin = getPillboxRouteOrigin(searchParams);
  const listFilter: PillboxPlanListFilter = getPillboxListFilter(searchParams);
  const highlightedPlanId = screen === "hub" ? searchParams.get("highlightPlan") : null;
  const highlightedAction = screen === "hub" ? searchParams.get("action") : null;
  const isCreating = isEditorScreen && (selectedPlanId === "new" || !selectedPlanId);

  const isEditing = Boolean(draft?.id);
  const hasReadyMedication = Boolean(draft?.medications.some(isMedicationReady));
  const hasSelectedTargetMember = Boolean(draft?.targetMemberId || isEditing);
  const canAddMedication = isEditing || hasSelectedTargetMember;
  const addMedicationBlockedReason =
    !isEditing && !hasSelectedTargetMember
      ? language === "ru"
        ? "Сначала выберите, для кого этот план."
        : "Choose who this plan is for first."
      : null;
  const canSavePlan = hasReadyMedication && hasSelectedTargetMember;
  const saveBlockedReason = !hasReadyMedication
    ? tPillbox(language, "saveRequiresMedication")
    : !hasSelectedTargetMember
      ? language === "ru"
        ? "Сначала выберите, для кого этот план."
        : "Choose who this plan is for first."
      : null;
  const activeMedication =
    draft?.medications.find((medication) => medication.id === activeMedicationId) ?? null;
  const canSaveMedication = Boolean(editorTitle.trim());
  const { data: familyMembers = [], error: familyMembersError } = useQuery({
    queryKey: ["families", "me", "members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: Boolean(currentFamilyId && canSeePillbox),
    staleTime: 5 * 60 * 1000,
  });
  const { data: familyAccess, error: familyAccessError } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId && canSeePillbox),
    ...familyAccessQueryOptions,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const premiumActive = familyAccess?.premiumActive ?? true;
  const freePrimaryPlanId = familyAccess?.freePrimaryPillboxPlanId ?? null;
  const {
    upgradeToPlus,
    restorePurchases,
    isUpgradePending,
    upgradeErrorMessage,
    clearUpgradeError,
    restoreSuccessMessage,
  } = useSubscriptionUpgradeDialogState({
    language,
    accountId,
    currentFamilyId,
    canManageSubscription,
    subscriptionStatus: familyAccess?.subscriptionStatus ?? "inactive",
  });
  const pillboxPlanLimitReached = shouldLockPillboxPlanCreation({
    access: familyAccess,
    screen,
    selectedPlanId,
  });
  const showFreePillboxDowngradeNotice = shouldShowPillboxFreeDowngradeNotice(familyAccess);
  const eligiblePillboxMembers = useMemo(
    () => getEligiblePillboxRecipients(familyMembers),
    [familyMembers]
  );
  const {
    data: planSummaries = [],
    isLoading: plansLoading,
    error: planSummariesError,
  } = useQuery({
    queryKey: ["pillbox-plans", currentFamilyId, language],
    queryFn: fetchPillboxPlans,
    enabled: Boolean(currentFamilyId && canSeePillbox),
    ...pillboxLiveQueryOptions,
  });

  const {
    data: selectedPlan,
    isLoading: selectedPlanLoading,
    error: selectedPlanError,
  } = useQuery({
    queryKey: ["pillbox-plan", selectedPlanId],
    queryFn: () => fetchPillboxPlan(selectedPlanId!),
    enabled: Boolean(selectedPlanId && selectedPlanId !== "new" && canSeePillbox),
    ...pillboxLiveQueryOptions,
  });
  const selectedPlanSubscriptionLocked = selectedPlan
    ? premiumActive === false &&
      (selectedPlan.status === "active" || selectedPlan.status === "paused") &&
      freePrimaryPlanId !== null &&
      selectedPlan.id !== freePrimaryPlanId
    : false;
  const selectedPlanCompleted =
    selectedPlan?.status === "completed" || selectedPlan?.status === "archived";
  const showOfflineState =
    canSeePillbox &&
    (isOffline ||
      hasNetworkUnavailableError([
        familyMembersError,
        familyAccessError,
        planSummariesError,
        selectedPlanError,
      ]));

  useEffect(() => {
    if (!canSeePillbox) {
      return;
    }
    if (
      (!canMutatePillbox && (screen === "setup" || screen === "medication")) ||
      (selectedPlanCompleted && (screen === "setup" || screen === "medication"))
    ) {
      navigate(buildPillboxHubRoute(listFilter), { replace: true });
    }
  }, [canMutatePillbox, canSeePillbox, listFilter, navigate, screen, selectedPlanCompleted]);

  useEffect(() => {
    if (
      !selectedPlanSubscriptionLocked ||
      !selectedPlanId ||
      (screen !== "setup" && screen !== "medication")
    ) {
      return;
    }
    openUpgradeDialog();
    navigate(buildPillboxDetailsRoute(selectedPlanId, listFilter), { replace: true });
  }, [
    listFilter,
    navigate,
    openUpgradeDialog,
    screen,
    selectedPlanId,
    selectedPlanSubscriptionLocked,
  ]);

  const allGroups = useMemo(() => {
    const mapped = planSummaries.map((summary) => toGroupSummary(summary, language));
    if (!highlightedPlanId) {
      return mapped;
    }
    return mapped.sort((left, right) => {
      const leftRank = left.id === highlightedPlanId ? 0 : 1;
      const rightRank = right.id === highlightedPlanId ? 0 : 1;
      return leftRank - rightRank;
    });
  }, [highlightedPlanId, language, planSummaries]);
  const visibleGroups = useMemo(
    () =>
      allGroups.filter((group) =>
        listFilter === "completed"
          ? group.status === "archived" || group.status === "completed"
          : group.status !== "archived" && group.status !== "completed"
      ),
    [allGroups, listFilter]
  );
  const selectedPlanIdForAnalytics =
    selectedPlanId && allGroups.some((item) => item.id === selectedPlanId) ? selectedPlanId : null;

  useEffect(() => {
    if (!highlightedPlanId || plansLoading) {
      return;
    }
    window.setTimeout(() => {
      document
        .getElementById(`pillbox-plan-${highlightedPlanId}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 120);
  }, [highlightedAction, highlightedPlanId, plansLoading, visibleGroups.length]);

  useEffect(() => {
    if (!isEditorScreen) {
      return;
    }

    if (!draft) {
      if (isCreating) {
        setDraft(buildDraft(accountId, undefined));
      } else if (!selectedPlanLoading && !selectedPlanId) {
        navigate(buildPillboxHubRoute(listFilter), { replace: true });
      }
      return;
    }

    if (screen === "medication" && draft && !activeMedication) {
      navigate(buildPillboxSetupRoute(draft.id, "hub"), {
        replace: true,
      });
    }
  }, [
    accountId,
    activeMedication,
    draft,
    isEditorScreen,
    isCreating,
    navigate,
    listFilter,
    screen,
    selectedPlanId,
    selectedPlanLoading,
  ]);

  useEffect(() => {
    if (!isEditorScreen) {
      return;
    }
    if (isCreating) {
      setDraft((current) => current ?? buildDraft(accountId, undefined));
      return;
    }
    if (selectedPlan && selectedPlanId && draft?.id !== selectedPlanId) {
      setDraft(buildDraft(accountId, selectedPlan));
    }
  }, [accountId, draft?.id, isCreating, isEditorScreen, screen, selectedPlan, selectedPlanId]);

  useEffect(() => {
    if (
      !draft ||
      !accountId ||
      !shouldAutoAssignCurrentRecipient(
        draft.members,
        accountId,
        eligiblePillboxMembers.map((member) => member.id)
      )
    ) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            members: [accountId],
          }
        : current
    );
  }, [accountId, draft, eligiblePillboxMembers]);

  useEffect(() => {
    if (screen !== "medication" || !activeMedicationId) {
      resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
      setEditorCoursePreset("custom");
      setEditorMedicationBaseline(null);
      return;
    }

    const medication = draft?.medications.find((item) => item.id === activeMedicationId) ?? null;
    setEditorTitle(medication ? displayPillboxText(medication.title) : "");
    setEditorDose(medication ? displayPillboxText(medication.dose) : "");
    setEditorTimes(medication?.times.length ? [...medication.times] : [""]);
    setEditorCoursePreset(medication ? getCoursePreset(medication) : "custom");
    setEditorMedicationBaseline(
      medication
        ? {
            ...medication,
            times: [...medication.times],
            repeatDays: [...medication.repeatDays],
          }
        : null
    );
  }, [activeMedicationId, draft?.id, screen]);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;

    if (previousScreen !== "medication" || screen === "medication") {
      return;
    }

    if (pendingNewMedicationId) {
      setDraft((current) => {
        if (!current) return current;
        const pendingMedication = current.medications.find(
          (item) => item.id === pendingNewMedicationId
        );
        if (!pendingMedication || isMedicationReady(pendingMedication)) {
          return current;
        }
        return {
          ...current,
          medications: current.medications.filter((item) => item.id !== pendingNewMedicationId),
        };
      });
      setPendingNewMedicationId(null);
      setEditorMedicationBaseline(null);
      return;
    }

    if (!editorMedicationBaseline) {
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            medications: current.medications.map((item) =>
              item.id === editorMedicationBaseline.id ? editorMedicationBaseline : item
            ),
          }
        : current
    );
    setEditorMedicationBaseline(null);
  }, [editorMedicationBaseline, pendingNewMedicationId, screen]);

  const openCreate = () => {
    if (pillboxPlanLimitReached) {
      openUpgradeDialog();
      return;
    }
    setDraft(buildDraft(accountId, undefined));
    navigate(buildPillboxSetupRoute(null, "hub"), { replace: screen !== "hub" });
  };

  const hubRoute = buildPillboxHubRoute(listFilter);
  const resetPillboxTransientState = () => {
    setDeleteTarget(null);
    setPlanActionTarget(null);
    setPlanActionError(null);
    setPendingNewMedicationId(null);
    closeUpgradeDialog();
  };
  const resetPillboxEditorState = () => {
    setDraft(null);
    setSaveAttempted(false);
    setSavePlanError(null);
    resetPillboxTransientState();
    resetMedicationEditorFields(setEditorTitle, setEditorDose, setEditorTimes);
    setEditorCoursePreset("custom");
    setEditorMedicationBaseline(null);
  };
  const navigateWithDeferredCleanup = (to: string, options?: { replace?: boolean }) => {
    navigate(to, options);
    window.setTimeout(() => {
      resetPillboxEditorState();
    }, 0);
  };

  const openDetails = (group: PillboxGroup) => {
    setDraft(null);
    navigate(buildPillboxDetailsRoute(group.id, listFilter), { replace: screen !== "hub" });
  };

  const discardUnsavedNewMedication = () => {
    const targetMedicationId = pendingNewMedicationId ?? activeMedication?.id ?? null;
    if (screen !== "medication" || !targetMedicationId) {
      return;
    }

    setDraft((current) =>
      current
        ? (() => {
            const medication = current.medications.find((item) => item.id === targetMedicationId);
            if (!medication || !medication.id.startsWith("new-") || isMedicationReady(medication)) {
              return current;
            }
            return {
              ...current,
              medications: current.medications.filter((item) => item.id !== targetMedicationId),
            };
          })()
        : current
    );
    setPendingNewMedicationId(null);
  };

  const goToHub = () => {
    discardUnsavedNewMedication();
    navigateWithDeferredCleanup(hubRoute, { replace: true });
  };

  const goBackFromSetupByRoute = () => {
    discardUnsavedNewMedication();
    const targetPlanId = draft?.id ?? selectedPlanId;
    if (backSource === "details" && targetPlanId) {
      navigateWithDeferredCleanup(buildPillboxDetailsRoute(targetPlanId, listFilter), {
        replace: true,
      });
      return;
    }
    navigateWithDeferredCleanup(hubRoute, { replace: true });
  };
  const enableLocalPillboxSwipe = screen !== "hub";
  const hubSnapshotKey = hubRoute;
  const setupSnapshotKey = resolvePillboxSetupUnderlaySnapshotKey({
    backSource,
    selectedPlanId,
    listFilter,
  });
  const detailsSnapshotKey = hubRoute;
  const editorPlanId = draft?.id ?? selectedPlanId;
  const medicationSnapshotKey = resolvePillboxMedicationUnderlaySnapshotKey({
    editorPlanId,
    backSource,
    routeOrigin,
    listFilter,
  });
  const analyticsSnapshotKey = hubSnapshotKey;
  const setupBackLabel =
    backSource === "details" ? tPillbox(language, "medicationBack") : tPillbox(language, "setupBack");

  const {
    createPlanMutation,
    updatePlanMutation,
    togglePlanStatusMutation,
    deletePlanMutation,
    takeDoseMutation,
  } = usePillboxMutations({
    language,
    currentFamilyId,
    currentPillboxPlanLimitReached: Boolean(pillboxPlanLimitReached),
    onPlanLimitReached: openUpgradeDialog,
    queryClient,
    setSavePlanError,
    setPlanActionError,
    setDeleteTarget,
    setPlanActionTarget,
    goToHub,
  });
  useEffect(() => {
    if (
      !selectedPlanId ||
      !selectedPlan ||
      disablePillboxEditingActions ||
      updatePlanMutation.isPending ||
      !accountId ||
      !shouldAutoAssignCurrentRecipient(
        selectedPlan.memberAccountIds,
        accountId,
        eligiblePillboxMembers.map((member) => member.id)
      )
    ) {
      return;
    }

    updatePlanMutation.mutate({
      planId: selectedPlanId,
      payload: {
        ...toPlanWriteFromPlan(selectedPlan),
        memberAccountIds: [accountId],
      },
    });
  }, [accountId, eligiblePillboxMembers, selectedPlan, selectedPlanId, updatePlanMutation]);

  const goToSetup = () => {
    if (selectedPlanCompleted) {
      return;
    }
    const targetPlanId = draft?.id ?? selectedPlanId;
    navigate(buildPillboxSetupRoute(targetPlanId, "details"), {
      replace: true,
    });
  };

  const closeMedicationEditor = () => {
    const targetPlanId = draft?.id ?? selectedPlanId;
    if (backSource === "details" && targetPlanId) {
      navigate(buildPillboxDetailsRoute(targetPlanId, listFilter), {
        replace: true,
      });
      return;
    }
    navigate(buildPillboxSetupRoute(targetPlanId, routeOrigin), {
      replace: true,
    });
  };

  const goToMedicationFromSetup = (medicationId: string) => {
    const targetPlanId = draft?.id ?? selectedPlanId;
    navigate(
      buildPillboxMedicationRoute(
        medicationId,
        targetPlanId,
        "setup",
        backSource === "details" ? "details" : "hub"
      ),
      {
        replace: screen === "medication",
      }
    );
  };

  const goToMedicationFromDetails = (medicationId: string) => {
    if (selectedPlanCompleted) {
      return;
    }
    const targetPlanId = selectedPlanId;
    navigate(buildPillboxMedicationRoute(medicationId, targetPlanId, "details", "details"), {
      replace: screen === "medication",
    });
  };

  const addMedication = () => {
    if (!canAddMedication) {
      return;
    }
    const nextMedication = createMedication();
    setPendingNewMedicationId(nextMedication.id);
    setDraft((current) =>
      current
        ? {
            ...current,
            medications: [...current.medications, nextMedication],
          }
        : current
    );
    goToMedicationFromSetup(nextMedication.id);
  };

  const updateMedication = (id: string, patch: Partial<MedicationItem>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            medications: current.medications.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            ),
          }
        : current
    );
  };

  const updateEditorTimeAt = (index: number, nextValue: string) => {
    setEditorTimes((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index ? normalizeTimeInput(nextValue) : value
      )
    );
  };

  const finalizeEditorTimeAt = (index: number) => {
    setEditorTimes((current) =>
      current.map((value, currentIndex) =>
        currentIndex === index ? (value.trim() ? finalizeTimeInput(value) : "") : value
      )
    );
  };

  const addEditorTime = () => {
    setEditorTimes((current) => [...current, ""]);
  };

  const removeEditorTime = (index: number) => {
    setEditorTimes((current) => {
      if (current.length <= 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const saveGroup = () => {
    setSaveAttempted(true);
    setSavePlanError(null);
    if (!draft || !canSavePlan) return;
    const payload = toPlanWrite(draft);
    if (draft.id) {
      updatePlanMutation.mutate(
        { planId: draft.id, payload },
        {
          onSuccess: () => {
            goToHub();
          },
        }
      );
      return;
    }
    createPlanMutation.mutate(payload);
  };

  const toggleSelectedPlanRecipient = (memberIds: string[]) => {
    if (
      !selectedPlanId ||
      !selectedPlan ||
      updatePlanMutation.isPending ||
      disablePillboxEditingActions
    ) {
      return Promise.resolve();
    }
    if (selectedPlanSubscriptionLocked) {
      openUpgradeDialog();
      return Promise.resolve();
    }

    return updatePlanMutation
      .mutateAsync({
        planId: selectedPlanId,
        payload: {
          ...toPlanWriteFromPlan(selectedPlan),
          memberAccountIds: memberIds,
        },
      })
      .then(() => undefined);
  };

  const deleteGroup = () => {
    const targetPlanId = draft?.id ?? selectedPlanId;
    if (!targetPlanId) {
      goToHub();
      return;
    }
    deletePlanMutation.mutate(targetPlanId);
  };

  const deleteMedication = (medicationId: string) => {
    if (pendingNewMedicationId === medicationId) {
      setPendingNewMedicationId(null);
    }
    if (editorMedicationBaseline?.id === medicationId) {
      setEditorMedicationBaseline(null);
    }
    setDraft((current) => {
      if (!current) return current;

      const nextMedications = current.medications.filter((item) => item.id !== medicationId);
      return {
        ...current,
        medications: nextMedications,
      };
    });

    if (screen === "medication") {
      goToSetup();
    }
  };

  const requestDeleteMedication = (medicationId: string, medicationName: string) => {
    setPlanActionError(null);
    setPlanActionTarget(null);
    setDeleteTarget({ kind: "medication", medicationId, medicationName });
  };

  const requestDeletePlan = () => {
    if (
      selectedPlanSubscriptionLocked &&
      selectedPlan &&
      (selectedPlan.status === "active" || selectedPlan.status === "paused")
    ) {
      openUpgradeDialog();
      return;
    }
    setPlanActionError(null);
    setPlanActionTarget(null);
    setDeleteTarget({ kind: "plan" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "plan") {
      setDeleteTarget(null);
      deleteGroup();
      return;
    }

    deleteMedication(deleteTarget.medicationId);
    setDeleteTarget(null);
  };

  const markNextDoseTaken = (group: PillboxGroup) => {
    if (!group.nextMedicationId || takeDoseMutation.isPending) {
      return;
    }
    if (
      premiumActive === false &&
      freePrimaryPlanId !== null &&
      group.id !== freePrimaryPlanId &&
      (group.status === "active" || group.status === "paused")
    ) {
      openUpgradeDialog();
      return;
    }
    takeDoseMutation.mutate({
      planId: group.id,
      medicationId: group.nextMedicationId,
      scheduledFor: group.nextDoseAt,
    });
  };

  const toggleSelectedPlanStatus = () => {
    if (
      !selectedPlan ||
      togglePlanStatusMutation.isPending ||
      selectedPlan.status === "archived" ||
      selectedPlan.status === "completed"
    ) {
      return;
    }
    if (selectedPlanSubscriptionLocked) {
      openUpgradeDialog();
      return;
    }
    setPlanActionError(null);
    setDeleteTarget(null);
    setPlanActionTarget(selectedPlan.status === "active" ? "pause" : "resume");
  };

  const confirmPlanAction = () => {
    if (
      !selectedPlanId ||
      !selectedPlan ||
      !planActionTarget ||
      togglePlanStatusMutation.isPending
    ) {
      return;
    }

    const nextStatus = planActionTarget === "pause" ? "paused" : "active";
    togglePlanStatusMutation.mutate({
      planId: selectedPlanId,
      payload: toPlanWriteFromPlan(selectedPlan, nextStatus),
    });
  };

  const setListFilter = (nextFilter: PillboxPlanListFilter) => {
    if (screen !== "hub") {
      return;
    }
    navigate(buildPillboxHubRoute(nextFilter), { replace: true });
  };

  const openAnalytics = (
    targetPlanId?: string | null,
    targetFilter: PillboxPlanListFilter = listFilter
  ) => {
    const resolvedPlanId =
      targetPlanId ??
      selectedPlanIdForAnalytics ??
      (targetFilter === "completed"
        ? allGroups.find((group) => group.status === "archived" || group.status === "completed")?.id
        : allGroups.find((group) => group.status !== "archived" && group.status !== "completed")
            ?.id) ??
      null;
    navigate(buildPillboxAnalyticsRoute(resolvedPlanId, targetFilter), {
      replace: screen !== "hub",
    });
  };

  const saveMedication = () => {
    if (!activeMedication || !canSaveMedication) return;

    const normalizedTimes = editorTimes
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => finalizeTimeInput(value));

    updateMedication(activeMedication.id, {
      title: editorTitle.trim(),
      dose: editorDose.trim(),
      times: normalizedTimes.length ? normalizedTimes : ["08:30"],
    });
    if (pendingNewMedicationId === activeMedication.id) {
      setPendingNewMedicationId(null);
    }
    setEditorMedicationBaseline(null);
    closeMedicationEditor();
  };

  if (screen === "analytics") {
    return (
      <PillboxAnalyticsScreen
        language={language}
        groups={allGroups}
        selectedPlanId={selectedPlanIdForAnalytics}
        initialFilter={listFilter}
        onBack={goToHub}
        underlaySnapshotKey={analyticsSnapshotKey}
        enableBackGesture={enableLocalPillboxSwipe}
        onSelectPlan={(planId, filter) =>
          navigate(buildPillboxAnalyticsRoute(planId, filter), { replace: true })
        }
      />
    );
  }

  if (!canSeePillbox) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={tPillbox(language, "hubTitle")}
          subtitle={tPillbox(language, "hubSubtitle")}
          compactOnMobile
          hideOnMobile
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <h1 className="app-mobile-section-intro__title">{tPillbox(language, "hubTitle")}</h1>
            <p className="app-mobile-section-intro__hint">{tPillbox(language, "hubMobileHint")}</p>
          </div>
        </div>
        <EmptyState className="text-foreground">
          <div className="space-y-3">
            <p className="app-card-title">{tPillbox(language, "noAccessTitle")}</p>
            <p className="text-sm leading-6 text-muted">
              {tPillbox(language, "noAccessDescription")}
            </p>
          </div>
        </EmptyState>
      </div>
    );
  }

  if (showOfflineState) {
    return (
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <PageIntro
          title={tPillbox(language, "hubTitle")}
          subtitle={tPillbox(language, "hubSubtitle")}
          compactOnMobile
          hideOnMobile
        />
        <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
          <div className="app-mobile-section-intro">
            <h1 className="app-mobile-section-intro__title">{tPillbox(language, "hubTitle")}</h1>
            <p className="app-mobile-section-intro__hint">{tPillbox(language, "hubMobileHint")}</p>
          </div>
        </div>
        <ModuleOfflineState language={language} />
      </div>
    );
  }

  if (screen === "hub" && plansLoading) {
    return (
      <div className="soft-panel-muted rounded-[22px] px-4 py-4 text-sm text-muted">
        {language === "ru" ? "Загружаем планы лекарств..." : "Loading medication plans..."}
      </div>
    );
  }

  if (isEditorScreen && !isCreating && selectedPlanLoading && !draft) {
    return (
      <PillboxLoadingScreen
        language={language}
        screen={screen}
        onBack={screen === "setup" ? goBackFromSetupByRoute : goToHub}
        underlaySnapshotKey={screen === "setup" ? setupSnapshotKey : hubSnapshotKey}
        enableBackGesture={enableLocalPillboxSwipe}
        backLabel={screen === "setup" ? setupBackLabel : undefined}
      />
    );
  }

  if (screen === "medication" && draft && activeMedication) {
    return (
      <PillboxMedicationScreen
        language={language}
        activeMedication={activeMedication}
        editorTitle={editorTitle}
        editorDose={editorDose}
        editorTimes={editorTimes}
        editorCoursePreset={editorCoursePreset}
        canSaveMedication={canSaveMedication}
        onBack={closeMedicationEditor}
        onTitleChange={setEditorTitle}
        onDoseChange={setEditorDose}
        onUpdateEditorTimeAt={updateEditorTimeAt}
        onFinalizeEditorTimeAt={finalizeEditorTimeAt}
        onAddEditorTime={addEditorTime}
        onRemoveEditorTime={removeEditorTime}
        onUpdateMedication={updateMedication}
        onCoursePresetChange={setEditorCoursePreset}
        onSaveMedication={saveMedication}
        underlaySnapshotKey={medicationSnapshotKey}
        enableBackGesture={enableLocalPillboxSwipe}
      />
    );
  }

  if (screen === "details" && selectedPlan && selectedPlanId) {
    return (
      <PillboxDetailsScreen
        language={language}
        selectedPlan={selectedPlan}
        selectedPlanId={selectedPlanId}
        allGroups={allGroups}
        canAct={canActInPillbox}
        canEdit={canMutatePillbox}
        disableEditingActions={
          disablePillboxEditingActions || selectedPlanSubscriptionLocked || selectedPlanCompleted
        }
        planActionTarget={planActionTarget}
        planActionError={planActionError}
        togglePlanStatusPending={togglePlanStatusMutation.isPending}
        deletePlanPending={deletePlanMutation.isPending}
        deleteTarget={deleteTarget}
        onBack={goToHub}
        onToggleStatus={toggleSelectedPlanStatus}
        onGoToSetup={goToSetup}
        onOpenMedication={goToMedicationFromDetails}
        familyMembers={eligiblePillboxMembers}
        currentAccountId={accountId}
        onToggleRecipient={toggleSelectedPlanRecipient}
        recipientSelectionPending={updatePlanMutation.isPending}
        onRequestDelete={requestDeletePlan}
        onConfirmPlanAction={confirmPlanAction}
        onClosePlanAction={() => {
          setPlanActionTarget(null);
          setPlanActionError(null);
        }}
        onConfirmDelete={confirmDelete}
        underlaySnapshotKey={detailsSnapshotKey}
        enableBackGesture={enableLocalPillboxSwipe}
        onCloseDelete={() => {
          setDeleteTarget(null);
          setPlanActionError(null);
        }}
      />
    );
  }

  if (screen === "setup" && draft) {
    return (
      <>
        <PillboxSetupScreen
          language={language}
          draft={draft}
          familyMembers={eligiblePillboxMembers}
          canAddMedication={canAddMedication}
          addMedicationBlockedReason={addMedicationBlockedReason}
          canSavePlan={canSavePlan}
          saveBlockedReason={saveBlockedReason}
          saveAttempted={saveAttempted}
          savePlanError={savePlanError}
          isEditing={isEditing}
          onBack={goBackFromSetupByRoute}
          onAddMedication={addMedication}
          onOpenMedication={goToMedicationFromSetup}
          onRequestDeleteMedication={requestDeleteMedication}
          onTitleChange={(value) =>
            setDraft((current) => (current ? { ...current, title: value } : current))
          }
          onSelectTargetMember={(memberId) =>
            setDraft((current) => {
              if (!current) return current;
              const member = eligiblePillboxMembers.find((item) => item.id === memberId);
              if (!member) return current;
              return {
                ...current,
                targetMemberId: memberId,
                title: buildPillboxPlanTargetTitle(member, language),
                members: [memberId],
              };
            })
          }
          onSavePlan={saveGroup}
          deleteTarget={deleteTarget}
          underlaySnapshotKey={setupSnapshotKey}
          enableBackGesture={enableLocalPillboxSwipe}
          backLabel={setupBackLabel}
          onConfirmDelete={confirmDelete}
          onCloseDeleteDialog={() => setDeleteTarget(null)}
        />
      </>
    );
  }

  return (
    <>
      <PillboxHubScreen
        language={language}
        isIosShell={isIosShell}
        listFilter={listFilter}
        visibleGroups={visibleGroups}
        canAct={canActInPillbox}
        canEdit={canMutatePillbox}
        createPlanLocked={Boolean(pillboxPlanLimitReached)}
        showFreeDowngradeNotice={showFreePillboxDowngradeNotice}
        freePrimaryPlanId={freePrimaryPlanId}
        highlightedPlanId={highlightedPlanId}
        openAnalytics={openAnalytics}
        openCreate={openCreate}
        openDetails={openDetails}
        setListFilter={setListFilter}
        markNextDoseTaken={markNextDoseTaken}
        takeDosePending={takeDoseMutation.isPending}
        deleteTarget={deleteTarget}
        planActionError={planActionError}
        deletePlanPending={deletePlanMutation.isPending}
        confirmDelete={confirmDelete}
        closeDeleteDialog={() => {
          setDeleteTarget(null);
          setPlanActionError(null);
        }}
      />
      <SubscriptionUpgradeDialog
        isOpen={isUpgradeDialogOpen}
        setIsOpen={setIsUpgradeDialogOpen}
        language={language}
        entryPoint="second_pillbox_plan"
        canManageSubscription={canManageSubscription}
        subscriptionStatus={familyAccess?.subscriptionStatus ?? "inactive"}
        isUpgradePending={isUpgradePending}
        upgradeErrorMessage={upgradeErrorMessage}
        restoreSuccessMessage={restoreSuccessMessage}
        clearUpgradeError={clearUpgradeError}
        upgradeToPlus={upgradeToPlus}
        restorePurchases={restorePurchases}
      />
    </>
  );
}
