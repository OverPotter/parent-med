import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import {
  deleteIllnessEpisode,
  fetchIllnessEpisodeInsights,
  fetchIllnessHistorySummary,
} from "@shared/api/illnessEpisodes";
import { fetchTemperatureEntriesByEpisodeId } from "@shared/api/temperatureEntries";
import { fetchAdministrationEventsByEpisodeId } from "@shared/api/administrationEvents";
import { fetchIllnessCommentsByEpisodeId } from "@shared/api/illnessComments";
import type {
  HouseholdMedicine,
  IllnessEpisode,
  IllnessEpisodeInsights,
  TemperatureEntry,
} from "@shared/types/api";
import { formatChildDate, formatChildDateTime } from "@client/utils/childDateFormat";
import {
  EpisodeFactRow,
  EpisodeMetricCard,
  appBtnDangerClass,
  appPillActionClass,
  formatDurationValue,
  getHistoryPeriodHint,
  illnessListClass,
  illnessPanelClass,
  illnessPanelSoftClass,
  formatEpisodePeriod,
} from "./shared";
import { EpisodeTimelineList, buildEpisodeTimeline, formatEntrySummary } from "./timeline";

export function HistoryInsightsPreview({ childId }: { childId: string }) {
  const { language } = useI18n();
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodOptions = [
    {
      key: "month",
      label: language === "ru" ? "Месяц" : "Month",
    },
    {
      key: "quarter",
      label: language === "ru" ? "3 месяца" : "3 months",
    },
    {
      key: "half_year",
      label: language === "ru" ? "6 месяцев" : "6 months",
    },
    {
      key: "year",
      label: language === "ru" ? "Год" : "Year",
    },
    {
      key: "all",
      label: language === "ru" ? "Всё время" : "All time",
    },
  ] as const;
  const [selectedPeriod, setSelectedPeriod] =
    useState<(typeof periodOptions)[number]["key"]>("half_year");
  const liveQueryOptions = useLiveQueryOptions(10000);
  const {
    data: summary,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["illness-history-summary", childId, selectedPeriod],
    queryFn: () => fetchIllnessHistorySummary(childId, selectedPeriod),
    enabled: !!childId,
    placeholderData: (previous) => previous,
    ...liveQueryOptions,
  });

  useEffect(() => {
    if (!isPeriodMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !periodMenuRef.current?.contains(target)) {
        setIsPeriodMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPeriodMenuOpen]);

  if (isLoading || !summary) {
    return (
      <div className="soft-panel-muted rounded-[28px] px-5 py-8 text-sm text-muted">
        {language === "ru" ? "Готовим сводку…" : "Preparing summary…"}
      </div>
    );
  }

  const selectedPeriodLabel =
    periodOptions.find((item) => item.key === selectedPeriod)?.label ??
    (language === "ru" ? "Период" : "Period");
  const selectedPeriodHint = getHistoryPeriodHint(selectedPeriod, language);
  const isSummaryUpdating = isFetching || summary.period !== selectedPeriod;

  const summaryPills = [
    {
      label: language === "ru" ? "За период" : "In period",
      value: language === "ru" ? `${summary.episodeCount} эп.` : `${summary.episodeCount} ep.`,
      tone: "bg-rose-500",
    },
    {
      label: language === "ru" ? "Средняя" : "Average",
      value: formatDurationValue(summary.averageDurationDays, language),
      tone: "bg-amber-500",
    },
    {
      label: language === "ru" ? "Долгий" : "Longest",
      value:
        summary.longestDurationDays > 0
          ? formatDurationValue(summary.longestDurationDays, language)
          : language === "ru"
            ? "Нет данных"
            : "No data",
      tone: "bg-orange-500",
    },
    {
      label:
        selectedPeriod === "month"
          ? language === "ru"
            ? "Напоминания"
            : "Reminders"
          : language === "ru"
            ? "Активный"
            : "Active",
      value:
        selectedPeriod === "month"
          ? String(summary.guidedEpisodes)
          : (translateAnalyticsLabel(summary.mostActivePeriodLabel, language) ??
            (language === "ru" ? "Нет данных" : "No data")),
      tone: "bg-sky-500",
    },
    {
      label: language === "ru" ? "Лекарства" : "Meds",
      value: String(summary.episodesWithAdministrations),
      tone: "bg-teal-500",
    },
    {
      label: language === "ru" ? "Всего" : "Total",
      value: String(summary.totalClosedEpisodes),
      tone: "bg-violet-500",
    },
  ];

  return (
    <Surface className="relative z-30 overflow-visible p-4 sm:p-5">
      <div className="space-y-4">
        <div ref={periodMenuRef} className="relative z-50">
          <button
            type="button"
            onClick={() => setIsPeriodMenuOpen((current) => !current)}
            className="soft-pill app-profile-action app-profile-action--split min-h-[2.45rem] w-full gap-2 rounded-[18px] text-left text-xs font-extrabold"
            aria-haspopup="listbox"
            aria-expanded={isPeriodMenuOpen}
            aria-busy={isSummaryUpdating}
          >
            <span className="min-w-0 truncate">{selectedPeriodLabel}</span>
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
            >
              ▾
            </span>
          </button>
          <p className="mt-2 px-1 text-[0.78rem] leading-5 text-muted">{selectedPeriodHint}</p>
          {isPeriodMenuOpen ? (
            <div
              role="listbox"
              className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-full min-w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-border bg-background p-2 shadow-[0_24px_64px_rgba(15,23,42,0.28)]"
            >
              {periodOptions.map((item) => {
                const isActive = selectedPeriod === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setSelectedPeriod(item.key);
                      setIsPeriodMenuOpen(false);
                    }}
                    className={[
                      "flex min-h-[2.45rem] w-full items-center justify-between rounded-[17px] px-3 text-left text-sm font-extrabold tracking-[-0.02em] transition",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                        : "bg-surface text-foreground hover:bg-surface-muted",
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    {isActive ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div
          key={summary.period}
          className={[
            "grid grid-cols-2 gap-1.5 transition-opacity sm:gap-2",
            isSummaryUpdating ? "opacity-55" : "opacity-100",
          ].join(" ")}
        >
          {summaryPills.map((item) => (
            <SummaryPill key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
      </div>
    </Surface>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="inline-flex min-h-[2.35rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.7rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
          {label}
        </span>
        <span className="block whitespace-normal break-words text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
          {value}
        </span>
      </span>
    </div>
  );
}

export function HistoryEpisodeCard({
  childId,
  episode,
  episodeNumber,
}: {
  childId: string;
  episode: IllnessEpisode;
  episodeNumber: number;
}) {
  const { language } = useI18n();
  const historyEpisodeActionClass = `${appPillActionClass} min-h-[2.65rem] px-3 text-[0.82rem] tracking-[-0.025em] sm:min-h-[3rem] sm:px-4 sm:text-[0.88rem]`;
  return (
    <li className="overflow-hidden rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-surface-glare-soft)_55%,transparent)] transition-colors sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs tracking-[0.08em] text-muted">
            {language === "ru" ? "Эпизод" : "Episode"} {episodeNumber} ·{" "}
            {formatEpisodePeriod(episode.startedAt, episode.closedAt, language)}
          </p>
          <p className="mt-2 text-base font-medium text-[color:color-mix(in_srgb,var(--color-primary)_62%,var(--color-foreground))]">
            {episode.title?.trim() || (language === "ru" ? "Без названия" : "Untitled")}
          </p>
          <p className="mt-1 text-sm text-muted">
            {episode.closedAt
              ? `${language === "ru" ? "Закрыт" : "Closed"} ${formatChildDateTime(
                  episode.closedAt,
                  language
                )}`
              : language === "ru"
                ? "Дата закрытия не указана"
                : "Close date is not set"}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
            {episode.note?.trim() || (language === "ru" ? "Без описания" : "No description")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={`/children/${childId}/illness?view=history&episodeId=${episode.id}`}
            className={historyEpisodeActionClass}
          >
            {language === "ru" ? "Разбор" : "Insights"}
          </Link>
          <Link
            to={`/children/${childId}/illness?view=history&openEpisodeId=${episode.id}`}
            className={historyEpisodeActionClass}
          >
            {language === "ru" ? "Открыть" : "Open"}
          </Link>
        </div>
      </div>
    </li>
  );
}

export function HistoryEpisodeDetailScreen({
  childId,
  episode,
  episodeNumber,
  medicines,
}: {
  childId: string;
  episode: IllnessEpisode;
  episodeNumber: number;
  medicines: HouseholdMedicine[];
}) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const liveQueryOptions = useLiveQueryOptions(10000);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
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
  const deleteEpisodeMutation = useMutation({
    mutationFn: () => deleteIllnessEpisode(episode.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", childId] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", childId] });
      navigate(`/children/${childId}/illness?view=history`, { replace: true });
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
    <div className="space-y-4">
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
        onConfirm={() => deleteEpisodeMutation.mutate()}
      />

      <div className="grid grid-cols-2 gap-2">
        <Link to={`/children/${childId}/illness?view=history`} className={appPillActionClass}>
          {language === "ru" ? "Ко всей истории" : "Back to full history"}
        </Link>
        <Link
          to={`/children/${childId}/illness?view=history&episodeId=${episode.id}`}
          className={appPillActionClass}
        >
          {language === "ru" ? "Разбор" : "Insights"}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <EpisodeMetricCard
          label={language === "ru" ? "Эпизод" : "Episode"}
          value={String(episodeNumber)}
        />
        <EpisodeMetricCard
          label={language === "ru" ? "Период" : "Period"}
          value={formatEpisodePeriod(episode.startedAt, episode.closedAt, language)}
        />
        <EpisodeMetricCard
          label={language === "ru" ? "Записей" : "Entries"}
          value={formatEntrySummary(
            temperatureEntries.length,
            administrations.length,
            comments.length,
            language
          )}
        />
        <EpisodeMetricCard
          label={language === "ru" ? "Название" : "Title"}
          value={episode.title?.trim() || (language === "ru" ? "Без названия" : "Untitled")}
        />
      </div>

      <section className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-foreground">
          {language === "ru" ? "Описание" : "Description"}
        </h3>
        <div className={`${illnessPanelClass} px-4 py-4`}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
            {episode.note?.trim() || (language === "ru" ? "Без описания" : "No description")}
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="px-1 text-sm font-semibold text-foreground">
          {language === "ru" ? "Что уже записано" : "What is already logged"}
        </h3>
        {timelineItems.length > 0 ? (
          <EpisodeTimelineList items={timelineItems} language={language} />
        ) : (
          <div className="soft-empty rounded-[22px] px-4 py-6 text-sm text-muted">
            {language === "ru"
              ? "Для этого наблюдения ещё нет записей."
              : "There are no records for this tracking yet."}
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-[color:color-mix(in_srgb,var(--color-danger)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--color-surface)_66%,var(--color-background)_34%)] px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
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
            className={`${appBtnDangerClass} min-h-[2.85rem] w-full px-3.5 disabled:opacity-50 sm:min-h-[3rem] sm:w-auto`}
          >
            {deleteEpisodeMutation.isPending
              ? language === "ru"
                ? "Удаляем…"
                : "Deleting…"
              : language === "ru"
                ? "Удалить"
                : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function HistoryEpisodeInsightsScreen({ episode }: { episode: IllnessEpisode }) {
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
        ? formatChildDateTime(insights.lastEventAt, language)
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
      <div className="space-y-3">
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
              {language === "ru" ? "Пик" : "Peak"}{" "}
              {formatChildDateTime(insights.peakTemperatureAt, language)}
            </span>
          )}
        </div>

        <EpisodeMetricsRow items={[...summaryMetrics, ...summaryFacts]} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="space-y-2">
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
          </div>

          <div>
            {temperatures.length > 0 ? (
              <EpisodeTemperatureTrend items={temperatures} language={language} />
            ) : (
              <div className="soft-empty rounded-[20px] px-4 py-6 text-[0.9rem] text-muted sm:text-sm">
                {language === "ru"
                  ? "Для этого эпизода ещё нет замеров температуры."
                  : "There are no temperature readings for this episode yet."}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="app-card-title">
            {language === "ru" ? "Ключевые детали" : "Key details"}
          </h4>
          <div className={illnessListClass}>
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
              value={formatChildDate(episode.startedAt, language)}
            />
            <EpisodeFactRow
              label={language === "ru" ? "Первый замер" : "First reading"}
              value={
                insights.firstTemperatureAt
                  ? formatChildDateTime(insights.firstTemperatureAt, language)
                  : language === "ru"
                    ? "Нет замеров"
                    : "No readings"
              }
            />
            <EpisodeFactRow
              label={language === "ru" ? "Последний приём" : "Last dose"}
              value={
                insights.lastAdministrationAt
                  ? formatChildDateTime(insights.lastAdministrationAt, language)
                  : language === "ru"
                    ? "Без приёмов"
                    : "No doses"
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function EpisodeMetricsRow({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 xl:grid-cols-4">
      {items.map((item) => (
        <EpisodeMetricCard key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function EpisodeTemperatureTrend({
  items,
  language,
}: {
  items: TemperatureEntry[];
  language: "ru" | "en";
}) {
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
      <div className={`${illnessPanelSoftClass} rounded-[22px] px-3 py-3 sm:px-4`}>
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
            <p className="text-[11px] leading-4 text-muted">
              {formatChildDateTime(item.measuredAt, language)}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.valueCelsius} °C</p>
          </div>
        ))}
      </div>
    </div>
  );
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
