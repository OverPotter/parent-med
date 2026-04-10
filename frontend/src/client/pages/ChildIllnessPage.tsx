/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdministrationEventsByEpisodeId,
  createAdministrationEvent,
} from "@shared/api/administrationEvents";
import { fetchChild } from "@shared/api/children";
import {
  createEpisodeMedicationPlan,
  deleteEpisodeMedicationPlan,
  fetchEpisodeMedicationPlansByEpisodeId,
  updateEpisodeMedicationPlan,
} from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { createIllnessComment, fetchIllnessCommentsByEpisodeId } from "@shared/api/illnessComments";
import {
  createIllnessEpisode,
  deleteIllnessEpisode,
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodeInsights,
  fetchIllnessEpisodesByChildId,
  fetchIllnessHistorySummary,
  updateIllnessEpisode,
} from "@shared/api/illnessEpisodes";
import {
  fetchTemperatureEntriesByEpisodeId,
  createTemperatureEntry,
} from "@shared/api/temperatureEntries";
import { createWeightEntry, fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import {
  trackIllnessEpisodeStarted,
  trackMedicationAdministered,
  trackTemperatureLogged,
} from "@shared/analytics";
import { DateField } from "@shared/components/DateField";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { DisclosureHeader } from "@shared/components/DisclosureHeader";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  AdministrationEvent,
  EpisodeMedicationPlan,
  HouseholdMedicine,
  IllnessEpisodeInsights,
  IllnessComment,
  IllnessEpisode,
  TemperatureEntry,
  WeightEntry,
} from "@shared/types/api";
import {
  buildPlanAdministrationStats,
  buildWeightDoseHint,
  formatRelativeDateTime,
  formatIntervalForDisplay,
  getAdministrationActorLabel,
  getPrioritizedMedicationPlanItems,
  type MedicationPlanPriorityItem,
} from "../utils/medicationPlans";
import { formatDate, formatDateTime, getLocalIsoDate } from "@shared/utils/date";
import { formatChildAgeLabel } from "@client/i18n/children";

const appBtnPrimaryClass =
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";
const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5";
const appBtnDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex items-center justify-center px-4";

const QUICK_FOCUS_VALUES = new Set([
  "temperature",
  "administration",
  "comment",
  "timeline",
  "reminders",
  "reminder-create",
  "reminder-detail",
]);

function normalizeChildIllnessSearchParams(
  source: URLSearchParams,
  options: { isActiveEpisodeFetched: boolean; hasActiveEpisode: boolean }
): URLSearchParams {
  const next = new URLSearchParams();
  const view = source.get("view");
  const mode = source.get("mode");
  const episodeId = source.get("episodeId");
  const focus = source.get("focus") ?? source.get("compose");
  const plan = source.get("plan");

  if (view === "history") {
    next.set("view", "history");
    if (episodeId) {
      next.set("episodeId", episodeId);
      return next;
    }
    if (mode === "analytics") {
      next.set("mode", "analytics");
    }
    return next;
  }

  const canKeepCreateMode =
    mode === "create" && (!options.isActiveEpisodeFetched || !options.hasActiveEpisode);
  if (canKeepCreateMode) {
    next.set("mode", "create");
    return next;
  }

  if (!focus || !QUICK_FOCUS_VALUES.has(focus)) {
    return next;
  }

  if (focus === "reminder-detail") {
    if (!plan) {
      next.set("focus", "reminders");
      return next;
    }
    next.set("focus", "reminder-detail");
    next.set("plan", plan);
    return next;
  }

  next.set("focus", focus);
  return next;
}

export function ChildIllnessPage() {
  const { language } = useI18n();
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const [openHistoryEpisodeId, setOpenHistoryEpisodeId] = useState<string | null>(null);
  const historyOnlyView = searchParams.get("view") === "history";
  const historyMode = searchParams.get("mode");
  const historyAnalyticsMode = historyOnlyView && historyMode === "analytics";
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
  const liveQueryOptions = useLiveQueryOptions(3000);
  const createModeCardRef = useRef<HTMLDivElement | null>(null);
  const historySectionRef = useRef<HTMLElement | null>(null);

  const { data: child, isLoading: childLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: latestWeight = null } = useQuery({
    queryKey: ["weight-entry-latest", childId],
    queryFn: () => fetchLatestWeightEntryByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  const { data: activeEpisode, isFetched: isActiveEpisodeFetched } = useQuery({
    queryKey: ["illness-episode-active", childId],
    queryFn: () => fetchActiveIllnessEpisodeByChildId(childId!),
    enabled: !!childId,
    ...liveQueryOptions,
  });

  useEffect(() => {
    const normalized = normalizeChildIllnessSearchParams(searchParams, {
      isActiveEpisodeFetched,
      hasActiveEpisode: Boolean(activeEpisode),
    });
    if (normalized.toString() !== searchParams.toString()) {
      setSearchParams(normalized, { replace: true });
    }
  }, [activeEpisode, isActiveEpisodeFetched, searchParams, setSearchParams]);

  const { data: familyMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: (episodeId: string) => updateIllnessEpisode(episodeId, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      navigate("/children");
    },
  });
  const createEpisodeMutation = useMutation({
    mutationFn: async (payload: {
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
    }) => {
      const episode = await createIllnessEpisode({
        child_id: childId!,
        started_at: payload.started_at,
        title: payload.title,
        medication_mode: payload.medication_mode,
        note: payload.note,
      });

      await Promise.all([
        ...payload.temperatures.map((item) =>
          createTemperatureEntry({
            episode_id: episode.id,
            value_celsius: item.value_celsius,
          })
        ),
        ...payload.administrations.map((item) =>
          createAdministrationEvent({
            episode_id: episode.id,
            household_medicine_id: item.household_medicine_id,
            custom_medicine_name: item.custom_medicine_name,
            amount: item.amount,
          })
        ),
        ...payload.comments.map((item) =>
          createIllnessComment({
            episode_id: episode.id,
            text: item.text,
          })
        ),
        ...payload.medication_plans.map((item) =>
          createEpisodeMedicationPlan({
            episode_id: episode.id,
            household_medicine_id: item.household_medicine_id,
            custom_medicine_name: item.custom_medicine_name,
            dose_amount: item.dose_amount,
            min_interval_minutes: item.min_interval_minutes,
            max_doses_per_day: item.max_doses_per_day ?? null,
            weight_kg: item.weight_kg ?? null,
            dose_mg_per_kg: item.dose_mg_per_kg ?? null,
            notes: item.notes ?? null,
          })
        ),
      ]);

      return episode;
    },
    onSuccess: (episode) => {
      void trackIllnessEpisodeStarted(episode.id);
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
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

    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    });
  }, [activeEpisode, createMode, historyOnlyView]);

  useEffect(() => {
    if (!historyOnlyView || (!historyAnalyticsMode && !historyEpisodeInsightsMode)) {
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
  }, [historyOnlyView, historyAnalyticsMode, historyEpisodeInsightsMode]);

  if (!childId || childLoading || !child) {
    return (
      <div>
        <p className="text-muted">{language === "ru" ? "Загрузка…" : "Loading…"}</p>
      </div>
    );
  }

  const historyEpisodes = episodes.filter((episode) => episode.status === "closed");
  const focusedHistoryEpisode = historyEpisodeInsightsId
    ? (historyEpisodes.find((episode) => episode.id === historyEpisodeInsightsId) ?? null)
    : null;
  const visibleHistoryEpisodes = openHistoryEpisodeId
    ? historyEpisodes.filter((episode) => episode.id === openHistoryEpisodeId)
    : historyEpisodes;
  const childAgeLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const backHref = activeEpisode && !historyOnlyView ? "/illnesses/active" : "/children";
  const backLabel =
    activeEpisode && !historyOnlyView
      ? language === "ru"
        ? "← К наблюдениям"
        : "← Back to tracking"
      : language === "ru"
        ? "← К списку детей"
        : "← Back to children";

  return (
    <div className="min-w-0 space-y-7">
      <Link to={backHref} className="inline-flex text-sm text-primary hover:underline">
        {backLabel}
      </Link>

      {((!activeEpisode && !createMode) || historyOnlyView) && (
        <section
          className={`soft-panel soft-hero relative overflow-hidden rounded-[28px] ${
            historyOnlyView ? "hidden lg:block" : ""
          }`}
        >
          <div className="relative p-4 sm:p-5">
            <div className="min-w-0">
              <h1 className="app-title text-[2rem] sm:text-[2.5rem]">{child.name}</h1>
              <p className="mt-3 text-sm text-muted lg:hidden">
                {historyOnlyView
                  ? language === "ru"
                    ? "Завершённые наблюдения по ребёнку."
                    : "Completed tracking for this child."
                  : createMode
                    ? language === "ru"
                      ? "Заполните короткую карточку и начните наблюдение."
                      : "Fill in a short card and start tracking."
                    : language === "ru"
                      ? "Сейчас активного наблюдения нет."
                      : "There is no active tracking right now."}
              </p>
            </div>

            <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-4">
              {childAgeLabel ? (
                <SummaryCard label={language === "ru" ? "Возраст" : "Age"} value={childAgeLabel} />
              ) : null}
              {child.birthDate ? (
                <SummaryCard
                  label={language === "ru" ? "Дата рождения" : "Birth date"}
                  value={formatDate(child.birthDate)}
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
          <SectionTitle
            title={language === "ru" ? "Новое наблюдение" : "New tracking"}
            subtitle={
              language === "ru"
                ? "Сначала просто начните наблюдение. Температуру, лекарства и напоминания можно добавить уже внутри записи."
                : "Start with a tracking session first. Temperature, medicines and reminders can be added inside it."
            }
          />
          <div ref={createModeCardRef}>
            <EpisodeActivationCard
              childName={child.name}
              isPending={createEpisodeMutation.isPending}
              errorMessage={
                (
                  createEpisodeMutation.error as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail ?? null
              }
              onActivate={(payload) => createEpisodeMutation.mutate(payload)}
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
          <SectionTitle
            title={`${language === "ru" ? "История" : "History"}${child.name ? ` · ${child.name}` : ""}`}
            subtitle={
              historyAnalyticsMode
                ? language === "ru"
                  ? "Сводка по завершённым эпизодам."
                  : "Summary of completed episodes."
                : historyEpisodeInsightsMode
                  ? language === "ru"
                    ? "Подробный разбор конкретного эпизода."
                    : "Detailed breakdown of a specific episode."
                  : openHistoryEpisodeId
                    ? language === "ru"
                      ? "Открыта одна запись."
                      : "One record is open."
                    : historyEpisodes.length > 0
                      ? language === "ru"
                        ? "Завершённые наблюдения по ребёнку."
                        : "Completed tracking records for this child."
                      : language === "ru"
                        ? "Завершённых наблюдений пока нет."
                        : "No completed tracking yet."
            }
          />

          {!historyEpisodeInsightsMode && (
            <div className="grid gap-2 sm:grid-cols-2 lg:max-w-[30rem]">
              <Link
                to={`/children/${child.id}/illness?view=history`}
                className={`inline-flex min-h-[3rem] items-center justify-center rounded-[20px] px-4 text-center text-[0.92rem] leading-[1.1] tracking-[-0.025em] sm:min-h-[3.2rem] sm:px-5 sm:text-[0.98rem] ${
                  historyAnalyticsMode ? "soft-button-secondary" : "soft-button-primary"
                }`}
              >
                {language === "ru" ? "Вся история" : "Full history"}
              </Link>
              <Link
                to={`/children/${child.id}/illness?view=history&mode=analytics`}
                className={`inline-flex min-h-[3rem] items-center justify-center rounded-[20px] px-4 text-center text-[0.92rem] leading-[1.1] tracking-[-0.025em] sm:min-h-[3.2rem] sm:px-5 sm:text-[0.98rem] ${
                  historyAnalyticsMode ? "soft-button-primary" : "soft-button-secondary"
                }`}
              >
                {language === "ru" ? "Аналитика" : "Analytics"}
              </Link>
            </div>
          )}

          {historyEpisodeInsightsMode && focusedHistoryEpisode ? (
            <HistoryEpisodeInsightsScreen childId={child.id} episode={focusedHistoryEpisode} />
          ) : historyAnalyticsMode ? (
            <HistoryInsightsPreview childId={child.id} />
          ) : openHistoryEpisodeId ? (
            <div className="soft-panel-muted flex flex-wrap items-center justify-between gap-3 rounded-[24px] px-4 py-3">
              <p className="text-sm text-muted">
                {language === "ru"
                  ? `Показана 1 запись из ${historyEpisodes.length}.`
                  : `Showing 1 record out of ${historyEpisodes.length}.`}
              </p>
              <button
                type="button"
                onClick={() => setOpenHistoryEpisodeId(null)}
                className="soft-button-secondary rounded-2xl px-3 py-1.5 text-sm"
              >
                {language === "ru" ? "Показать всю историю" : "Show full history"}
              </button>
            </div>
          ) : null}

          {!historyAnalyticsMode && !historyEpisodeInsightsMode && historyEpisodes.length > 0 ? (
            <ul className="grid gap-4">
              {visibleHistoryEpisodes.map((episode) => (
                <HistoryEpisodeCard
                  key={episode.id}
                  childId={childId}
                  episode={episode}
                  episodeNumber={
                    historyEpisodes.length -
                    historyEpisodes.findIndex((item) => item.id === episode.id)
                  }
                  isOpen={openHistoryEpisodeId === episode.id}
                  medicines={familyMedicines}
                  onDeleted={() => setOpenHistoryEpisodeId(null)}
                  onToggle={() =>
                    setOpenHistoryEpisodeId((current) =>
                      current === episode.id ? null : episode.id
                    )
                  }
                />
              ))}
            </ul>
          ) : !historyAnalyticsMode && !historyEpisodeInsightsMode ? (
            <div className="soft-empty rounded-[28px] px-5 py-8 text-sm text-muted">
              {language === "ru" ? "История пока пустая." : "History is still empty."}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function InfoPill({ label }: { label: string }) {
  return <span className="soft-pill rounded-full px-3 py-1 text-sm">{label}</span>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel-muted rounded-[22px] px-4 py-3">
      <p className="text-xs tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-foreground">{value}</p>
    </div>
  );
}

function HistoryInsightsPreview({ childId }: { childId: string }) {
  const { language } = useI18n();
  const periodOptions = [
    {
      key: "month",
      label: language === "ru" ? "Месяц" : "Month",
      shortLabel: language === "ru" ? "1м" : "1m",
    },
    {
      key: "quarter",
      label: language === "ru" ? "3 месяца" : "3 months",
      shortLabel: language === "ru" ? "3м" : "3m",
    },
    {
      key: "half_year",
      label: language === "ru" ? "6 месяцев" : "6 months",
      shortLabel: language === "ru" ? "6м" : "6m",
    },
    {
      key: "year",
      label: language === "ru" ? "Год" : "Year",
      shortLabel: language === "ru" ? "1г" : "1y",
    },
    {
      key: "all",
      label: language === "ru" ? "Всё время" : "All time",
      shortLabel: language === "ru" ? "всё" : "all",
    },
  ] as const;
  const [selectedPeriod, setSelectedPeriod] =
    useState<(typeof periodOptions)[number]["key"]>("half_year");
  const liveQueryOptions = useLiveQueryOptions(10000);
  const { data: summary, isLoading } = useQuery({
    queryKey: ["illness-history-summary", childId, selectedPeriod],
    queryFn: () => fetchIllnessHistorySummary(childId, selectedPeriod),
    enabled: !!childId,
    ...liveQueryOptions,
  });
  const timelineMeta = getHistoryTimelineMeta(selectedPeriod, language);

  if (isLoading || !summary) {
    return (
      <div className="soft-panel-muted rounded-[28px] px-5 py-8 text-sm text-muted">
        {language === "ru" ? "Готовим сводку…" : "Preparing summary…"}
      </div>
    );
  }

  const frequencyCards = [
    {
      label:
        selectedPeriod === "month"
          ? language === "ru"
            ? "Эпизодов за месяц"
            : "Episodes this month"
          : selectedPeriod === "quarter"
            ? language === "ru"
              ? "Эпизодов за 3 месяца"
              : "Episodes in 3 months"
            : selectedPeriod === "half_year"
              ? language === "ru"
                ? "Эпизодов за 6 месяцев"
                : "Episodes in 6 months"
              : selectedPeriod === "year"
                ? language === "ru"
                  ? "Эпизодов за год"
                  : "Episodes this year"
                : language === "ru"
                  ? "Эпизодов за всё время"
                  : "Episodes overall",
      value: String(summary.episodeCount),
    },
    {
      label: language === "ru" ? "Без болезни" : "Without illness",
      value:
        summary.daysSinceLastEpisode !== null
          ? language === "ru"
            ? `${summary.daysSinceLastEpisode} дн.`
            : `${summary.daysSinceLastEpisode} days`
          : language === "ru"
            ? "Нет данных"
            : "No data",
    },
    {
      label:
        selectedPeriod === "month"
          ? language === "ru"
            ? "Период наблюдения"
            : "Observation window"
          : language === "ru"
            ? "Самый активный период"
            : "Most active period",
      value:
        selectedPeriod === "month"
          ? language === "ru"
            ? "30 дней"
            : "30 days"
          : (translateAnalyticsLabel(summary.mostActivePeriodLabel, language) ??
            (language === "ru" ? "Нет данных" : "No data")),
    },
  ];
  const severityCards = [
    {
      label: language === "ru" ? "Средняя длительность" : "Average duration",
      value: formatDurationValue(summary.averageDurationDays, language),
    },
    {
      label: language === "ru" ? "Самый долгий эпизод" : "Longest episode",
      value: formatDurationValue(summary.longestDurationDays, language),
    },
  ];
  const behaviorCards = [
    {
      label: language === "ru" ? "Эпизодов с лекарствами" : "Episodes with medication",
      value: String(summary.episodesWithAdministrations),
    },
    {
      label: language === "ru" ? "С напоминаниями" : "With reminders",
      value: String(summary.guidedEpisodes),
    },
  ];
  const overallInsight =
    summary.daysSinceLastEpisode !== null && summary.daysSinceLastEpisode >= 60
      ? language === "ru"
        ? "Сейчас спокойно: новых эпизодов давно не было."
        : "Things look calm right now: there have been no recent episodes."
      : summary.averageDurationDays >= 6
        ? language === "ru"
          ? "Эпизоды тянутся дольше обычного. Важно следить за длительностью и повторяемостью."
          : "Episodes are lasting longer than usual. Duration and recurrence deserve attention."
        : summary.episodeCount >= 3 && selectedPeriod !== "all"
          ? language === "ru"
            ? "За выбранный период эпизодов уже заметно много."
            : "There have already been quite a few episodes in this period."
          : language === "ru"
            ? "Сводка выглядит ровно: видно частоту, длительность и общую динамику."
            : "The summary looks balanced: frequency, duration and overall trend are clear.";

  return (
    <div className="space-y-4">
      <div className="soft-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="app-card-title">
              {language === "ru" ? "Общая сводка" : "Overall summary"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {language === "ru"
                ? "Как часто ребёнок болел и как это менялось со временем."
                : "How often the child got sick and how it changed over time."}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">{overallInsight}</p>
          </div>
          <span className="soft-pill rounded-full px-3.5 py-1.5 text-xs font-medium">
            {summary.totalClosedEpisodes}{" "}
            {language === "ru" ? "эпизодов в архиве" : "episodes in archive"}
          </span>
        </div>

        <div className="sticky top-2 z-10 -mx-1 mt-4 overflow-x-auto px-1 pb-1 sm:static sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div className="inline-flex min-w-full gap-2 sm:flex sm:min-w-0 sm:flex-wrap">
            {periodOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedPeriod(item.key)}
                className={[
                  selectedPeriod === item.key ? "soft-tab-active" : "soft-tab",
                  "min-h-[2.65rem] shrink-0 rounded-full px-3 text-[0.9rem] tracking-[-0.025em] sm:min-h-[2.95rem] sm:px-4 sm:text-sm",
                ].join(" ")}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <SectionTitle
          title={language === "ru" ? "Частота" : "Frequency"}
          subtitle={
            language === "ru"
              ? "Сколько эпизодов было за выбранный период."
              : "How many episodes happened in the selected period."
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {frequencyCards.map((item) => (
            <AnalyticsCard key={item.label} label={item.label} value={item.value} tone="default" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle title={timelineMeta.sectionTitle} subtitle={timelineMeta.sectionSubtitle} />

        <div className="soft-panel rounded-[28px] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="app-card-title">{timelineMeta.chartTitle}</h4>
              <p className="mt-1 text-sm leading-6 text-muted">{timelineMeta.chartDescription}</p>
            </div>
            <span className="soft-pill rounded-full px-3 py-1 text-xs">
              {periodOptions.find((item) => item.key === selectedPeriod)?.label}
            </span>
          </div>
          <div className="mt-5">
            <MiniHistoryBars
              items={summary.timeline.map((item) => ({
                ...item,
                label: translateAnalyticsLabel(item.label, language) ?? item.label,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle
          title={language === "ru" ? "Как проходили эпизоды" : "How episodes went"}
          subtitle={
            language === "ru"
              ? "Насколько короткими или длительными они были."
              : "How short or long the episodes were."
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {severityCards.map((item) => (
            <AnalyticsCard key={item.label} label={item.label} value={item.value} tone="accent" />
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="soft-panel rounded-[28px] p-4 sm:p-5">
          <h4 className="app-card-title">
            {language === "ru" ? "Сколько обычно длилось" : "Typical duration"}
          </h4>
          <p className="mt-1 text-sm leading-6 text-muted">
            {language === "ru"
              ? "Короткие, средние и более длительные эпизоды за этот период."
              : "Short, medium and longer episodes in this period."}
          </p>
          <div className="mt-5 space-y-3">
            {summary.durationBuckets.map((item) => (
              <StatRow
                key={item.label}
                label={translateAnalyticsLabel(item.label, language) ?? item.label}
                value={item.value}
                max={Math.max(...summary.durationBuckets.map((bucket) => bucket.value), 1)}
              />
            ))}
          </div>
        </div>

        <div className="soft-panel rounded-[28px] p-4 sm:p-5">
          <h4 className="app-card-title">
            {language === "ru" ? "Что обычно делали" : "What usually happened"}
          </h4>
          <p className="mt-1 text-sm leading-6 text-muted">
            {language === "ru"
              ? "Лекарства и напоминания за этот период."
              : "Medication and reminders in this period."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {behaviorCards.map((item) => (
              <AnalyticsCard key={item.label} label={item.label} value={item.value} tone="soft" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "accent" | "soft";
}) {
  const toneClass =
    tone === "accent" ? "soft-panel" : tone === "soft" ? "soft-panel-muted" : "soft-card";

  return (
    <div className={`${toneClass} rounded-[22px] px-4 py-4 sm:px-5`}>
      <p className="text-[0.82rem] leading-5 text-muted sm:text-sm">{label}</p>
      <p className="app-card-title mt-2 text-[1rem] sm:text-[1.04rem]">{value}</p>
    </div>
  );
}

function MiniHistoryBars({ items }: { items: Array<{ label: string; value: number }> }) {
  const rawMaxValue = Math.max(...items.map((item) => item.value), 1);
  const scaleMax = Math.max(3, rawMaxValue);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isEmpty = item.value === 0;
        const width = isEmpty ? 0 : Math.max(10, Math.round((item.value / scaleMax) * 100));

        return (
          <div
            key={item.label}
            className="grid grid-cols-[3rem_minmax(0,1fr)_2rem] items-center gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_2.5rem]"
          >
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <div className="relative h-3 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_7%,white)]">
              <div className="pointer-events-none absolute inset-0 rounded-full border border-[color:color-mix(in_srgb,var(--color-border)_78%,transparent)]" />
              {isEmpty ? (
                <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[color:color-mix(in_srgb,var(--color-border)_70%,transparent)]" />
              ) : (
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-primary)_66%,white_22%)_0%,color-mix(in_srgb,var(--color-primary)_88%,black_4%)_100%)]"
                  style={{ width: `${width}%` }}
                />
              )}
            </div>
            <span className="text-right text-sm font-medium text-muted">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(10, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_2rem] sm:items-center">
      <span className="text-sm text-foreground">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full border border-[color:color-mix(in_srgb,var(--color-border)_76%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_7%,white)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-primary)_68%,white_20%)_0%,color-mix(in_srgb,var(--color-primary)_88%,black_4%)_100%)]"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted">{value}</span>
    </div>
  );
}

function getHistoryTimelineMeta(
  period: "month" | "quarter" | "half_year" | "year" | "all",
  language: "ru" | "en"
) {
  if (period === "month") {
    return {
      sectionTitle: language === "ru" ? "За месяц" : "This month",
      sectionSubtitle:
        language === "ru"
          ? "На каких неделях за последние 30 дней были эпизоды."
          : "Which weeks in the last 30 days had episodes.",
      chartTitle: language === "ru" ? "Распределение по неделям" : "Weekly distribution",
      chartDescription:
        language === "ru"
          ? "Сколько эпизодов пришлось на каждую неделю последних 30 дней."
          : "How many episodes fell into each week of the last 30 days.",
    };
  }

  if (period === "all") {
    return {
      sectionTitle: language === "ru" ? "По годам" : "By year",
      sectionSubtitle:
        language === "ru"
          ? "Как менялась частота болезней по годам."
          : "How illness frequency changed by year.",
      chartTitle: language === "ru" ? "Динамика по годам" : "Yearly trend",
      chartDescription:
        language === "ru"
          ? "Каждая полоса показывает, сколько эпизодов было за год."
          : "Each bar shows how many episodes happened in a year.",
    };
  }

  return {
    sectionTitle: language === "ru" ? "По месяцам" : "By month",
    sectionSubtitle:
      language === "ru"
        ? "Когда ребёнок болел чаще, а когда реже."
        : "When the child was sick more often and when less often.",
    chartTitle: language === "ru" ? "Динамика по месяцам" : "Monthly trend",
    chartDescription:
      language === "ru"
        ? "Каждая полоса показывает, сколько эпизодов пришлось на месяц."
        : "Each bar shows how many episodes fell into a month.",
  };
}

function formatDurationValue(days: number, language: "ru" | "en") {
  const normalized = Number.isInteger(days) ? String(days) : days.toFixed(1).replace(".0", "");
  return `${normalized} ${language === "ru" ? "дн." : "days"}`;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="app-card-title">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p>
    </div>
  );
}

function HistoryEpisodeCard({
  childId,
  episode,
  episodeNumber,
  isOpen,
  medicines,
  onDeleted,
  onToggle,
}: {
  childId: string;
  episode: IllnessEpisode;
  episodeNumber: number;
  isOpen: boolean;
  medicines: HouseholdMedicine[];
  onDeleted: () => void;
  onToggle: () => void;
}) {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const liveQueryOptions = useLiveQueryOptions(10000);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: isOpen,
    ...liveQueryOptions,
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: () => deleteIllnessEpisode(episode.id),
    onSuccess: () => {
      onDeleted();
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
    },
  });

  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    medicines,
    language
  );
  return (
    <li
      className={`rounded-[28px] px-5 py-4 transition-colors sm:px-6 sm:py-5 ${
        isOpen ? "soft-panel soft-hero" : "soft-card"
      }`}
    >
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={
          language === "ru" ? `Удалить эпизод ${episodeNumber}` : `Delete episode ${episodeNumber}`
        }
        description={
          language === "ru"
            ? "Запись будет полностью удалена из истории ребёнка без возможности восстановления."
            : "This record will be removed from the child’s history without recovery."
        }
        confirmLabel={
          deleteEpisodeMutation.isPending
            ? language === "ru"
              ? "Удаляем…"
              : "Deleting…"
            : language === "ru"
              ? "Да, удалить из истории"
              : "Yes, delete from history"
        }
        confirmTone="danger"
        isPending={deleteEpisodeMutation.isPending}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() =>
          deleteEpisodeMutation.mutate(undefined, {
            onSuccess: () => setIsDeleteConfirmOpen(false),
          })
        }
      />
      <DisclosureHeader
        isOpen={isOpen}
        onToggle={onToggle}
        desktopClosedLabel={language === "ru" ? "Открыть" : "Open"}
        desktopOpenLabel={language === "ru" ? "Скрыть" : "Hide"}
        mobileClosedLabel={language === "ru" ? "Открыть" : "Open"}
        mobileOpenLabel={language === "ru" ? "Скрыть" : "Hide"}
        actions={
          <Link
            to={`/children/${childId}/illness?view=history&episodeId=${episode.id}`}
            className={`${appBtnSecondaryClass} min-h-[2.65rem] px-3 sm:min-h-[2.9rem]`}
          >
            {language === "ru" ? "Разбор" : "Insights"}
          </Link>
        }
      >
        <>
          <p className="text-xs tracking-[0.08em] text-muted">
            {language === "ru" ? "Эпизод" : "Episode"} {episodeNumber} ·{" "}
            {formatEpisodePeriod(episode.startedAt, episode.closedAt, language)}
          </p>
          <p className="mt-2 text-base font-medium text-[color:color-mix(in_srgb,var(--color-primary)_62%,var(--color-foreground))]">
            {episode.title?.trim() || (language === "ru" ? "Без названия" : "Untitled")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {episode.closedAt
              ? `${language === "ru" ? "Закрыт" : "Closed"} ${formatDateTime(episode.closedAt)}`
              : language === "ru"
                ? "Дата закрытия не указана"
                : "Close date is not set"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {episode.note?.trim() || (language === "ru" ? "Без описания" : "No description")}
          </p>
        </>
      </DisclosureHeader>

      {isOpen && (
        <div className="mt-6 space-y-6 border-t border-border/70 pt-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {language === "ru" ? "Описание" : "Description"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {formatEntrySummary(
                  temperatureEntries.length,
                  administrations.length,
                  comments.length,
                  language
                )}
              </p>
            </div>

            <div className="soft-panel-muted mt-4 rounded-[22px] px-4 py-4">
              <p className="text-sm leading-6 text-muted">
                {episode.note?.trim() || (language === "ru" ? "Без описания" : "No description")}
              </p>
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">
              {language === "ru" ? "Что уже записано" : "What is already logged"}
            </h3>

            {timelineItems.length > 0 ? (
              <div className="mt-4">
                <EpisodeTimelineList items={timelineItems} />
              </div>
            ) : (
              <div className="soft-empty mt-4 rounded-[22px] px-4 py-6 text-sm text-muted">
                {language === "ru"
                  ? "Для этого наблюдения ещё нет записей."
                  : "There are no records for this tracking yet."}
              </div>
            )}
          </section>

          <section className="border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {language === "ru" ? "Действия" : "Actions"}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {language === "ru"
                    ? "Запись можно удалить из истории."
                    : "This record can be deleted from history."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={deleteEpisodeMutation.isPending}
                className={`${appBtnDangerClass} min-h-[2.85rem] px-3.5 disabled:opacity-50 sm:min-h-[3rem]`}
              >
                {deleteEpisodeMutation.isPending
                  ? language === "ru"
                    ? "Удаляем…"
                    : "Deleting…"
                  : language === "ru"
                    ? "Удалить из истории"
                    : "Delete from history"}
              </button>
            </div>
          </section>
        </div>
      )}
    </li>
  );
}

function EpisodeInsightsPreview({
  episode,
  insights,
}: {
  episode: IllnessEpisode;
  insights: IllnessEpisodeInsights;
}) {
  const { language } = useI18n();
  const summaryMetrics = [
    {
      label: language === "ru" ? "Длилось" : "Duration",
      value: formatDurationValue(insights.durationDays, language),
    },
    {
      label: language === "ru" ? "Пик температуры" : "Peak temperature",
      value:
        insights.peakTemperatureCelsius !== null
          ? `${insights.peakTemperatureCelsius} °C`
          : language === "ru"
            ? "Нет замеров"
            : "No readings",
    },
    {
      label: language === "ru" ? "Последняя запись" : "Last entry",
      value: insights.lastEventAt
        ? formatDateTime(insights.lastEventAt)
        : language === "ru"
          ? "Нет записей"
          : "No entries",
    },
  ];
  const summaryFacts = [
    { label: language === "ru" ? "Замеров" : "Readings", value: String(insights.temperatureCount) },
    { label: language === "ru" ? "Приёмов" : "Doses", value: String(insights.administrationCount) },
    {
      label: language === "ru" ? "Режим" : "Mode",
      value:
        insights.medicationMode === "guided"
          ? language === "ru"
            ? "С напоминаниями"
            : "With reminders"
          : language === "ru"
            ? "Вручную"
            : "Manual",
    },
    {
      label: language === "ru" ? "Последний замер" : "Latest reading",
      value:
        insights.lastTemperatureCelsius !== null
          ? `${insights.lastTemperatureCelsius} °C`
          : language === "ru"
            ? "Нет замеров"
            : "No readings",
    },
  ];
  const temperatures = insights.temperaturePoints.map((item, index) => ({
    id: `${insights.episodeId}-${index}`,
    episodeId: insights.episodeId,
    valueCelsius: item.valueCelsius,
    measuredAt: item.measuredAt,
    method: null,
    comment: null,
  }));

  return (
    <div className="mt-4 space-y-4">
      <div className="soft-panel rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.72rem] tracking-[0.05em] text-muted sm:text-xs">
                {language === "ru" ? "Разбор эпизода" : "Episode insights"}
              </p>
              <span className="soft-pill rounded-full px-3 py-1 text-[0.72rem] sm:text-xs">
                {formatEpisodePeriod(episode.startedAt, episode.closedAt, language)}
              </span>
            </div>
            <h4 className="app-card-title mt-2 text-[1rem] sm:text-[1.04rem]">
              {language === "ru" ? "Кратко об эпизоде" : "Episode at a glance"}
            </h4>
            <p className="mt-1 text-[0.88rem] leading-6 text-muted sm:text-sm">
              {language === "ru"
                ? "Самое важное по длительности, температуре и событиям."
                : "The key points about duration, temperature and events."}
            </p>
          </div>
          {insights.peakTemperatureAt && (
            <span className="soft-pill rounded-full px-3 py-1 text-[0.72rem] sm:text-xs">
              {language === "ru" ? "Пик" : "Peak"} {formatDateTime(insights.peakTemperatureAt)}
            </span>
          )}
        </div>

        <div className="mt-4">
          <EpisodeMetricsRow items={summaryMetrics} />
        </div>

        <div className="soft-panel-muted mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-[20px] px-3 py-3 sm:grid-cols-4 sm:px-4">
          {summaryFacts.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[0.72rem] leading-5 text-muted sm:text-[0.82rem]">{item.label}</p>
              <p className="truncate text-[0.9rem] font-medium leading-5 text-foreground sm:text-[0.95rem]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="soft-panel rounded-[24px] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="app-card-title">
                {language === "ru" ? "Температура по эпизоду" : "Episode temperature"}
              </h4>
              <p className="mt-1 text-[0.88rem] leading-6 text-muted sm:text-sm">
                {language === "ru"
                  ? "Замеры по ходу этого эпизода."
                  : "Readings taken during this episode."}
              </p>
            </div>
            {insights.peakTemperatureAt && (
              <span className="soft-pill rounded-full px-3 py-1 text-[0.72rem] sm:text-xs">
                {language === "ru" ? "Пик" : "Peak"} {formatDateTime(insights.peakTemperatureAt)}
              </span>
            )}
          </div>

          <div className="mt-4">
            {temperatures.length > 0 ? (
              <EpisodeTemperatureTrend items={temperatures} />
            ) : (
              <div className="soft-empty rounded-[20px] px-4 py-6 text-[0.9rem] text-muted sm:text-sm">
                {language === "ru"
                  ? "Для этого эпизода ещё нет замеров температуры."
                  : "There are no temperature readings for this episode yet."}
              </div>
            )}
          </div>
        </div>

        <div className="soft-panel-muted rounded-[24px] p-4 sm:p-5">
          <h4 className="app-card-title">
            {language === "ru" ? "Ключевые детали" : "Key details"}
          </h4>
          <div className="mt-4 space-y-3">
            <EpisodeFactRow
              label={language === "ru" ? "Препараты" : "Medicines"}
              value={
                insights.medicineNames.length > 0
                  ? insights.medicineNames.join(", ")
                  : language === "ru"
                    ? "Без лекарств"
                    : "No medication"
              }
            />
            <EpisodeFactRow
              label={language === "ru" ? "Всего событий" : "Total events"}
              value={String(insights.totalEvents)}
            />
            <EpisodeFactRow
              label={language === "ru" ? "Начался" : "Started"}
              value={formatDate(episode.startedAt)}
            />
            <EpisodeFactRow
              label={language === "ru" ? "Первый замер" : "First reading"}
              value={
                insights.firstTemperatureAt
                  ? formatDateTime(insights.firstTemperatureAt)
                  : language === "ru"
                    ? "Нет замеров"
                    : "No readings"
              }
            />
            <EpisodeFactRow
              label={language === "ru" ? "Последний приём" : "Last dose"}
              value={
                insights.lastAdministrationAt
                  ? formatDateTime(insights.lastAdministrationAt)
                  : language === "ru"
                    ? "Без приёмов"
                    : "No doses"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EpisodeMetricsRow({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <EpisodeMetricCard key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function HistoryEpisodeInsightsScreen({
  childId,
  episode,
}: {
  childId: string;
  episode: IllnessEpisode;
}) {
  const { language } = useI18n();
  const liveQueryOptions = useLiveQueryOptions(10000);
  const { data: insights, isLoading } = useQuery({
    queryKey: ["illness-episode-insights", episode.id],
    queryFn: () => fetchIllnessEpisodeInsights(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          to={`/children/${childId}/illness?view=history`}
          className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
        >
          {language === "ru" ? "Ко всей истории" : "Back to full history"}
        </Link>
      </div>

      {isLoading || !insights ? (
        <div className="soft-panel-muted rounded-[28px] px-5 py-8 text-sm text-muted">
          {language === "ru" ? "Готовим разбор…" : "Preparing insights…"}
        </div>
      ) : (
        <EpisodeInsightsPreview episode={episode} insights={insights} />
      )}
    </div>
  );
}

function EpisodeMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card rounded-[20px] px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-[0.72rem] leading-5 text-muted sm:text-[0.82rem]">{label}</p>
      <p className="app-card-title mt-1.5 text-[0.92rem] sm:mt-2 sm:text-[0.98rem]">{value}</p>
    </div>
  );
}

function EpisodeFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-3">
      <p className="text-[0.82rem] text-muted sm:text-sm">{label}</p>
      <p className="text-[0.9rem] leading-6 text-foreground sm:text-sm">{value}</p>
    </div>
  );
}

function EpisodeTemperatureTrend({ items }: { items: TemperatureEntry[] }) {
  const sorted = [...items].sort((left, right) => left.measuredAt.localeCompare(right.measuredAt));
  const minValue = Math.min(...sorted.map((item) => item.valueCelsius), 36);
  const maxValue = Math.max(...sorted.map((item) => item.valueCelsius), 39);
  const chartMin = Math.floor(minValue);
  const chartMax = Math.max(chartMin + 1, Math.ceil(maxValue));
  const width = 100;
  const height = 44;
  const leftPad = 5;
  const rightPad = 5;
  const topPad = 5;
  const bottomPad = 6;
  const step = sorted.length > 1 ? (width - leftPad - rightPad) / (sorted.length - 1) : 0;

  const points = sorted.map((item, index) => {
    const x = leftPad + step * index;
    const ratio = (item.valueCelsius - chartMin) / Math.max(chartMax - chartMin, 1);
    const y = height - bottomPad - ratio * (height - topPad - bottomPad);

    return {
      ...item,
      x,
      y,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const tickLabels = (
    sorted.length <= 3
      ? sorted
      : [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]]
  ).filter((item): item is TemperatureEntry => !!item);

  return (
    <div className="space-y-3">
      <div className="soft-card rounded-[22px] px-3 py-3 sm:px-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full overflow-visible sm:h-36">
          <path
            d={`M ${leftPad} ${height - bottomPad} H ${width - rightPad}`}
            fill="none"
            stroke="color-mix(in srgb, var(--color-border) 76%, transparent)"
            strokeWidth="1"
          />
          <path
            d={`M ${leftPad} ${height * 0.66} H ${width - rightPad}`}
            fill="none"
            stroke="color-mix(in srgb, var(--color-border) 52%, transparent)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <path
            d={`M ${leftPad} ${height * 0.33} H ${width - rightPad}`}
            fill="none"
            stroke="color-mix(in srgb, var(--color-border) 52%, transparent)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="color-mix(in srgb, var(--color-primary) 82%, white 8%)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2.7"
                fill="color-mix(in srgb, var(--color-primary) 92%, white 8%)"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4.2"
                fill="color-mix(in srgb, var(--color-primary) 18%, transparent)"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-2">
        {tickLabels.map((item) => (
          <div key={item.id} className="text-center">
            <p className="text-[11px] leading-4 text-muted">{formatDateTime(item.measuredAt)}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.valueCelsius} °C</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EpisodeBlock({
  childName,
  childId,
  episode,
  onClose,
  familyId,
  latestWeight,
  initialComposerMode,
  quickComposeMode,
  quickTimelineMode,
  quickReminderMode,
  quickReminderCreateMode,
  quickReminderDetailMode,
  reminderPlanId,
}: {
  childName: string;
  childId: string;
  episode: IllnessEpisode;
  onClose: () => void;
  familyId: string | null;
  latestWeight: WeightEntry | null;
  initialComposerMode: "temperature" | "administration" | "comment";
  quickComposeMode: "temperature" | "administration" | "comment" | null;
  quickTimelineMode: boolean;
  quickReminderMode: boolean;
  quickReminderCreateMode: boolean;
  quickReminderDetailMode: boolean;
  reminderPlanId: string | null;
}) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = useAppStore((s) => s.accountId);
  const liveQueryOptions = useLiveQueryOptions(3000);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const isActive = episode.status === "active";
  const [commentText, setCommentText] = useState("");
  const [quickComposeSuccessMessage, setQuickComposeSuccessMessage] = useState<string | null>(null);
  const composerMode = quickComposeMode ?? initialComposerMode;
  const quickComposeMeta =
    composerMode === "temperature"
      ? {
          title: language === "ru" ? "Запись температуры" : "Temperature log",
          subtitle: language === "ru" ? "Сохраните новый замер." : "Save a new reading.",
          success: language === "ru" ? "Температура сохранена" : "Temperature saved",
        }
      : composerMode === "administration"
        ? {
            title: language === "ru" ? "Запись приёма" : "Dose log",
            subtitle: language === "ru" ? "Сохраните приём." : "Save the dose.",
            success: language === "ru" ? "Приём сохранён" : "Dose saved",
          }
        : {
            title: language === "ru" ? "Заметка" : "Note",
            subtitle:
              language === "ru"
                ? "Добавьте заметку о состоянии."
                : "Add a note about the current state.",
            success: language === "ru" ? "Заметка сохранена" : "Note saved",
          };

  const { data: temperatureEntries = [] } = useQuery({
    queryKey: ["temperature-entries", episode.id],
    queryFn: () => fetchTemperatureEntriesByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: administrations = [] } = useQuery({
    queryKey: ["administration-events", episode.id],
    queryFn: () => fetchAdministrationEventsByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["illness-comments", episode.id],
    queryFn: () => fetchIllnessCommentsByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: medicationPlans = [] } = useQuery({
    queryKey: ["episode-medication-plans", episode.id],
    queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode.id),
    enabled: !!episode.id,
    ...liveQueryOptions,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", accountId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!familyId && !!accountId,
    ...liveQueryOptions,
  });

  const addTempMutation = useMutation({
    mutationFn: (valueCelsius: number) =>
      createTemperatureEntry({ episode_id: episode.id, value_celsius: valueCelsius }),
    onSuccess: () => {
      void trackTemperatureLogged(episode.id);
      queryClient.invalidateQueries({ queryKey: ["temperature-entries", episode.id] });
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string;
      amount: string;
      reason?: string;
    }) =>
      createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        custom_medicine_name: payload.custom_medicine_name,
        amount: payload.amount,
        reason: payload.reason,
      }),
    onSuccess: () => {
      trackMedicationAdministered("episode_detail");
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: {
      household_medicine_id?: string | null;
      custom_medicine_name?: string | null;
      dose_amount: string;
      min_interval_minutes: number;
      max_doses_per_day?: number | null;
      weight_kg?: number | null;
      dose_mg_per_kg?: number | null;
      notes?: string | null;
    }) =>
      createEpisodeMedicationPlan({
        episode_id: episode.id,
        household_medicine_id: payload.household_medicine_id,
        custom_medicine_name: payload.custom_medicine_name,
        dose_amount: payload.dose_amount,
        min_interval_minutes: payload.min_interval_minutes,
        max_doses_per_day: payload.max_doses_per_day ?? null,
        weight_kg: payload.weight_kg ?? null,
        dose_mg_per_kg: payload.dose_mg_per_kg ?? null,
        notes: payload.notes ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      if (quickReminderCreateMode) {
        navigate(`/children/${childId}/illness?focus=reminders`);
      }
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: deleteEpisodeMedicationPlan,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] }),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        household_medicine_id?: string | null;
        custom_medicine_name?: string | null;
        dose_amount?: string;
        min_interval_minutes?: number;
        max_doses_per_day?: number | null;
        weight_kg?: number | null;
        dose_mg_per_kg?: number | null;
        notes?: string | null;
      };
    }) => updateEpisodeMedicationPlan(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      createIllnessComment({
        episode_id: episode.id,
        text: commentText.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-comments", episode.id] });
      setCommentText("");
      if (quickComposeMode) {
        setQuickComposeSuccessMessage(quickComposeMeta.success);
      }
    },
  });

  const [tempValue, setTempValue] = useState("");
  const [adminCustomMedicineName, setAdminCustomMedicineName] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const now = useNow();
  const timelineItems = buildEpisodeTimeline(
    temperatureEntries,
    administrations,
    comments,
    householdMedicines,
    language
  );
  const reminderItems = getPrioritizedMedicationPlanItems(
    medicationPlans,
    administrations,
    householdMedicines,
    new Date(now)
  );
  const reminderLead = reminderItems[0] ?? null;
  const selectedReminderItem = reminderPlanId
    ? (reminderItems.find((item) => item.plan.id === reminderPlanId) ?? null)
    : null;

  useEffect(() => {
    if (!quickComposeSuccessMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      navigate("/illnesses/active");
    }, 700);
    return () => window.clearTimeout(timeoutId);
  }, [navigate, quickComposeSuccessMessage]);
  const composerContent = (
    <div className="mt-4">
      {composerMode === "temperature" && (
        <TemperatureForm
          value={tempValue}
          onChange={setTempValue}
          onSubmit={() => {
            const parsed = parseFloat(tempValue);
            if (Number.isNaN(parsed)) return;
            addTempMutation.mutate(parsed);
            setTempValue("");
          }}
          isPending={addTempMutation.isPending}
        />
      )}

      {composerMode === "administration" && (
        <>
          <AdministrationForm
            customMedicineName={adminCustomMedicineName}
            amount={adminAmount}
            onCustomMedicineNameChange={setAdminCustomMedicineName}
            onAmountChange={setAdminAmount}
            onSubmit={() => {
              if (!adminCustomMedicineName.trim()) {
                return;
              }
              addAdminMutation.mutate({
                custom_medicine_name: adminCustomMedicineName.trim(),
                amount: adminAmount.trim(),
              });
              setAdminCustomMedicineName("");
              setAdminAmount("");
            }}
            isPending={addAdminMutation.isPending}
          />
        </>
      )}
      {composerMode === "administration" && addAdminMutation.isError && (
        <p className="soft-note-danger mt-3 rounded-2xl px-4 py-3 text-sm">
          {(addAdminMutation.error as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
            (language === "ru"
              ? "Ошибка записи. Проверь срок годности и срок после вскрытия."
              : "Failed to save. Check the expiry date and the after-opening limit.")}
        </p>
      )}

      {composerMode === "comment" && (
        <div className="grid gap-3">
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={
              language === "ru"
                ? "Например: к вечеру бодрее, после сна снова температура."
                : "Example: more active by evening, fever came back after sleep."
            }
            className="soft-input w-full px-4"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (!commentText.trim()) return;
                addCommentMutation.mutate();
              }}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
            >
              {addCommentMutation.isPending
                ? language === "ru"
                  ? "Сохраняем…"
                  : "Saving…"
                : language === "ru"
                  ? "Добавить комментарий"
                  : "Add comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
  const manualComposerSection = quickComposeMode ? (
    <section>{composerContent}</section>
  ) : (
    <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-foreground">
          {language === "ru" ? "Быстрые записи" : "Quick logs"}
        </h4>
        <p className="mt-1 text-sm text-muted">
          {language === "ru" ? "Температура, приёмы и заметки." : "Temperature, doses and notes."}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          to={`/children/${childId}/illness?focus=temperature`}
          className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
        >
          {language === "ru" ? "Записать температуру" : "Log temperature"}
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=administration`}
          className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
        >
          {language === "ru" ? "Записать приём" : "Log dose"}
        </Link>
        <Link
          to={`/children/${childId}/illness?focus=comment`}
          className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
        >
          {language === "ru" ? "Добавить заметку" : "Add note"}
        </Link>
      </div>
    </section>
  );
  const timelineSection = quickTimelineMode ? (
    <section className="space-y-4">
      {timelineItems.length > 0 ? (
        <EpisodeTimelineList items={timelineItems} />
      ) : (
        <div className="soft-empty rounded-[22px] px-4 py-6 text-sm text-muted">
          {language === "ru" ? "Пока записей нет." : "No entries yet."}
        </div>
      )}
    </section>
  ) : (
    <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-foreground">
            {language === "ru" ? "Лента наблюдения" : "Tracking timeline"}
          </h4>
          <p className="mt-1 text-sm text-muted">
            {language === "ru" ? "Все записи по времени." : "All entries in time order."}
          </p>
        </div>
        <Link
          to={`/children/${childId}/illness?focus=timeline`}
          className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full self-start text-center sm:min-h-[3.05rem] sm:w-auto`}
        >
          {language === "ru" ? "Открыть" : "Open"}
        </Link>
      </div>

      {timelineItems.length > 0 ? (
        <div className="mt-4">
          <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
            {language === "ru" ? "Записей" : "Entries"}: {timelineItems.length}
          </span>
        </div>
      ) : null}
    </section>
  );
  const reminderOverviewSection =
    episode.medicationMode === "guided" ? (
      <section className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_22%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_28%,transparent)] px-4 py-5 sm:px-5 sm:py-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-foreground">
              {language === "ru" ? "Напоминания о приёме" : "Dose reminders"}
            </h4>
            <p className="mt-1 text-sm text-muted">
              {language === "ru"
                ? "Приёмы по интервалу и статус на сейчас."
                : "Dose intervals and their current status."}
            </p>
          </div>
          <Link
            to={
              medicationPlans.length > 0
                ? `/children/${childId}/illness?focus=reminders`
                : `/children/${childId}/illness?focus=reminder-create`
            }
            className={`${appBtnSecondaryClass} min-h-[2.85rem] w-full self-start text-center sm:min-h-[3.05rem] sm:w-auto`}
          >
            {medicationPlans.length > 0
              ? language === "ru"
                ? "Напоминания"
                : "Reminders"
              : language === "ru"
                ? "Добавить напоминание"
                : "Add reminder"}
          </Link>
        </div>

        {reminderLead ? (
          <div className="mt-4">
            <span className="soft-pill-success rounded-full px-3 py-1.5 text-xs">
              {language === "ru" ? "Активных напоминаний" : "Active reminders"}:{" "}
              {medicationPlans.length}
            </span>
          </div>
        ) : null}
      </section>
    ) : null;

  if (quickComposeMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">{quickComposeMeta.title}</span>
            </p>
            <p className="mt-1 text-sm text-muted">{quickComposeMeta.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {quickComposeSuccessMessage && (
            <div className="soft-note-info rounded-2xl px-4 py-3 text-sm">
              {quickComposeSuccessMessage}
            </div>
          )}
          {manualComposerSection}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К наблюдениям" : "Back to tracking"}
            </Link>
            <Link
              to={`/children/${childId}/illness?focus=timeline`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К ленте" : "Open timeline"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickTimelineMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">
                {language === "ru" ? "Лента наблюдения" : "Tracking timeline"}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {language === "ru" ? "Все записи по времени." : "All entries in time order."}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {timelineSection}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К наблюдениям" : "Back to tracking"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">{language === "ru" ? "Напоминания" : "Reminders"}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {language === "ru"
                ? "Активные напоминания по приёмам."
                : "Active medication reminders."}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          {medicationPlans.length > 0 ? (
            <MedicationPlanList
              plans={medicationPlans}
              medicines={householdMedicines}
              administrations={administrations}
              onOpen={(planId) =>
                navigate(`/children/${childId}/illness?focus=reminder-detail&plan=${planId}`)
              }
              onTakeDose={(plan) =>
                addAdminMutation.mutate({
                  household_medicine_id: plan.householdMedicineId,
                  custom_medicine_name: plan.customMedicineName ?? undefined,
                  amount: plan.doseAmount,
                  reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
                })
              }
              isSubmittingAdministration={addAdminMutation.isPending}
            />
          ) : (
            <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
              {language === "ru" ? "Напоминаний пока нет." : "No reminders yet."}
            </div>
          )}

          {(
            (createPlanMutation.error ?? updatePlanMutation.error) as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  (createPlanMutation.error ?? updatePlanMutation.error) as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              to="/illnesses/active"
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К наблюдениям" : "Back to tracking"}
            </Link>
            <Link
              to={`/children/${childId}/illness?focus=reminder-create`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "Добавить напоминание" : "Add reminder"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderDetailMode) {
    if (!selectedReminderItem) {
      return (
        <div className="soft-panel rounded-[30px]">
          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="soft-empty rounded-[24px] px-4 py-6 text-sm text-muted">
              {language === "ru" ? "Напоминание не найдено." : "Reminder not found."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/children/${childId}/illness?focus=reminders`}
                className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
              >
                {language === "ru" ? "К напоминаниям" : "Back to reminders"}
              </Link>
              <Link
                to="/illnesses/active"
                className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
              >
                {language === "ru" ? "К наблюдениям" : "Back to tracking"}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">
                {language === "ru" ? "Напоминание о приёме" : "Dose reminder"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <MedicationPlanDetail
            item={selectedReminderItem}
            childId={childId}
            latestWeight={latestWeight}
            isSubmittingAdministration={addAdminMutation.isPending}
            isUpdating={updatePlanMutation.isPending}
            isDeleting={deletePlanMutation.isPending}
            medicines={householdMedicines}
            onTakeDose={(plan) =>
              addAdminMutation.mutate({
                household_medicine_id: plan.householdMedicineId,
                custom_medicine_name: plan.customMedicineName ?? undefined,
                amount: plan.doseAmount,
                reason: language === "ru" ? "Отмечено по напоминанию" : "Logged from reminder",
              })
            }
            onUpdate={(planId, payload) =>
              updatePlanMutation.mutate({
                id: planId,
                payload: {
                  household_medicine_id: payload.householdMedicineId,
                  custom_medicine_name: payload.customMedicineName,
                  dose_amount: payload.doseAmount,
                  min_interval_minutes: payload.minIntervalMinutes,
                  max_doses_per_day: payload.maxDosesPerDay,
                  weight_kg: payload.weightKg,
                  dose_mg_per_kg: payload.doseMgPerKg,
                  notes: payload.notes,
                },
              })
            }
            onDelete={(planId) => {
              deletePlanMutation.mutate(planId, {
                onSuccess: () => navigate(`/children/${childId}/illness?focus=reminders`),
              });
            }}
          />
          {(
            (updatePlanMutation.error ?? deletePlanMutation.error) as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  (updatePlanMutation.error ?? deletePlanMutation.error) as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              {language === "ru" ? "К напоминаниям" : "Back to reminders"}
            </Link>
            <Link
              to="/illnesses/active"
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              {language === "ru" ? "К наблюдениям" : "Back to tracking"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (quickReminderCreateMode) {
    return (
      <div className="soft-panel rounded-[30px]">
        <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {childName}
              <span className="mx-2 text-muted">·</span>
              <span className="text-muted">
                {language === "ru" ? "Новое напоминание" : "New reminder"}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {language === "ru" ? "Настройте интервал и сохраните." : "Set the interval and save."}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <MedicationPlanComposer
            childId={childId}
            medicines={householdMedicines.filter(
              (medicine) =>
                medicine.status !== "expired" && medicine.status !== "expired_after_opening"
            )}
            latestWeight={latestWeight}
            onSubmit={(payload) =>
              createPlanMutation.mutate({
                household_medicine_id: payload.householdMedicineId,
                custom_medicine_name: payload.customMedicineName,
                dose_amount: payload.doseAmount,
                min_interval_minutes: payload.minIntervalMinutes,
                max_doses_per_day: payload.maxDosesPerDay,
                weight_kg: payload.weightKg,
                dose_mg_per_kg: payload.doseMgPerKg,
                notes: payload.notes,
              })
            }
            submitLabel={language === "ru" ? "Сохранить напоминание" : "Save reminder"}
            isPending={createPlanMutation.isPending}
            onCancel={() => navigate(`/children/${childId}/illness?focus=reminders`)}
          />
          {(
            createPlanMutation.error as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ? (
            <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">
              {
                (
                  createPlanMutation.error as {
                    response?: { data?: { detail?: string } };
                  }
                )?.response?.data?.detail
              }
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${childId}/illness?focus=reminders`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К напоминаниям" : "Back to reminders"}
            </Link>
            <Link
              to="/illnesses/active"
              className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
            >
              {language === "ru" ? "К наблюдениям" : "Back to tracking"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-panel rounded-[30px]">
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        title={
          language === "ru" ? `Закрыть наблюдение · ${childName}` : `Close tracking · ${childName}`
        }
        description={
          language === "ru"
            ? "Текущее наблюдение будет завершено и попадёт в историю. При необходимости новое наблюдение можно будет начать заново."
            : "This tracking session will be closed and moved to history. You can start a new one later if needed."
        }
        confirmLabel={language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
        confirmTone="danger"
        onCancel={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          onClose();
          setIsCloseConfirmOpen(false);
        }}
      />
      <div className="soft-hero rounded-t-[30px] px-5 py-4 sm:px-6 sm:py-5">
        {isActive ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {childName}
              </p>
              {episode.title?.trim() ? (
                <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                  {episode.title.trim()}
                </h3>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                {language === "ru"
                  ? "Быстрые записи, напоминания и лента наблюдения."
                  : "Quick logs, reminders and the tracking timeline."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCloseConfirmOpen(true)}
              className={`${appBtnDangerClass} hidden min-h-[2.95rem] sm:inline-flex`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {childName}
            </p>
            {episode.title?.trim() ? (
              <h3 className="text-base font-medium tracking-tight text-muted sm:text-lg">
                {episode.title.trim()}
              </h3>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              {language === "ru"
                ? "Быстрые записи, напоминания и лента наблюдения."
                : "Quick logs, reminders and the tracking timeline."}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-7 px-5 py-5 sm:px-6 sm:py-6">
        <section>{manualComposerSection}</section>

        {reminderOverviewSection}
        {timelineSection}

        {isActive && (
          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setIsCloseConfirmOpen(true)}
              className={`${appBtnDangerClass} min-h-[2.95rem] w-full`}
            >
              {language === "ru" ? "Закрыть наблюдение" : "Close tracking"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodeActivationCard({
  childName,
  isPending,
  errorMessage,
  onActivate,
  onCancel,
}: {
  childName: string;
  isPending: boolean;
  errorMessage: string | null;
  onActivate: (payload: {
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
  }) => void;
  onCancel: () => void;
}) {
  const { language } = useI18n();
  const [startedAt, setStartedAt] = useState(() => getLocalIsoDate());
  const [title, setTitle] = useState("");

  return (
    <div className="soft-panel rounded-[30px]">
      <div className="soft-hero rounded-t-[30px] px-5 py-6 sm:px-6 sm:py-7">
        <p className="text-xs tracking-[0.1em] text-muted">
          {language === "ru" ? "Старт наблюдения" : "Start tracking"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{childName}</h3>
        <p className="mt-3 text-sm text-muted">
          {language === "ru"
            ? "Создайте запись о болезни, а дальше просто отмечайте температуру, приёмы и важные изменения."
            : "Create an illness record, then simply log temperature, doses and important changes."}
        </p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {errorMessage && (
          <div className="soft-note-danger rounded-2xl px-4 py-3 text-sm">{errorMessage}</div>
        )}
        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Дата начала" : "Start date"}
          </span>
          <DateField
            value={startedAt}
            onChange={setStartedAt}
            language={language}
            max={getLocalIsoDate()}
            className=""
          />
        </label>
        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Что случилось?" : "What happened?"}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              language === "ru" ? "Например: температура и кашель" : "Example: fever and cough"
            }
            className="soft-input w-full px-4"
          />
          <p className="mt-2 text-xs text-muted">
            {language === "ru"
              ? "Необязательно. Нужен только короткий ориентир, чтобы потом быстрее найти запись."
              : "Optional. A short label is enough to find the record faster later."}
          </p>
        </label>
        <div className="soft-panel-muted rounded-[24px] p-4 sm:p-5">
          <h4 className="text-base font-semibold text-foreground">
            {language === "ru" ? "Что будет дальше" : "What happens next"}
          </h4>
          <p className="mt-2 text-sm leading-6 text-muted">
            {language === "ru"
              ? "Сразу после запуска откроется экран болезни. Там можно будет отдельно:"
              : "Right after start, the illness screen will open. There you can separately:"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
              {language === "ru" ? "Записать температуру" : "Log temperature"}
            </span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
              {language === "ru" ? "Отметить приём" : "Log dose"}
            </span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
              {language === "ru" ? "Добавить комментарий" : "Add comment"}
            </span>
            <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
              {language === "ru" ? "Добавить напоминание" : "Add reminder"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onActivate({
                started_at: startedAt,
                title: title.trim() ? title.trim() : null,
                medication_mode: "guided",
                note: null,
                temperatures: [],
                administrations: [],
                comments: [],
                medication_plans: [],
              })
            }
            disabled={isPending || !startedAt}
            className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
          >
            {isPending
              ? language === "ru"
                ? "Запускаем…"
                : "Starting…"
              : language === "ru"
                ? "Начать наблюдение"
                : "Start tracking"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={`${appBtnSecondaryClass} min-h-[2.85rem] disabled:opacity-50 sm:min-h-[3.05rem]`}
          >
            {language === "ru" ? "Назад" : "Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineHint({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const showTouchHint = () => {
    setIsOpen(true);
    window.setTimeout(() => {
      setIsOpen(false);
    }, 1400);
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        title={text}
        aria-label={text}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onTouchStart={(event) => {
          event.preventDefault();
          showTouchHint();
        }}
        className="soft-pill-warning inline-flex h-5 w-5 items-center justify-center rounded-full px-0 text-[11px] font-semibold leading-none"
      >
        !
      </button>
      {isOpen && (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-border/80 bg-[color:var(--color-surface-soft)] px-3 py-2 text-xs font-normal leading-5 text-foreground shadow-lg shadow-black/10">
          {text}
        </span>
      )}
    </span>
  );
}

function TemperatureForm({
  value,
  onChange,
  onSubmit,
  isPending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { language } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,168px)_auto] sm:items-end">
      <label className="block max-w-[11rem] space-y-1.5">
        <span className="soft-field-label">
          {language === "ru" ? "Температура" : "Temperature"}
        </span>
        <input
          type="number"
          step={0.1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={language === "ru" ? "36.6" : "98.6 / 37.0"}
          className="soft-input w-full px-4"
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !value}
        className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:w-auto sm:px-5`}
      >
        {isPending
          ? language === "ru"
            ? "Сохраняем…"
            : "Saving…"
          : language === "ru"
            ? "Добавить"
            : "Add"}
      </button>
    </div>
  );
}

function CabinetMedicinePicker({
  medicines,
  value,
  onChange,
  label,
}: {
  medicines: HouseholdMedicine[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const { language } = useI18n();
  const resolvedLabel = label ?? (language === "ru" ? "Упаковка" : "Pack");
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedMedicine = medicines.find((medicine) => medicine.id === value) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMedicines = normalizedQuery
    ? medicines.filter((medicine) =>
        [
          medicine.medicineName,
          medicine.medicineConcentration ?? "",
          medicine.medicineForm ?? "",
          getMedicineStatusLabel(medicine, language),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : medicines;

  const selectMedicine = (medicineId: string) => {
    onChange(medicineId);
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!value) {
      return;
    }
    setIsOpen(false);
    setQuery("");
  }, [value]);

  return (
    <>
      <div className="block min-w-0">
        <span className="soft-field-label">{resolvedLabel}</span>
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            className={`${appBtnSecondaryClass} flex min-h-[2.95rem] w-full justify-between gap-3 px-4 text-left sm:min-h-[3.1rem]`}
          >
            <span className="min-w-0">
              {selectedMedicine ? (
                <>
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {selectedMedicine.medicineName}
                    {selectedMedicine.medicineConcentration
                      ? ` · ${selectedMedicine.medicineConcentration}`
                      : ""}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {getMedicineStatusLabel(selectedMedicine, language)} ·{" "}
                    {language === "ru" ? "до" : "until"} {formatDate(selectedMedicine.expiryDate)}
                  </span>
                </>
              ) : (
                <>
                  <span className="block text-sm font-semibold text-foreground">
                    {language === "ru" ? "Выбрать из аптечки" : "Choose from first aid kit"}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {medicines.length}{" "}
                    {language === "ru"
                      ? formatMedicineCountLabel(medicines.length)
                      : medicines.length === 1
                        ? "medicine"
                        : "medicines"}
                  </span>
                </>
              )}
            </span>
            <span className="soft-choice-check" aria-hidden="true">
              {language === "ru" ? "Выбрать" : "Choose"}
            </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end bg-black/28 p-3 sm:items-center sm:justify-center sm:p-6">
          <button
            type="button"
            aria-label={language === "ru" ? "Закрыть выбор лекарства" : "Close medicine picker"}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0"
          />
          <div className="soft-panel relative z-10 w-full max-w-xl rounded-[28px]">
            <div className="soft-hero rounded-t-[28px] px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.1em] text-muted">
                    {language === "ru" ? "Аптечка" : "First aid kit"}
                  </p>
                  <h4 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {language === "ru" ? "Выбрать препарат" : "Choose medicine"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3rem]`}
                >
                  {language === "ru" ? "Закрыть" : "Close"}
                </button>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6 sm:py-6">
              {medicines.length > 6 && (
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={language === "ru" ? "Поиск по аптечке" : "Search first aid kit"}
                  className="soft-input w-full px-4"
                />
              )}
              <div className="soft-choice-list max-h-[min(55vh,28rem)] overflow-y-auto pr-1">
                {filteredMedicines.map((medicine) => {
                  const isActive = medicine.id === value;

                  return (
                    <button
                      key={medicine.id}
                      type="button"
                      onClick={() => selectMedicine(medicine.id)}
                      aria-pressed={isActive}
                      className={[
                        "soft-choice-row text-left",
                        isActive ? "soft-choice-row-active" : "",
                      ].join(" ")}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {medicine.medicineName}
                          {medicine.medicineConcentration
                            ? ` · ${medicine.medicineConcentration}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {getMedicineStatusLabel(medicine, language)} ·{" "}
                          {language === "ru" ? "до" : "until"} {formatDate(medicine.expiryDate)}
                        </span>
                      </span>
                      <span className="soft-choice-check" aria-hidden="true">
                        {isActive
                          ? language === "ru"
                            ? "Выбрано"
                            : "Selected"
                          : language === "ru"
                            ? "Выбрать"
                            : "Choose"}
                      </span>
                    </button>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--color-surface-soft)_92%,transparent)] px-4 py-3 text-sm text-muted">
                    {language === "ru" ? "Ничего не найдено." : "Nothing found."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatMedicineCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "препарат";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "препарата";
  }
  return "препаратов";
}

function translateAnalyticsLabel(label: string | null | undefined, language: "ru" | "en") {
  if (!label || language === "ru") {
    return label ?? null;
  }

  const exactMap: Record<string, string> = {
    Янв: "Jan",
    Фев: "Feb",
    Мар: "Mar",
    Апр: "Apr",
    Май: "May",
    Июн: "Jun",
    Июл: "Jul",
    Авг: "Aug",
    Сен: "Sep",
    Окт: "Oct",
    Ноя: "Nov",
    Дек: "Dec",
    "1-2 дня": "1-2 days",
    "3-5 дней": "3-5 days",
    "6+ дней": "6+ days",
  };

  if (exactMap[label]) {
    return exactMap[label];
  }

  return label.replace(/\bдн\./g, "days");
}

function getMedicineStatusLabel(
  medicine: Pick<HouseholdMedicine, "status" | "statusLabel">,
  language: "ru" | "en"
) {
  if (language === "ru") {
    return medicine.statusLabel;
  }

  const labels: Record<string, string> = {
    expired: "Expired",
    expired_after_opening: "Expired after opening",
    expiring_after_opening: "Expiring after opening",
    expiring_soon: "Expiring soon",
    ok: "Ready to use",
  };

  return labels[medicine.status] ?? medicine.statusLabel;
}

function AdministrationForm({
  customMedicineName,
  amount,
  onCustomMedicineNameChange,
  onAmountChange,
  onSubmit,
  isPending,
}: {
  customMedicineName: string;
  amount: string;
  onCustomMedicineNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { language } = useI18n();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_auto] md:items-end">
        <label className="block min-w-0 space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Что дали" : "What was given"}
          </span>
          <input
            type="text"
            value={customMedicineName}
            onChange={(e) => onCustomMedicineNameChange(e.target.value)}
            placeholder={language === "ru" ? "Например: Уголь" : "Example: charcoal"}
            className="soft-input w-full px-4"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="soft-field-label">
            {language === "ru" ? "Доза, если нужно" : "Dose, if needed"}
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={language === "ru" ? "Например: 5 мл или 1 таб." : "Example: 5 ml or 1 tab"}
            className="soft-input w-full px-4"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !customMedicineName.trim()}
            className={`${appBtnPrimaryClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
          >
            {isPending
              ? language === "ru"
                ? "Сохраняем…"
                : "Saving…"
              : language === "ru"
                ? "Отметить приём"
                : "Log dose"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted">
        {language === "ru"
          ? "Дозу можно не указывать для быстрой записи."
          : "The dose can be left empty for a quick entry."}
      </p>
    </div>
  );
}

type MedicationPlanPayload = {
  householdMedicineId: string | null;
  customMedicineName: string | null;
  doseAmount: string;
  minIntervalMinutes: number;
  maxDosesPerDay: number | null;
  weightKg: number | null;
  doseMgPerKg: number | null;
  notes: string | null;
};

function intervalMinutesToInputValue(intervalMinutes: number, unit: "hours" | "minutes") {
  if (unit === "minutes") {
    return String(intervalMinutes);
  }
  const hours = intervalMinutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(2)));
}

function parseIntervalInputToMinutes(value: string, unit: "hours" | "minutes"): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return unit === "minutes" ? Math.round(parsed) : Math.round(parsed * 60);
}

function MedicationPlanComposer({
  childId,
  medicines,
  latestWeight,
  onSubmit,
  submitLabel,
  isPending,
  initialValue,
  onCancel,
}: {
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onSubmit: (payload: MedicationPlanPayload) => void;
  submitLabel: string;
  isPending: boolean;
  initialValue?: MedicationPlanPayload | null;
  onCancel?: () => void;
}) {
  const { language } = useI18n();
  const queryClient = useQueryClient();
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const defaultPlanMode: "cabinet" | "manual" = initialValue?.householdMedicineId
    ? "cabinet"
    : medicines.length > 0
      ? "cabinet"
      : "manual";
  const hasAdvancedInitialValue = Boolean(
    initialValue?.maxDosesPerDay || initialValue?.weightKg || initialValue?.doseMgPerKg
  );
  const [planMode, setPlanMode] = useState<"cabinet" | "manual">(defaultPlanMode);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(hasAdvancedInitialValue);
  const [selectedMedicineId, setSelectedMedicineId] = useState(
    initialValue?.householdMedicineId ?? ""
  );
  const [customMedicineName, setCustomMedicineName] = useState(
    initialValue?.customMedicineName ?? ""
  );
  const [doseAmount, setDoseAmount] = useState(initialValue?.doseAmount ?? "");
  const [minIntervalInput, setMinIntervalInput] = useState(
    initialValue
      ? intervalMinutesToInputValue(initialValue.minIntervalMinutes, intervalUnit)
      : intervalUnit === "minutes"
        ? "180"
        : "3"
  );
  const [maxDosesPerDay, setMaxDosesPerDay] = useState(
    initialValue?.maxDosesPerDay ? String(initialValue.maxDosesPerDay) : ""
  );
  const [weightKg, setWeightKg] = useState(
    initialValue?.weightKg
      ? String(initialValue.weightKg)
      : latestWeight
        ? String(latestWeight.valueKg)
        : ""
  );
  const [doseMgPerKg, setDoseMgPerKg] = useState(
    initialValue?.doseMgPerKg ? String(initialValue.doseMgPerKg) : ""
  );
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) ?? null;
  const parsedWeightKg = parseNullableNumber(weightKg);
  const weightHint = buildWeightDoseHint(
    selectedMedicine,
    parsedWeightKg,
    parseNullableNumber(doseMgPerKg)
  );
  const hasDoseUnitHint = doseAmount.trim().length > 0 && !/[A-Za-zА-Яа-я]/.test(doseAmount);
  const hasInvalidDose = doseAmount.trim().length > 0 && hasDoseUnitHint;
  const parsedIntervalMinutes = parseIntervalInputToMinutes(minIntervalInput, intervalUnit);
  const latestWeightValue = latestWeight?.valueKg ?? null;
  const shouldOfferWeightSync =
    parsedWeightKg !== null &&
    (latestWeightValue === null || Math.abs(parsedWeightKg - latestWeightValue) >= 0.1);

  const syncWeightMutation = useMutation({
    mutationFn: (valueKg: number) =>
      createWeightEntry({
        child_id: childId,
        value_kg: valueKg,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-entry-latest", childId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="min-w-0">
          {planMode === "cabinet" ? (
            <div className="space-y-2">
              <CabinetMedicinePicker
                medicines={medicines}
                value={selectedMedicineId}
                onChange={setSelectedMedicineId}
                label={language === "ru" ? "Лекарство" : "Medicine"}
              />
              {medicines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlanMode("manual")}
                  className="text-sm font-medium text-muted transition hover:text-foreground"
                >
                  {language === "ru"
                    ? "Нет в аптечке? Вписать вручную"
                    : "Not in the first aid kit? Enter manually"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block min-w-0 space-y-1.5">
                <span className="soft-field-label">
                  {language === "ru" ? "Лекарство" : "Medicine"}
                </span>
                <input
                  type="text"
                  value={customMedicineName}
                  onChange={(event) => setCustomMedicineName(event.target.value)}
                  placeholder={language === "ru" ? "Например: Ибуклин" : "Example: Ibuklin"}
                  className="soft-input w-full px-4"
                />
              </label>
              {medicines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlanMode("cabinet")}
                  className="text-sm font-medium text-muted transition hover:text-foreground"
                >
                  {language === "ru" ? "Выбрать из аптечки" : "Choose from first aid kit"}
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block space-y-1.5">
            <span className="soft-field-label">
              {language === "ru"
                ? "Сколько дать сейчас (разовая доза)"
                : "Dose for now (single dose)"}
            </span>
            <input
              type="text"
              value={doseAmount}
              onChange={(e) => setDoseAmount(e.target.value)}
              placeholder={
                language === "ru" ? "Например: 10 мл или 1 таб." : "Example: 10 ml or 1 tab"
              }
              className="soft-input w-full px-4"
            />
            {hasDoseUnitHint && (
              <p className="mt-2 text-xs text-muted">
                {language === "ru"
                  ? "Лучше добавить единицу: мл, таб., кап. и т.д."
                  : "Better add a unit: ml, tab, drops, etc."}
              </p>
            )}
            {hasInvalidDose && (
              <p className="soft-text-danger mt-2 text-xs">
                {language === "ru"
                  ? "Укажи единицу дозы: мл, таб., мг, кап. и т.д."
                  : "Add a dose unit: ml, tab, mg, drops, etc."}
              </p>
            )}
          </label>
        </div>

        <div>
          <label className="block space-y-1.5">
            <span className="soft-field-label">
              {language === "ru" ? "Интервал напоминания" : "Reminder interval"},{" "}
              {intervalUnit === "minutes"
                ? language === "ru"
                  ? "минут"
                  : "minutes"
                : language === "ru"
                  ? "часов"
                  : "hours"}
            </span>
            <input
              type="number"
              min="1"
              max={intervalUnit === "minutes" ? "1440" : "24"}
              step={intervalUnit === "minutes" ? "1" : "0.5"}
              value={minIntervalInput}
              onChange={(e) => setMinIntervalInput(e.target.value)}
              className="soft-input w-full px-4"
            />
          </label>
        </div>
      </div>

      <div className="mt-3">
        <div className="border-t border-border/60 pt-4">
          <DisclosureHeader
            isOpen={isAdvancedOpen}
            onToggle={() => setIsAdvancedOpen((current) => !current)}
            desktopClosedLabel={language === "ru" ? "Дополнительно" : "Advanced"}
            desktopOpenLabel={language === "ru" ? "Скрыть" : "Hide"}
            mobileClosedLabel={language === "ru" ? "Доп." : "More"}
            mobileOpenLabel={language === "ru" ? "Скрыть" : "Hide"}
          >
            <div>
              <h5 className="text-sm font-semibold text-foreground">
                {language === "ru" ? "Дополнительные настройки" : "Advanced settings"}
              </h5>
              <p className="mt-1 text-sm text-muted">
                {language === "ru"
                  ? "Опционально: лимит в сутки и проверка по весу."
                  : "Optional: daily limit and a weight-based check."}
              </p>
            </div>
          </DisclosureHeader>

          {isAdvancedOpen && (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              <div>
                <label className="block space-y-1.5">
                  <span className="soft-field-label">
                    {language === "ru" ? "Максимум в сутки" : "Max per day"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxDosesPerDay}
                    onChange={(e) => setMaxDosesPerDay(e.target.value)}
                    placeholder={language === "ru" ? "Необязательно" : "Optional"}
                    className="soft-input w-full px-4"
                  />
                </label>
              </div>

              <div>
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    {language === "ru"
                      ? "Вес ребёнка для проверки, кг"
                      : "Child weight for check, kg"}
                    <InlineHint
                      text={
                        language === "ru"
                          ? "Нужен только для проверки по мг/кг. Если доза уже известна, поле можно пропустить."
                          : "Needed only for the mg/kg check. If the dose is already known, you can skip this field."
                      }
                    />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder={
                      latestWeight
                        ? String(latestWeight.valueKg)
                        : language === "ru"
                          ? "Необязательно"
                          : "Optional"
                    }
                    className="soft-input w-full px-4"
                  />
                  {latestWeight && (
                    <p className="mt-2 text-xs text-muted">
                      Последний вес: {latestWeight.valueKg} кг от{" "}
                      {formatDate(latestWeight.measuredAt)}
                    </p>
                  )}
                  {shouldOfferWeightSync && (
                    <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">
                      <p>
                        {language === "ru"
                          ? `В плане указан вес ${parsedWeightKg} кг. Обновить его и в карточке ребёнка?`
                          : `The plan uses ${parsedWeightKg} kg. Update it in the child profile too?`}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (parsedWeightKg === null) {
                              return;
                            }
                            syncWeightMutation.mutate(parsedWeightKg);
                          }}
                          disabled={syncWeightMutation.isPending}
                          className={`${appBtnSecondaryClass} min-h-[2.85rem] disabled:opacity-50 sm:min-h-[3.05rem]`}
                        >
                          {syncWeightMutation.isPending
                            ? language === "ru"
                              ? "Сохраняем вес…"
                              : "Saving weight…"
                            : language === "ru"
                              ? "Обновить вес ребёнка"
                              : "Update child weight"}
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              <div className="xl:col-span-2">
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-2 soft-field-label">
                    {language === "ru" ? "Проверка по весу, мг/кг" : "Weight check, mg/kg"}
                    <InlineHint
                      text={
                        language === "ru"
                          ? "Если врач указал дозу в мг/кг, введи значение. Это проверка, основная доза задаётся выше."
                          : "If the doctor gave the dose in mg/kg, enter it here. This is a check, the main dose is set above."
                      }
                    />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={doseMgPerKg}
                    onChange={(e) => setDoseMgPerKg(e.target.value)}
                    placeholder={language === "ru" ? "Введите дозировку, мг" : "Optional"}
                    className="soft-input w-full px-4"
                  />
                  <p className="mt-2 text-xs text-muted">
                    {language === "ru"
                      ? "Покажем ориентир по мг и мл. Решение о приёме — по назначению врача."
                      : "Shows an approximate mg/ml estimate. Follow your clinician's instructions for dosing."}
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {weightHint && (
        <div className="soft-note-info mt-3 rounded-2xl px-4 py-3 text-sm">{weightHint}</div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (
              parsedIntervalMinutes === null ||
              hasInvalidDose ||
              (planMode === "cabinet" ? !selectedMedicineId : !customMedicineName.trim())
            ) {
              return;
            }

            onSubmit({
              householdMedicineId: planMode === "cabinet" ? selectedMedicineId : null,
              customMedicineName: planMode === "manual" ? customMedicineName.trim() : null,
              doseAmount: doseAmount.trim(),
              minIntervalMinutes: parsedIntervalMinutes,
              maxDosesPerDay: parseNullableInteger(maxDosesPerDay),
              weightKg: parseNullableNumber(weightKg),
              doseMgPerKg: parseNullableNumber(doseMgPerKg),
              notes: null,
            });

            if (!initialValue) {
              setPlanMode("cabinet");
              setSelectedMedicineId("");
              setCustomMedicineName("");
              setDoseAmount("");
              setMinIntervalInput(intervalUnit === "minutes" ? "180" : "3");
              setMaxDosesPerDay("");
              setDoseMgPerKg("");
            }
            onCancel?.();
          }}
          disabled={
            isPending ||
            (planMode === "cabinet" ? !selectedMedicineId : !customMedicineName.trim()) ||
            !minIntervalInput ||
            hasInvalidDose ||
            parsedIntervalMinutes === null
          }
          className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
        >
          {isPending ? (language === "ru" ? "Сохраняем…" : "Saving…") : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={`${appBtnSecondaryClass} min-h-[2.85rem] disabled:opacity-50 sm:min-h-[3.05rem]`}
          >
            {language === "ru" ? "Отмена" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

function MedicationPlanList({
  plans,
  medicines,
  administrations,
  onOpen,
  onTakeDose,
  isSubmittingAdministration = false,
}: {
  plans: EpisodeMedicationPlan[];
  medicines: HouseholdMedicine[];
  administrations?: AdministrationEvent[];
  onOpen: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
}) {
  const { language } = useI18n();
  const now = useNow();
  const currentTime = new Date(now);
  const prioritizedPlans = administrations
    ? getPrioritizedMedicationPlanItems(plans, administrations, medicines, currentTime)
    : plans.map((plan) => ({
        plan,
        medicine: medicines.find((item) => item.id === plan.householdMedicineId) ?? null,
        stats: buildPlanAdministrationStats(plan, [], currentTime),
        isUnavailable: false,
      }));

  return (
    <div className="grid gap-3">
      {prioritizedPlans.map(({ plan, medicine, stats, isUnavailable }) => {
        const planName =
          plan.customMedicineName ??
          medicine?.medicineName ??
          (language === "ru" ? "Лекарство" : "Medicine");
        const nextDoseLabel = isUnavailable
          ? language === "ru"
            ? "Упаковка сейчас недоступна"
            : "This pack is currently unavailable"
          : stats?.blockedByDailyLimit
            ? language === "ru"
              ? `Сегодня ${planName.toLowerCase()}: лимит приёмов уже достигнут`
              : `${planName}: today's dose limit is already reached`
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? language === "ru"
                  ? "Следующий приём: можно сейчас"
                  : "Next dose: available now"
                : language === "ru"
                  ? `Следующий приём: ${formatRelativeDateTime(stats.nextAllowedAt, currentTime)}`
                  : `Next dose: ${formatRelativeDateTime(stats.nextAllowedAt, currentTime)}`
              : language === "ru"
                ? "Следующий приём: можно сейчас"
                : "Next dose: available now";
        const nextDoseToneClass = isUnavailable
          ? "soft-pill-danger"
          : stats?.blockedByDailyLimit
            ? "soft-pill-danger"
            : stats?.nextAllowedAt
              ? stats.nextAllowedAt <= currentTime
                ? "soft-pill-success"
                : "soft-pill-warning"
              : "soft-pill-info";

        return (
          <article
            key={plan.id}
            className="soft-section-shell rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-success)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success-soft)_24%,transparent)] px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">{planName}</p>
                  <span className={`${nextDoseToneClass} rounded-full px-2.5 py-1 text-[11px]`}>
                    {stats?.nextAllowedAt &&
                    stats.nextAllowedAt <= currentTime &&
                    !stats.blockedByDailyLimit &&
                    !isUnavailable
                      ? language === "ru"
                        ? "Сейчас"
                        : "Now"
                      : isUnavailable
                        ? language === "ru"
                          ? "Недоступно"
                          : "Unavailable"
                        : stats?.blockedByDailyLimit
                          ? language === "ru"
                            ? "Лимит"
                            : "Limit"
                          : language === "ru"
                            ? "По графику"
                            : "Scheduled"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{nextDoseLabel}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {plan.doseAmount ? (
                    <span>
                      {language === "ru" ? "Доза" : "Dose"}: {plan.doseAmount}
                    </span>
                  ) : null}
                  {plan.maxDosesPerDay ? (
                    <span>
                      {language === "ru" ? "Сегодня отмечено" : "Logged today"}:{" "}
                      {stats?.todayCount ?? 0} {language === "ru" ? "из" : "of"}{" "}
                      {plan.maxDosesPerDay}
                    </span>
                  ) : (stats?.todayCount ?? 0) > 0 ? (
                    <span>
                      {language === "ru" ? "Сегодня отмечено" : "Logged today"}:{" "}
                      {stats?.todayCount ?? 0}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {onTakeDose && (
                  <button
                    type="button"
                    onClick={() => onTakeDose(plan)}
                    disabled={isSubmittingAdministration || !!stats?.isBlocked || isUnavailable}
                    className={`inline-flex min-h-[2.95rem] items-center justify-center px-4 text-[0.88rem] tracking-[-0.03em] transition disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5 sm:text-[0.92rem] ${
                      isUnavailable || stats?.isBlocked
                        ? `${appBtnSecondaryClass} text-muted`
                        : appBtnPrimaryClass
                    }`}
                  >
                    {isSubmittingAdministration
                      ? language === "ru"
                        ? "Отмечаем…"
                        : "Logging…"
                      : isUnavailable
                        ? language === "ru"
                          ? "Недоступно"
                          : "Unavailable"
                        : stats?.isBlocked
                          ? language === "ru"
                            ? "Пока рано"
                            : "Too early"
                          : language === "ru"
                            ? "Отметить"
                            : "Log dose"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpen(plan.id)}
                  className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
                >
                  {language === "ru" ? "Открыть" : "Open"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MedicationPlanDetail({
  item,
  childId,
  medicines,
  latestWeight,
  onUpdate,
  onDelete,
  onTakeDose,
  isSubmittingAdministration = false,
  isUpdating = false,
  isDeleting = false,
}: {
  item: MedicationPlanPriorityItem<EpisodeMedicationPlan>;
  childId: string;
  medicines: HouseholdMedicine[];
  latestWeight: WeightEntry | null;
  onUpdate: (planId: string, payload: MedicationPlanPayload) => void;
  onDelete: (planId: string) => void;
  onTakeDose?: (plan: EpisodeMedicationPlan) => void;
  isSubmittingAdministration?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}) {
  const { language } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const intervalUnit = useAppStore((s) => s.medicationIntervalUnit);
  const { plan, medicine, stats, isUnavailable } = item;
  const planName =
    plan.customMedicineName ??
    medicine?.medicineName ??
    (language === "ru" ? "Лекарство" : "Medicine");
  const doseBadge = plan.doseAmount?.trim() ?? "";
  const weightHint = buildWeightDoseHint(medicine, plan.weightKg, plan.doseMgPerKg);
  const editableMedicines = Array.from(
    new Map(
      medicines
        .filter(
          (entry) =>
            entry.id === plan.householdMedicineId ||
            (entry.status !== "expired" && entry.status !== "expired_after_opening")
        )
        .map((entry) => [entry.id, entry])
    ).values()
  );

  if (isEditing) {
    return (
      <section className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">{planName}</h4>
          <p className="mt-1 text-sm text-muted">
            {language === "ru"
              ? "Измените интервал и параметры напоминания."
              : "Adjust the interval and reminder settings."}
          </p>
        </div>
        <MedicationPlanComposer
          key={plan.id}
          childId={childId}
          medicines={editableMedicines}
          latestWeight={latestWeight}
          initialValue={{
            householdMedicineId: plan.householdMedicineId,
            customMedicineName: plan.customMedicineName,
            doseAmount: plan.doseAmount,
            minIntervalMinutes: plan.minIntervalMinutes,
            maxDosesPerDay: plan.maxDosesPerDay,
            weightKg: plan.weightKg,
            doseMgPerKg: plan.doseMgPerKg,
            notes: plan.notes,
          }}
          onSubmit={(payload) => {
            onUpdate(plan.id, payload);
            setIsEditing(false);
          }}
          submitLabel={language === "ru" ? "Сохранить напоминание" : "Save reminder"}
          isPending={isUpdating}
          onCancel={() => setIsEditing(false)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={
          language === "ru" ? `Удалить напоминание · ${planName}` : `Delete reminder · ${planName}`
        }
        description={
          language === "ru"
            ? "Напоминание будет удалено из текущего наблюдения. История уже отмеченных приёмов останется."
            : "The reminder will be removed from the current tracking session. Logged dose history will stay."
        }
        confirmLabel={
          isDeleting
            ? language === "ru"
              ? "Удаляем…"
              : "Deleting…"
            : language === "ru"
              ? "Да, удалить напоминание"
              : "Yes, delete reminder"
        }
        confirmTone="danger"
        isPending={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(plan.id);
        }}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="min-w-0 text-xl font-semibold tracking-tight text-foreground">
              {planName}
            </h4>
            {doseBadge ? (
              <span className="soft-note-info rounded-full px-2.5 py-1 text-xs font-medium">
                {doseBadge}
              </span>
            ) : null}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isUnavailable
                ? "soft-pill-danger"
                : stats?.blockedByDailyLimit
                  ? "soft-pill-danger"
                  : stats?.isBlocked
                    ? "soft-pill-warning"
                    : "soft-pill-success"
            }`}
          >
            {isUnavailable
              ? language === "ru"
                ? "Недоступно"
                : "Unavailable"
              : stats?.blockedByDailyLimit
                ? language === "ru"
                  ? "Лимит"
                  : "Limit"
                : stats?.isBlocked
                  ? language === "ru"
                    ? "По графику"
                    : "Scheduled"
                  : language === "ru"
                    ? "Можно сейчас"
                    : "Available now"}
          </span>
        </div>
        <p className="text-sm leading-6 text-foreground/78">
          {isUnavailable
            ? language === "ru"
              ? "Упаковка недоступна для приёма."
              : "This pack is unavailable for use."
            : stats?.blockedByDailyLimit
              ? language === "ru"
                ? "Лимит приёмов на сегодня уже достигнут."
                : "Today's dose limit has already been reached."
              : stats?.nextAllowedAt
                ? stats.nextAllowedAt <= new Date()
                  ? language === "ru"
                    ? "Приём можно отметить сейчас."
                    : "A dose can be logged now."
                  : language === "ru"
                    ? `Следующий приём ${formatRelativeDateTime(stats.nextAllowedAt, new Date())}.`
                    : `Next dose ${formatRelativeDateTime(stats.nextAllowedAt, new Date())}.`
                : language === "ru"
                  ? "Приём можно отметить сейчас."
                  : "A dose can be logged now."}
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {language === "ru" ? "Схема" : "Schedule"}
          </h5>
          <DetailRow
            label={language === "ru" ? "Интервал" : "Interval"}
            value={formatIntervalForDisplay(plan.minIntervalMinutes, intervalUnit)}
          />
          {plan.maxDosesPerDay ? (
            <DetailRow
              label={language === "ru" ? "Ограничение" : "Limit"}
              value={
                language === "ru"
                  ? `До ${plan.maxDosesPerDay} раз в сутки`
                  : `Up to ${plan.maxDosesPerDay} times per day`
              }
            />
          ) : null}
          {medicine && (medicine.medicineForm || medicine.medicineConcentration) ? (
            <DetailRow
              label={language === "ru" ? "Форма" : "Form"}
              value={[medicine.medicineForm ?? null, medicine.medicineConcentration ?? null]
                .filter(Boolean)
                .join(" · ")}
            />
          ) : null}
          {weightHint ? (
            <DetailRow label={language === "ru" ? "По весу" : "Weight based"} value={weightHint} />
          ) : null}
        </section>

        <section className="space-y-3">
          <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {language === "ru" ? "История" : "History"}
          </h5>
          {stats?.lastAdministration ? (
            <DetailRow
              label={language === "ru" ? "Последний приём" : "Last dose"}
              value={[
                formatDateTime(stats.lastAdministration.administeredAt),
                getAdministrationActorLabel(stats.lastAdministration, language),
              ]
                .filter(Boolean)
                .join(" • ")}
            />
          ) : null}
          {(stats?.todayCount ?? 0) > 0 ? (
            <DetailRow
              label={language === "ru" ? "Сегодня" : "Today"}
              value={
                plan.maxDosesPerDay
                  ? language === "ru"
                    ? `Отмечено ${stats?.todayCount ?? 0} из ${plan.maxDosesPerDay}`
                    : `Logged ${stats?.todayCount ?? 0} of ${plan.maxDosesPerDay}`
                  : language === "ru"
                    ? `Отмечено ${stats?.todayCount ?? 0}`
                    : `Logged ${stats?.todayCount ?? 0}`
              }
            />
          ) : null}
          {plan.notes?.trim() ? (
            <DetailRow label={language === "ru" ? "Заметка" : "Note"} value={plan.notes.trim()} />
          ) : null}
        </section>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {onTakeDose && (
            <button
              type="button"
              onClick={() => onTakeDose(plan)}
              disabled={isSubmittingAdministration || !!stats?.isBlocked || isUnavailable}
              className={`${appBtnPrimaryClass} min-h-[2.95rem] disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
            >
              {isSubmittingAdministration
                ? language === "ru"
                  ? "Отмечаем…"
                  : "Logging…"
                : isUnavailable
                  ? language === "ru"
                    ? "Недоступно"
                    : "Unavailable"
                  : stats?.isBlocked
                    ? language === "ru"
                      ? "Рано"
                      : "Too early"
                    : language === "ru"
                      ? "Отметить приём"
                      : "Log dose"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className={`${appBtnSecondaryClass} min-h-[2.85rem] sm:min-h-[3.05rem]`}
          >
            {language === "ru" ? "Изменить" : "Edit"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteConfirmOpen(true)}
          disabled={isDeleting}
          className={`${appBtnDangerClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:min-h-[3.1rem] sm:px-5`}
        >
          {isDeleting
            ? language === "ru"
              ? "Удаляем…"
              : "Deleting…"
            : language === "ru"
              ? "Удалить"
              : "Delete"}
        </button>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-1 sm:grid-cols-[148px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <p className="text-xs font-medium tracking-[0.04em] text-muted">{label}</p>
      <p className="text-sm font-medium leading-6 text-foreground sm:text-right">{value}</p>
    </div>
  );
}

type EpisodeTimelineItem = {
  id: string;
  at: string;
  kind: "temperature" | "administration" | "comment";
  title: string;
  description: string;
};

function EpisodeTimelineList({ items }: { items: EpisodeTimelineItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="soft-card rounded-[24px] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TimelineKindPill kind={item.kind} />
                <p className="text-base font-semibold text-foreground">{item.title}</p>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                {item.description}
              </p>
            </div>
            <InfoPill label={formatDateTime(item.at)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TimelineKindPill({ kind }: { kind: EpisodeTimelineItem["kind"] }) {
  const { language } = useI18n();
  const config: Record<EpisodeTimelineItem["kind"], { label: string; className: string }> = {
    temperature: {
      label: language === "ru" ? "Температура" : "Temperature",
      className: "soft-note-danger",
    },
    administration: {
      label: language === "ru" ? "Лекарство" : "Medicine",
      className: "soft-note-info",
    },
    comment: {
      label: language === "ru" ? "Комментарий" : "Comment",
      className: "soft-note-warning",
    },
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${config[kind].className}`}>
      {config[kind].label}
    </span>
  );
}

function formatEpisodePeriod(startedAt: string, closedAt: string | null, language: "ru" | "en") {
  return closedAt
    ? `${formatDate(startedAt)} - ${formatDate(closedAt)}`
    : `${language === "ru" ? "с" : "since"} ${formatDate(startedAt)}`;
}

function formatWeightValue(valueKg: number, language: "ru" | "en" = "ru"): string {
  const unit = language === "ru" ? "кг" : "kg";
  return `${new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: valueKg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(valueKg)} ${unit}`;
}

function formatEntrySummary(
  temperatureCount: number,
  administrationCount: number,
  commentCount: number,
  language: "ru" | "en"
) {
  return language === "ru"
    ? [`${temperatureCount} темп.`, `${administrationCount} приёма`, `${commentCount} комм.`].join(
        " • "
      )
    : [`${temperatureCount} temps`, `${administrationCount} doses`, `${commentCount} notes`].join(
        " • "
      );
}

function buildEpisodeTimeline(
  temperatures: TemperatureEntry[],
  administrations: AdministrationEvent[],
  comments: IllnessComment[],
  medicines: HouseholdMedicine[],
  language: "ru" | "en" = "ru"
): EpisodeTimelineItem[] {
  const temperatureItems = temperatures.map((entry) => ({
    id: `temp-${entry.id}`,
    at: entry.measuredAt,
    kind: "temperature" as const,
    title: `${entry.valueCelsius} °C`,
    description:
      entry.comment?.trim() || (language === "ru" ? "Замер температуры" : "Temperature reading"),
  }));

  const administrationItems = administrations.map((entry) => {
    const medicine = entry.householdMedicineId
      ? medicines.find((item) => item.id === entry.householdMedicineId)
      : null;
    const reason = entry.reason?.trim();
    const actorLabel = getAdministrationActorLabel(entry, language);
    const doseLabel = entry.amount?.trim();
    const descriptionLines: string[] = [];

    if (doseLabel) {
      descriptionLines.push(`${language === "ru" ? "Доза" : "Dose"}: ${doseLabel}`);
    }

    if (actorLabel) {
      descriptionLines.push(actorLabel);
    }
    if (reason) {
      descriptionLines.push(reason);
    }

    return {
      id: `admin-${entry.id}`,
      at: entry.administeredAt,
      kind: "administration" as const,
      title:
        entry.customMedicineName ??
        medicine?.medicineName ??
        (language === "ru" ? "Приём лекарства" : "Dose logged"),
      description: descriptionLines.join("\n"),
    };
  });

  const commentItems = comments.map((entry) => ({
    id: `comment-${entry.id}`,
    at: entry.createdAt,
    kind: "comment" as const,
    title: language === "ru" ? "Комментарий" : "Comment",
    description: entry.text,
  }));

  return [...temperatureItems, ...administrationItems, ...commentItems].sort((left, right) =>
    right.at.localeCompare(left.at)
  );
}

function parseNullableInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) {
    return null;
  }

  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}
