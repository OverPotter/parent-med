/**
 * Эпизоды болезни ребёнка: список, создание, журнал температуры и приёмы.
 */

import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import {
  createIllnessEpisode,
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodesByChildId,
  updateIllnessEpisode,
} from "@shared/api/illnessEpisodes";
import { createEpisodeMedicationPlan } from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { createIllnessComment } from "@shared/api/illnessComments";
import { createAdministrationEvent } from "@shared/api/administrationEvents";
import { createTemperatureEntry } from "@shared/api/temperatureEntries";
import { fetchLatestWeightEntryByChildId } from "@shared/api/weightEntries";
import { trackIllnessEpisodeStarted } from "@shared/analytics";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { formatChildAgeLabel } from "@client/i18n/children";
import { formatChildDatePlain } from "@client/utils/childDateFormat";
import { EpisodeActivationCard } from "./child-illness/forms";
import {
  HistoryEpisodeCard,
  HistoryEpisodeDetailScreen,
  HistoryEpisodeInsightsScreen,
  HistoryInsightsPreview,
} from "./child-illness/history";
import { EpisodeBlock } from "./child-illness/EpisodeBlock";
import { SummaryCard, appPillActionClass, formatWeightValue } from "./child-illness/shared";

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
  const openEpisodeId = source.get("openEpisodeId");
  const focus = source.get("focus") ?? source.get("compose");
  const plan = source.get("plan");
  const picker = source.get("picker");

  if (view === "history") {
    next.set("view", "history");
    if (episodeId) {
      next.set("episodeId", episodeId);
      return next;
    }
    if (openEpisodeId) {
      next.set("openEpisodeId", openEpisodeId);
      return next;
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
    if (picker === "cabinet") {
      next.set("picker", "cabinet");
    }
    return next;
  }

  next.set("focus", focus);
  if (focus === "reminder-create" && picker === "cabinet") {
    next.set("picker", "cabinet");
  }
  return next;
}

export function ChildIllnessPage() {
  const { language } = useI18n();
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const queryClient = useQueryClient();
  const historyOnlyView = searchParams.get("view") === "history";
  const historyEpisodeInsightsId = historyOnlyView ? searchParams.get("episodeId") : null;
  const historyEpisodeInsightsMode = Boolean(historyEpisodeInsightsId);
  const historyEpisodeDetailId = historyOnlyView ? searchParams.get("openEpisodeId") : null;
  const historyEpisodeDetailMode = Boolean(historyEpisodeDetailId);
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

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    });
  }, [activeEpisode, createMode, historyOnlyView]);

  useEffect(() => {
    if (!historyOnlyView || (!historyEpisodeInsightsMode && !historyEpisodeDetailMode)) {
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
  }, [historyOnlyView, historyEpisodeDetailMode, historyEpisodeInsightsMode]);

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
  const focusedHistoryDetailEpisode = historyEpisodeDetailId
    ? (historyEpisodes.find((episode) => episode.id === historyEpisodeDetailId) ?? null)
    : null;
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
  const topBarTitle =
    historyOnlyView || (!activeEpisode && !createMode)
      ? child.name
      : !activeEpisode && createMode
        ? `${language === "ru" ? "Новое наблюдение" : "New tracking"} · ${child.name}`
        : undefined;
  const topBarHint = historyOnlyView
    ? historyEpisodeInsightsMode
      ? language === "ru"
        ? "Подробный разбор конкретного эпизода."
        : "Detailed breakdown of a specific episode."
      : historyEpisodeDetailMode
        ? language === "ru"
          ? "Открыта одна запись из истории."
          : "One history record is opened."
        : historyEpisodes.length > 0
          ? language === "ru"
            ? "Сводка и завершённые наблюдения по ребёнку."
            : "Summary and completed tracking records for this child."
          : language === "ru"
            ? "Сводка появится здесь, когда завершённые наблюдения накопятся."
            : "The summary will appear here as completed tracking records build up."
    : !activeEpisode && createMode
      ? language === "ru"
        ? "Сначала просто начните наблюдение. Температуру, лекарства и напоминания можно добавить уже внутри записи."
        : "Start with a tracking session first. Temperature, medicines and reminders can be added inside it."
      : !activeEpisode && !createMode
        ? language === "ru"
          ? "Сейчас активного наблюдения нет."
          : "There is no active tracking right now."
        : undefined;

  return (
    <div className="child-profile-shell space-y-7">
      <ChildSectionTopBar
        backHref={backHref}
        backLabel={backLabel}
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
            {historyEpisodeInsightsMode ? (
              <div className="flex justify-end">
                <Link
                  to={`/children/${child.id}/illness?view=history`}
                  className={appPillActionClass}
                >
                  {language === "ru" ? "Ко всей истории" : "Back to history"}
                </Link>
              </div>
            ) : null}

            {historyEpisodeInsightsMode && focusedHistoryEpisode ? (
              <HistoryEpisodeInsightsScreen episode={focusedHistoryEpisode} />
            ) : null}

            {historyEpisodeDetailMode && focusedHistoryDetailEpisode ? (
              <HistoryEpisodeDetailScreen
                childId={child.id}
                episode={focusedHistoryDetailEpisode}
                episodeNumber={
                  historyEpisodes.length -
                  historyEpisodes.findIndex((item) => item.id === focusedHistoryDetailEpisode.id)
                }
                medicines={familyMedicines}
              />
            ) : null}

            {!historyEpisodeInsightsMode && !historyEpisodeDetailMode && (
              <HistoryInsightsPreview childId={child.id} />
            )}

            {!historyEpisodeInsightsMode &&
            !historyEpisodeDetailMode &&
            historyEpisodes.length > 0 ? (
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
            ) : !historyEpisodeInsightsMode && !historyEpisodeDetailMode ? (
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
