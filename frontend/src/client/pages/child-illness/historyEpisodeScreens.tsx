import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { fetchIllnessEpisodeInsights } from "@shared/api/illnessEpisodes";
import type { IllnessEpisode, IllnessEpisodeInsights, TemperatureEntry } from "@shared/types/api";
import { formatChildDate, formatChildDateTime } from "@client/utils/childDateFormat";
import {
  EpisodeFactRow,
  EpisodeMetricCard,
  appPillActionClass,
  formatEpisodePeriod,
  illnessListClass,
  illnessPanelSoftClass,
} from "./shared";

function formatTemperatureValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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
  const historyEpisodeActionClass = appPillActionClass;
  return (
    <li className="soft-panel overflow-hidden rounded-[24px] px-3 py-3 transition-colors sm:px-4">
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
        </div>
      </div>
    </li>
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
    createdByAccountId: null,
    createdByNameSnapshot: null,
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
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatTemperatureValue(item.valueCelsius)} °C
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDurationValue(days: number, language: "ru" | "en") {
  if (language === "ru") {
    if (days === 1) return "1 день";
    if (days < 5) return `${days} дня`;
    return `${days} дней`;
  }
  return days === 1 ? "1 day" : `${days} days`;
}
