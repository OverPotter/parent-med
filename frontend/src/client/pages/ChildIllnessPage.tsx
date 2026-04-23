/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodeInsights,
  fetchIllnessEpisodesByChildId,
} from "@shared/api/illnessEpisodes";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchMyFamilyMembers } from "@shared/api/families";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { trackIllnessEpisodeStarted } from "@shared/analytics";
import { getEligibleIllnessRecipients } from "@shared/familyAccess/recipients";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import {
  canActChild,
  canEditChild,
  canViewChild,
} from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import type { IllnessEpisode } from "@shared/types/api";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";
import { stopLiveActivitiesForChildIds, syncIllnessLiveActivity } from "@shared/utils/liveActivities";
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
import { formatChildDatePlain } from "@client/utils/childDateFormat";
import { EpisodeActivationCard } from "./child-illness/forms";
import {
  HistoryEpisodeCard,
  HistoryEpisodeInsightsScreen,
  HistoryInsightsPreview,
} from "./child-illness/history";
import { EpisodeBlock } from "./child-illness/EpisodeBlock";
import {
  buildChildIllnessBackState,
  buildChildIllnessTopBarState,
  normalizeChildIllnessSearchParams,
} from "./child-illness/navigation";
import { SummaryCard, formatWeightValue } from "./child-illness/shared";

export function ChildIllnessPage() {
  const { language } = useI18n();
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isIosShell = useIsIosShell();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const accountId = useAppStore((s) => s.accountId);
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
  const queryClient = useQueryClient();
  const historyOnlyView = searchParams.get("view") === "history";
  const historyEpisodeInsightsId = historyOnlyView ? searchParams.get("episodeId") : null;
  const historyEpisodeInsightsMode = Boolean(historyEpisodeInsightsId);
  const createMode = searchParams.get("mode") === "create";
  const focusMode = searchParams.get("focus") ?? searchParams.get("compose");
  const quickComposeMode =
    focusMode === "temperature" || focusMode === "administration" || focusMode === "comment"
      ? focusMode
      : null;
  const quickTimelineMode = focusMode === "timeline";
  const quickReminderMode = focusMode === "reminders";
  const quickReminderCreateMode = focusMode === "reminder-create";
  const quickReminderDetailMode = focusMode === "reminder-detail";
  const reminderPlanId = searchParams.get("plan");
  const initialComposerMode = quickComposeMode ?? "temperature";
  const liveQueryOptions = useLiveQueryOptions(isIosShell ? 15_000 : 10_000);
  const [createEpisodeValidationError, setCreateEpisodeValidationError] = useState<string | null>(null);
  const createModeCardRef = useRef<HTMLDivElement | null>(null);
  const historySectionRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canViewIllness = !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);
  const canActIllness = !!childId && canActChild(childId, accountFamilyRole, accountAccessPolicy);
  const canEditIllness =
    !!childId && canEditChild(childId, accountFamilyRole, accountAccessPolicy);

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

  const { data: activeEpisode, isFetched: isActiveEpisodeFetched } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId && canViewIllness,
    ...liveQueryOptions,
  });

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

  useEffect(() => {
    const normalized = normalizeChildIllnessSearchParams(searchParams, {
      isActiveEpisodeFetched,
      hasActiveEpisode: Boolean(activeEpisode),
      activeEpisodeMedicationMode: activeEpisode?.medicationMode ?? null,
    });
    if (normalized.toString() !== searchParams.toString()) {
      setSearchParams(normalized, { replace: true });
    }
  }, [activeEpisode, isActiveEpisodeFetched, searchParams, setSearchParams]);

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
  }, [accountId, activeEpisode, activeEpisodeInsights, activeEpisodeMedicationPlans, child, language]);

  useEffect(() => {
    const hasAccessToRequestedMode = createMode || quickReminderCreateMode ? canEditIllness : canActIllness;
    if (hasAccessToRequestedMode || !childId) {
      return;
    }

    if (createMode) {
      navigate(activeEpisode ? "/illnesses/active" : `/children/${childId}/illness`, {
        replace: true,
      });
      return;
    }

    if (quickComposeMode) {
      navigate(activeEpisode ? "/illnesses/active" : `/children/${childId}/illness`, {
        replace: true,
      });
      return;
    }

    if (quickReminderCreateMode) {
      navigate(
        activeEpisode ? `/children/${childId}/illness?focus=reminders` : `/children/${childId}/illness`,
        {
          replace: true,
        }
      );
    }
  }, [
    activeEpisode,
    canActIllness,
    canEditIllness,
    childId,
    createMode,
    navigate,
    quickComposeMode,
    quickReminderCreateMode,
  ]);

  useEffect(() => {
    if (
      !isActiveEpisodeFetched ||
      !activeEpisode ||
      historyOnlyView ||
      createMode ||
      quickComposeMode ||
      quickTimelineMode ||
      quickReminderMode ||
      quickReminderCreateMode ||
      quickReminderDetailMode
    ) {
      return;
    }

    navigate("/illnesses/active", { replace: true });
  }, [
    activeEpisode,
    createMode,
    historyOnlyView,
    isActiveEpisodeFetched,
    navigate,
    quickComposeMode,
    quickReminderCreateMode,
    quickReminderDetailMode,
    quickReminderMode,
    quickTimelineMode,
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
      queryClient.setQueryData(["illness-episode-active", childId], null);
      queryClient.setQueryData<IllnessEpisode[]>(["illness-episodes", childId], (current) =>
        (current ?? []).map((item) => (closedEpisode && item.id === closedEpisode.id ? closedEpisode : item))
      );
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
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
      const episodeForUi =
        shouldKeepExactStartedAt
          ? {
              ...episode,
              startedAt: startedAtHint,
            }
          : episode;
      queryClient.setQueryData(["illness-episode-active", childId], episodeForUi);
      queryClient.setQueryData<IllnessEpisode[]>(["illness-episodes", childId], (current) => {
        const items = current ?? [];
        if (items.some((item) => item.id === episode.id)) {
          return items.map((item) => (item.id === episode.id ? episodeForUi : item));
        }
        return [episodeForUi, ...items];
      });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
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
  useEffect(() => {
    if (!historyOnlyView) {
      return;
    }

    if (historyEpisodeInsightsId && !focusedHistoryEpisode) {
      setSearchParams(new URLSearchParams([["view", "history"]]), { replace: true });
    }
  }, [focusedHistoryEpisode, historyEpisodeInsightsId, historyOnlyView, setSearchParams]);

  if (!childId || !canViewIllness) {
    return <Navigate to="/children" replace />;
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
    searchParams,
    activeEpisode,
    historyOnlyView,
    historyEpisodeInsightsMode,
    createMode,
    quickComposeMode,
    quickTimelineMode,
    quickReminderMode,
    quickReminderCreateMode,
    quickReminderDetailMode,
    reminderPlanId,
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
    historyOnlyView,
    historyEpisodeInsightsMode,
    historyEpisodesCount: historyEpisodes.length,
    createMode,
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
      <div className="mx-auto w-full max-w-5xl space-y-7">
        {((!activeEpisode && !createMode) || historyOnlyView) && (
          <section
            className={`soft-panel soft-hero relative overflow-hidden rounded-[28px] ${
              historyOnlyView ? "hidden lg:block" : ""
            }`}
          >
            <div className="relative p-4 sm:p-5">
              <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-4">
                {childAgeLabel ? (
                  <SummaryCard
                    label={language === "ru" ? "Возраст" : "Age"}
                    value={childAgeLabel}
                  />
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
                  value={String(episodes.length)}
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
        )}

        {activeEpisode && !historyOnlyView && (
          <section>
            <EpisodeBlock
              childName={child.name}
              childId={child.id}
              episode={activeEpisode}
              familyMembers={eligibleIllnessRecipients}
              onClose={() => closeEpisodeMutation.mutate(activeEpisode.id)}
              familyId={currentFamilyId}
              latestWeight={latestWeight}
              initialComposerMode={initialComposerMode}
              quickComposeMode={quickComposeMode}
              quickTimelineMode={quickTimelineMode}
              quickReminderMode={quickReminderMode}
              quickReminderCreateMode={quickReminderCreateMode}
              quickReminderDetailMode={quickReminderDetailMode}
              reminderPlanId={reminderPlanId}
            />
          </section>
        )}

        {!activeEpisode && createMode && !historyOnlyView && (
          <section className="space-y-3">
            <div ref={createModeCardRef}>
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
            </div>
          </section>
        )}

        {!activeEpisode && !createMode && !historyOnlyView && (
          <section className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
            {language === "ru"
              ? "Сейчас ничего не отслеживается. Новое наблюдение можно начать из раздела «Дети»."
              : "Nothing is being tracked right now. Start a new session from the Children section."}
          </section>
        )}

        {historyOnlyView && (
          <section ref={historySectionRef} className="space-y-3">
            {historyEpisodeInsightsMode && focusedHistoryEpisode ? (
              <HistoryEpisodeInsightsScreen episode={focusedHistoryEpisode} />
            ) : null}

            {!historyEpisodeInsightsMode && <HistoryInsightsPreview childId={child.id} />}

            {!historyEpisodeInsightsMode && historyEpisodes.length > 0 ? (
              <ul className="grid gap-2.5">
                {historyEpisodes.map((episode) => (
                  <HistoryEpisodeCard
                    key={episode.id}
                    childId={childId}
                    episode={episode}
                    episodeNumber={
                      historyEpisodes.length -
                      historyEpisodes.findIndex((item) => item.id === episode.id)
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
        )}
      </div>
    </div>
  );
}
