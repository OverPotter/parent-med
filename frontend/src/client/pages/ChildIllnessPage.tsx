/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodeInsights,
  fetchIllnessEpisodesByChildId,
} from "@shared/api/illnessEpisodes";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchMyFamilyAccess, fetchMyFamilyMembers } from "@shared/api/families";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { trackIllnessEpisodeStarted } from "@shared/analytics";
import { getEligibleIllnessRecipients } from "@shared/familyAccess/recipients";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { canActChild, canEditChild, canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { isChildIllnessMutationLockedByPlan } from "@shared/subscription/childPlanAccess";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";
import {
  stopLiveActivitiesForChildIds,
  syncIllnessLiveActivity,
} from "@shared/utils/liveActivities";
import {
  clearIllnessStartHint,
  setIllnessStartHint,
  shouldKeepIllnessTimerHint,
} from "@shared/utils/illnessStartHints";
import { getLocalIsoDate, isFutureDeviceDate } from "@shared/utils/date";
import {
  closeIllnessEpisodeResilient,
  createIllnessEpisodeResilient,
} from "@shared/utils/offlineCareSync";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { formatChildAgeLabel } from "@client/i18n/children";
import { UpgradeDialog } from "@client/subscription/UpgradeDialog";
import { useSubscriptionUpgrade } from "@client/subscription/useSubscriptionUpgrade";
import { formatChildDatePlain } from "@client/utils/childDateFormat";
import type { FamilyMember, IllnessEpisode, WeightEntry } from "@shared/types/api";
import { EpisodeActivationCard } from "./child-illness/forms";
import {
  HistoryEpisodeCard,
  HistoryEpisodeInsightsScreen,
  HistoryInsightsPreview,
} from "./child-illness/history";
import { EpisodeBlock } from "./child-illness/EpisodeBlock";
import {
  getActiveEpisodeFromList,
  invalidateIllnessQueriesForChild,
  setIllnessEpisodesForChild,
  upsertIllnessEpisodeForChild,
} from "./child-illness/episodeCache";
import {
  buildChildIllnessBackState,
  buildChildIllnessTopBarState,
  normalizeChildIllnessSearchParams,
  parseChildIllnessRoute,
  resolveChildIllnessGuard,
} from "./child-illness/navigation";
import { SummaryCard, formatWeightValue } from "./child-illness/shared";

type CreateIllnessEpisodePayload = {
  started_at: string;
  title?: string | null;
  medication_mode: string;
  note?: string | null;
  temperatures: Array<{ value_celsius: number }>;
  administrations: Array<{
    household_medicine_id?: string | null;
    custom_medicine_name?: string | null;
    amount: string;
  }>;
  comments: Array<{ text: string }>;
  medication_plans: Array<{
    household_medicine_id?: string | null;
    custom_medicine_name?: string | null;
    dose_amount: string;
    min_interval_minutes: number;
    max_doses_per_day?: number | null;
    weight_kg?: number | null;
    dose_mg_per_kg?: number | null;
    notes?: string | null;
  }>;
};

export function ChildIllnessPage() {
  const { language } = useI18n();
  const { childId } = useParams<{ childId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountId = useAppStore((s) => s.accountId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const liveQueryOptions = useLiveQueryOptions(isIosShell ? 15_000 : 10_000);
  const [createEpisodeValidationError, setCreateEpisodeValidationError] = useState<string | null>(
    null
  );
  const createModeCardRef = useRef<HTMLDivElement>(null);
  const historySectionRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canViewIllness = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);
  const canActIllness = !!childId && canActChild(childId, accountFamilyRole, accountAccessPolicy);
  const canEditIllness = !!childId && canEditChild(childId, accountFamilyRole, accountAccessPolicy);
  const { data: familyAccess } = useQuery({
    queryKey: ["families", "me", "access", currentFamilyId],
    queryFn: fetchMyFamilyAccess,
    enabled: Boolean(currentFamilyId),
    staleTime: 60 * 1000,
  });
  const canManageSubscription = familyAccess?.canManageSubscription ?? false;
  const { upgradeToPlus, isUpgradePending, upgradeErrorMessage, clearUpgradeError } =
    useSubscriptionUpgrade(accountId, currentFamilyId, canManageSubscription);

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewIllness,
    ...liveQueryOptions,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId && canViewIllness,
    ...liveQueryOptions,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId && canViewIllness,
    ...liveQueryOptions,
  });

  const { data: activeEpisodeQuery, isFetched: isActiveEpisodeFetched } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId && canViewIllness,
    ...liveQueryOptions,
  });
  const activeEpisode = getActiveEpisodeFromList(episodes) ?? activeEpisodeQuery ?? null;

  const { data: activeEpisodeInsights = null } = useQuery({
    queryKey: ["illness-episode-insights", activeEpisode?.id],
    queryFn: () => fetchIllnessEpisodeInsights(activeEpisode!.id),
    enabled: !!activeEpisode?.id && canViewIllness,
    ...liveQueryOptions,
  });
  const { data: activeEpisodeMedicationPlans = [] } = useQuery({
    queryKey: ["episode-medication-plans", activeEpisode?.id, "live-activity"],
    queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(activeEpisode!.id),
    enabled: !!activeEpisode?.id && canViewIllness,
    ...liveQueryOptions,
  });
  const normalizedSearchParams = normalizeChildIllnessSearchParams(searchParams, {
    isActiveEpisodeFetched,
    hasActiveEpisode: Boolean(activeEpisode),
    activeEpisodeMedicationMode: activeEpisode?.medicationMode ?? null,
  });
  const route = parseChildIllnessRoute(normalizedSearchParams);
  const historyOnlyView = route.screen === "history";
  const historyEpisodeInsightsId = route.screen === "history" ? route.episodeId : null;
  const historyEpisodeInsightsMode = route.screen === "history" && Boolean(route.episodeId);
  const createMode = route.screen === "create";
  const illnessMutationLocksByPlan = childId
    ? isChildIllnessMutationLockedByPlan(childId, familyAccess, Boolean(activeEpisode))
    : false;
  const quickComposeMode =
    route.screen === "active" &&
    (route.focus === "temperature" || route.focus === "administration" || route.focus === "comment")
      ? route.focus
      : null;
  const quickTimelineMode = route.screen === "active" && route.focus === "timeline";
  const quickReminderMode = route.screen === "active" && route.focus === "reminders";
  const quickReminderCreateMode = route.screen === "active" && route.focus === "reminder-create";
  const quickReminderDetailMode = route.screen === "active" && route.focus === "reminder-detail";
  const reminderPlanId = route.screen === "active" ? route.reminderPlanId : null;
  const initialComposerMode = quickComposeMode ?? "temperature";

  useEffect(() => {
    if (!childId || canViewIllness) {
      return;
    }

    void stopLiveActivitiesForChildIds([childId]);
  }, [canViewIllness, childId]);

  useEffect(() => {
    if (!child) {
      return;
    }

    void syncIllnessLiveActivity(
      child,
      activeEpisode ?? null,
      activeEpisodeInsights,
      activeEpisodeMedicationPlans,
      null,
      language,
      undefined,
      accountId
    );
  }, [
    accountId,
    activeEpisode,
    activeEpisodeInsights,
    activeEpisodeMedicationPlans,
    child,
    language,
  ]);

  const { data: familyMembers = [] } = useQuery({
    queryKey: ["families", "me", "members", currentFamilyId],
    queryFn: fetchMyFamilyMembers,
    enabled: !!currentFamilyId,
    staleTime: 5 * 60 * 1000,
  });
  const eligibleIllnessRecipients =
    childId == null ? [] : getEligibleIllnessRecipients(familyMembers, childId);

  const closeEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) =>
      closeIllnessEpisodeResilient({ childId: childId!, episodeId }),
    onSuccess: (closedEpisode) => {
      clearIllnessStartHint(childId!);
      requestLiveActivityRefresh();
      if (closedEpisode) {
        upsertIllnessEpisodeForChild(queryClient, childId!, closedEpisode);
      } else {
        setIllnessEpisodesForChild(queryClient, childId!, (current) =>
          current.map((item) =>
            item.status === "active" ? { ...item, status: "closed" as const } : item
          )
        );
      }
      invalidateIllnessQueriesForChild(queryClient, childId!);
      navigate("/illnesses/active");
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (payload: {
      started_at: string;
      title?: string | null;
      medication_mode: string;
      note?: string | null;
      temperatures: Array<{ value_celsius: number }>;
      administrations: Array<{
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        amount: string;
      }>;
      comments: Array<{ text: string }>;
      medication_plans: Array<{
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        dose_amount: string;
        min_interval_minutes: number;
        max_doses_per_day?: number | null;
        weight_kg?: number | null;
        dose_mg_per_kg?: number | null;
        notes?: string | null;
      }>;
    }) =>
      createIllnessEpisodeResilient({
        childId: childId!,
        currentAccountId: accountId,
        payload,
      }),
    onSuccess: (episode, payload) => {
      setCreateEpisodeValidationError(null);
      const startedAtHint = new Date().toISOString();
      const shouldKeepExactStartedAt = shouldKeepIllnessTimerHint(
        payload.started_at,
        new Date(startedAtHint)
      );
      if (shouldKeepExactStartedAt) {
        setIllnessStartHint({
          childId: childId!,
          episodeId: episode.id,
          startedAt: startedAtHint,
        });
      } else {
        clearIllnessStartHint(childId!);
      }
      void trackIllnessEpisodeStarted(episode.id);
      requestLiveActivityRefresh();
      const episodeForUi = shouldKeepExactStartedAt
        ? {
            ...episode,
            startedAt: startedAtHint,
          }
        : episode;
      upsertIllnessEpisodeForChild(queryClient, childId!, episodeForUi);
      invalidateIllnessQueriesForChild(queryClient, childId!);
      navigate("/illnesses/active");
    },
    onError: async (error) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["illness-episodes", childId] }),
        queryClient.refetchQueries({ queryKey: ["illness-episode-active", childId] }),
      ]);

      const detail =
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "";
      if (detail.includes("активный эпизод")) {
        navigate("/illnesses/active");
      }
    },
  });

  useEffect(() => {
    if (!createMode || activeEpisode || historyOnlyView) {
      return;
    }

    const target = createModeCardRef.current;
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    });
  }, [activeEpisode, createMode, historyOnlyView]);

  useEffect(() => {
    if (!historyOnlyView || !historyEpisodeInsightsMode) {
      return;
    }
    if (typeof window === "undefined" || window.innerWidth >= 1024) {
      return;
    }

    const target = historySectionRef.current;
    if (!target) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - 12;
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    });
  }, [historyOnlyView, historyEpisodeInsightsMode]);

  const historyEpisodes = episodes.filter((episode) => episode.status === "closed");
  const focusedHistoryEpisode = historyEpisodeInsightsId
    ? (historyEpisodes.find((episode) => episode.id === historyEpisodeInsightsId) ?? null)
    : null;
  const normalizedSearch = normalizedSearchParams.toString();
  const normalizedUrl = childId
    ? `/children/${childId}/illness${normalizedSearch ? `?${normalizedSearch}` : ""}`
    : null;
  const selectedReminderPlanExists = reminderPlanId
    ? activeEpisodeMedicationPlans.some((plan) => plan.id === reminderPlanId)
    : null;
  const routeRedirect = childId
    ? resolveChildIllnessGuard({
        childId,
        route,
        canActIllness,
        canEditIllness,
        activeEpisode,
        isActiveEpisodeFetched,
        hasFocusedHistoryEpisode: historyEpisodeInsightsId ? Boolean(focusedHistoryEpisode) : true,
        hasSelectedReminderPlan: reminderPlanId ? selectedReminderPlanExists : null,
      })
    : null;

  if (!childId || !canViewIllness) {
    return <Navigate to="/children" replace />;
  }
  if (
    illnessMutationLocksByPlan &&
    !activeEpisode &&
    (createMode ||
      quickComposeMode !== null ||
      quickReminderMode ||
      quickReminderCreateMode ||
      quickReminderDetailMode)
  ) {
    return <Navigate to={`/children/${childId}`} replace />;
  }

  if (
    normalizedUrl &&
    normalizedSearch !== searchParams.toString() &&
    normalizedUrl !== `${location.pathname}${location.search}`
  ) {
    return <Navigate to={normalizedUrl} replace />;
  }

  if (routeRedirect && routeRedirect !== `${location.pathname}${location.search}`) {
    return <Navigate to={routeRedirect} replace />;
  }

  if (childLoading || !child) {
    return (
      <div>
        <p className="text-muted">{language === "ru" ? "Загрузка…" : "Loading…"}</p>
      </div>
    );
  }
  const childAgeLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const { href: backHref, label: backLabel } = buildChildIllnessBackState({
    language,
    childId: child.id,
    route,
    activeEpisode,
  });
  const hasBrowserBack =
    typeof window !== "undefined" &&
    (window.history.length > 1 ||
      (typeof window.history.state === "object" &&
        window.history.state !== null &&
        typeof (window.history.state as { idx?: unknown }).idx === "number" &&
        ((window.history.state as { idx: number }).idx ?? 0) > 0));
  const { title: topBarTitle, hint: topBarHint } = buildChildIllnessTopBarState({
    language,
    child,
    activeEpisode,
    route,
    historyEpisodesCount: historyEpisodes.length,
  });
  const handleBack = () => {
    if (hasBrowserBack) {
      navigate(-1);
      return;
    }
    navigate(backHref, { replace: true });
  };

  return (
    <div ref={rootRef} className="child-profile-shell min-h-[100dvh] space-y-7">
      <IosEdgeBackGesture isEnabled={isIosShell} onBack={handleBack} targetRef={rootRef} />
      <ChildSectionTopBar
        onBack={handleBack}
        backLabel={hasBrowserBack ? (language === "ru" ? "← Назад" : "← Back") : backLabel}
        title={topBarTitle}
        hint={topBarHint}
        containerClassName="max-w-5xl"
      />
      <UpgradeDialog
        isOpen={isUpgradeDialogOpen}
        language={language}
        entryPoint="child_actions_locked"
        isPending={isUpgradePending}
        canUpgrade={canManageSubscription}
        errorMessage={upgradeErrorMessage}
        onClose={() => {
          clearUpgradeError();
          setIsUpgradeDialogOpen(false);
        }}
        onUpgrade={() => {
          void upgradeToPlus().then(() => {
            setIsUpgradeDialogOpen(false);
          });
        }}
      />
      <div className="mx-auto w-full max-w-5xl space-y-7">
        <ChildIllnessShellSummary
          language={language}
          child={child}
          latestWeight={latestWeight}
          episodesCount={episodes.length}
          currentFamilyId={currentFamilyId}
          childAgeLabel={childAgeLabel}
          hidden={Boolean((activeEpisode || createMode) && !historyOnlyView)}
          compactForHistory={historyOnlyView}
        />

        {historyOnlyView ? (
          <div ref={historySectionRef}>
            <ChildIllnessHistoryScreen
              childId={childId}
              historyEpisodeInsightsMode={historyEpisodeInsightsMode}
              historyEpisodes={historyEpisodes}
              focusedHistoryEpisode={focusedHistoryEpisode}
              language={language}
            />
          </div>
        ) : activeEpisode ? (
          <ChildIllnessActiveScreen
            activeEpisode={activeEpisode}
            child={child}
            currentFamilyId={currentFamilyId}
            eligibleIllnessRecipients={eligibleIllnessRecipients}
            initialComposerMode={initialComposerMode}
            latestWeight={latestWeight}
            onClose={() => closeEpisodeMutation.mutate(activeEpisode.id)}
            quickComposeMode={quickComposeMode}
            quickReminderCreateMode={quickReminderCreateMode}
            quickReminderDetailMode={quickReminderDetailMode}
            quickReminderMode={quickReminderMode}
            quickTimelineMode={quickTimelineMode}
            reminderPlanId={reminderPlanId}
            planLocksChildActions={illnessMutationLocksByPlan}
            onLockedActionAttempt={() => setIsUpgradeDialogOpen(true)}
          />
        ) : createMode ? (
          <div ref={createModeCardRef}>
            <ChildIllnessCreateScreen
              createEpisodeMutation={createEpisodeMutation}
              createEpisodeValidationError={createEpisodeValidationError}
              language={language}
              navigate={navigate}
              setCreateEpisodeValidationError={setCreateEpisodeValidationError}
            />
          </div>
        ) : (
          <section className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
            {language === "ru"
              ? "Сейчас ничего не отслеживается. Новое наблюдение можно начать из раздела «Дети»."
              : "Nothing is being tracked right now. Start a new session from the Children section."}
          </section>
        )}
      </div>
    </div>
  );
}

function ChildIllnessShellSummary({
  language,
  child,
  latestWeight,
  episodesCount,
  currentFamilyId,
  childAgeLabel,
  hidden,
  compactForHistory,
}: {
  language: "ru" | "en";
  child: { birthDate?: string | null; name: string };
  latestWeight: { valueKg: number } | null;
  episodesCount: number;
  currentFamilyId: string | null;
  childAgeLabel: string | null;
  hidden: boolean;
  compactForHistory: boolean;
}) {
  if (hidden) {
    return null;
  }

  return (
    <section
      className={`soft-panel soft-hero relative overflow-hidden rounded-[28px] ${
        compactForHistory ? "hidden lg:block" : ""
      }`}
    >
      <div className="relative p-4 sm:p-5">
        <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-4">
          {childAgeLabel ? (
            <SummaryCard label={language === "ru" ? "Возраст" : "Age"} value={childAgeLabel} />
          ) : null}
          {child.birthDate ? (
            <SummaryCard
              label={language === "ru" ? "Дата рождения" : "Birth date"}
              value={formatChildDatePlain(child.birthDate, language, { forceYear: true })}
            />
          ) : null}
          {latestWeight ? (
            <SummaryCard
              label={language === "ru" ? "Вес" : "Weight"}
              value={formatWeightValue(latestWeight.valueKg, language)}
            />
          ) : null}
          <SummaryCard
            label={language === "ru" ? "Эпизоды" : "Episodes"}
            value={String(episodesCount)}
          />
        </div>

        {!currentFamilyId && (
          <div className="soft-note-warning mt-4 rounded-2xl px-4 py-3 text-sm">
            {language === "ru"
              ? "Семья не выбрана. Сначала открой страницу «Семья»."
              : "No family selected. Open the Family page first."}
          </div>
        )}
      </div>
    </section>
  );
}

function ChildIllnessActiveScreen({
  activeEpisode,
  child,
  currentFamilyId,
  eligibleIllnessRecipients,
  initialComposerMode,
  latestWeight,
  onClose,
  quickComposeMode,
  quickReminderCreateMode,
  quickReminderDetailMode,
  quickReminderMode,
  quickTimelineMode,
  reminderPlanId,
  planLocksChildActions,
  onLockedActionAttempt,
}: {
  activeEpisode: IllnessEpisode;
  child: { id: string; name: string };
  currentFamilyId: string | null;
  eligibleIllnessRecipients: FamilyMember[];
  initialComposerMode: "temperature" | "administration" | "comment";
  latestWeight: WeightEntry | null;
  onClose: () => void;
  quickComposeMode: "temperature" | "administration" | "comment" | null;
  quickReminderCreateMode: boolean;
  quickReminderDetailMode: boolean;
  quickReminderMode: boolean;
  quickTimelineMode: boolean;
  reminderPlanId: string | null;
  planLocksChildActions: boolean;
  onLockedActionAttempt: () => void;
}) {
  return (
    <section>
      <EpisodeBlock
        childName={child.name}
        childId={child.id}
        episode={activeEpisode}
        familyMembers={eligibleIllnessRecipients}
        onClose={onClose}
        familyId={currentFamilyId}
        latestWeight={latestWeight}
        initialComposerMode={initialComposerMode}
        quickComposeMode={quickComposeMode}
        quickTimelineMode={quickTimelineMode}
        quickReminderMode={quickReminderMode}
        quickReminderCreateMode={quickReminderCreateMode}
        quickReminderDetailMode={quickReminderDetailMode}
        reminderPlanId={reminderPlanId}
        planLocksChildActions={planLocksChildActions}
        onLockedActionAttempt={onLockedActionAttempt}
      />
    </section>
  );
}

function ChildIllnessCreateScreen({
  createEpisodeMutation,
  createEpisodeValidationError,
  language,
  navigate,
  setCreateEpisodeValidationError,
}: {
  createEpisodeMutation: UseMutationResult<
    IllnessEpisode,
    Error,
    CreateIllnessEpisodePayload,
    unknown
  >;
  createEpisodeValidationError: string | null;
  language: "ru" | "en";
  navigate: ReturnType<typeof useNavigate>;
  setCreateEpisodeValidationError: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <section className="space-y-3">
      <EpisodeActivationCard
        isPending={createEpisodeMutation.isPending}
        errorMessage={
          createEpisodeValidationError ??
          (
            createEpisodeMutation.error as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ??
          null
        }
        onActivate={(payload) => {
          if (isFutureDeviceDate(payload.started_at)) {
            setCreateEpisodeValidationError(
              language === "ru"
                ? `Дата начала не может быть позже даты на устройстве (${getLocalIsoDate()}).`
                : `Start date cannot be later than the device date (${getLocalIsoDate()}).`
            );
            return;
          }
          setCreateEpisodeValidationError(null);
          createEpisodeMutation.mutate(payload);
        }}
        onCancel={() => navigate("/children")}
      />
    </section>
  );
}

function ChildIllnessHistoryScreen({
  childId,
  historyEpisodeInsightsMode,
  historyEpisodes,
  focusedHistoryEpisode,
  language,
}: {
  childId: string;
  historyEpisodeInsightsMode: boolean;
  historyEpisodes: IllnessEpisode[];
  focusedHistoryEpisode: IllnessEpisode | null;
  language: "ru" | "en";
}) {
  return (
    <section className="space-y-3">
      {historyEpisodeInsightsMode && focusedHistoryEpisode ? (
        <HistoryEpisodeInsightsScreen episode={focusedHistoryEpisode} />
      ) : null}

      {!historyEpisodeInsightsMode && <HistoryInsightsPreview childId={childId} />}

      {!historyEpisodeInsightsMode && historyEpisodes.length > 0 ? (
        <ul className="grid gap-2.5">
          {historyEpisodes.map((episode) => (
            <HistoryEpisodeCard
              key={episode.id}
              childId={childId}
              episode={episode}
              episodeNumber={
                historyEpisodes.length - historyEpisodes.findIndex((item) => item.id === episode.id)
              }
            />
          ))}
        </ul>
      ) : !historyEpisodeInsightsMode ? (
        <div className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
          {language === "ru" ? "История пока пустая." : "History is still empty."}
        </div>
      ) : null}
    </section>
  );
}
