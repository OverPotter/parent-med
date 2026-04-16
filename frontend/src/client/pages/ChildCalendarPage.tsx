import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchFeedingRecordsByChildId } from "@shared/api/feedingRecords";
import { fetchHeightEntriesByChildId } from "@shared/api/heightEntries";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { fetchSleepSessionsByChildId } from "@shared/api/sleepSessions";
import { fetchWeightEntriesByChildId } from "@shared/api/weightEntries";
import { logout } from "@shared/api/auth";
import { FeedbackIcon, ProfileMenu } from "@shared/components/Layout";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  FeedingRecord,
  HeightEntry,
  IllnessEpisode,
  SleepSession,
  WeightEntry,
} from "@shared/types/api";
import { formatDate, formatDateTime, getLocalIsoDate } from "@shared/utils/date";

type ViewMode = "feed" | "calendar" | "charts";
type PeriodKey = "day" | "week" | "month";
type EventKind = "sleep" | "feeding" | "illness" | "weight" | "height";

interface TimelineEvent {
  id: string;
  kind: EventKind;
  at: string;
  title: string;
  detail: string;
  value?: string;
}

interface SummaryItem {
  kind: EventKind | "events" | "measurements";
  label: string;
  value: string;
  hint: string;
}

const eventKinds: EventKind[] = ["sleep", "feeding", "illness", "weight", "height"];

const kindStyles: Record<EventKind, string> = {
  sleep: "bg-sky-500",
  feeding: "bg-teal-500",
  illness: "bg-rose-500",
  weight: "bg-emerald-500",
  height: "bg-lime-500",
};

const summaryAccentStyles: Record<SummaryItem["kind"], string> = {
  sleep: "bg-sky-500",
  feeding: "bg-teal-500",
  illness: "bg-rose-500",
  weight: "bg-emerald-500",
  height: "bg-lime-500",
  events: "bg-violet-500",
  measurements: "bg-emerald-500",
};

const copy = {
  ru: {
    loading: "Загрузка…",
    back: "← К профилю ребёнка",
    title: "Обзор",
    hint: "Лента, календарь и графики помогают быстро понять, что происходило с ребёнком.",
    feed: "Лента",
    calendar: "Календарь",
    charts: "Графики",
    day: "День",
    week: "7 дней",
    month: "30 дней",
    date: "Дата",
    summaryPeriodPrefix: "За период",
    all: "Все",
    filters: {
      sleep: "Сон",
      feeding: "Кормление",
      illness: "Болезни",
      weight: "Вес",
      height: "Рост",
    },
    summary: {
      sleep: "Сон",
      feeding: "Кормление",
      illness: "Болезни",
      weight: "Вес",
      height: "Рост",
      measurements: "Рост/вес",
      events: "Событий",
      noData: "Нет данных",
      none: "Нет",
      calm: "спокойно",
      perDay: "в день",
      episodes: "эп.",
      records: "зап.",
      active: "активно",
      latest: "последнее",
    },
    empty: "За выбранный период событий нет. Измените дату, период или фильтры.",
    calendarHint: "Точки показывают типы событий в дне. Нажмите на день, чтобы открыть ленту.",
    chartsHint: "Быстрые графики по выбранному периоду. Детальную аналитику добавим следующим этапом.",
    sleepTotal: "Сон за период",
    feedingTotal: "Кормлений",
    illnessTotal: "Болезней",
    measurements: "Замеры",
    noChartData: "Недостаточно данных для графика.",
    sleepStarted: "Сон",
    feedingRecorded: "Кормление",
    illnessStarted: "Начато наблюдение",
    illnessClosed: "Завершено наблюдение",
    illnessObservation: "Наблюдение",
    illnessNoTitle: "Без названия",
    illnessOpenValue: "активно",
    weightMeasured: "Вес",
    heightMeasured: "Рост",
    activeStatus: "идёт сейчас",
    closedStatus: "завершено",
    formula: "смесь",
    breast: "грудь",
  },
  en: {
    loading: "Loading…",
    back: "← Back to child profile",
    title: "Overview",
    hint: "Feed, calendar and charts show what happened with the child across the selected period.",
    feed: "Feed",
    calendar: "Calendar",
    charts: "Charts",
    day: "Day",
    week: "7 days",
    month: "30 days",
    date: "Date",
    summaryPeriodPrefix: "For period",
    all: "All",
    filters: {
      sleep: "Sleep",
      feeding: "Feeding",
      illness: "Illness",
      weight: "Weight",
      height: "Height",
    },
    summary: {
      sleep: "Sleep",
      feeding: "Feeding",
      illness: "Illness",
      weight: "Weight",
      height: "Height",
      measurements: "Growth",
      events: "Events",
      noData: "No data",
      none: "None",
      calm: "calm",
      perDay: "per day",
      episodes: "ep.",
      records: "rec.",
      active: "active",
      latest: "latest",
    },
    empty: "No events for the selected period. Change date, period or filters.",
    calendarHint: "Dots show event types for each day. Tap a day to open the feed.",
    chartsHint: "Quick charts for the selected period. Detailed analytics can be added next.",
    sleepTotal: "Sleep in period",
    feedingTotal: "Feedings",
    illnessTotal: "Illnesses",
    measurements: "Measurements",
    noChartData: "Not enough data for a chart.",
    sleepStarted: "Sleep",
    feedingRecorded: "Feeding",
    illnessStarted: "Tracking started",
    illnessClosed: "Tracking closed",
    illnessObservation: "Observation",
    illnessNoTitle: "Untitled",
    illnessOpenValue: "active",
    weightMeasured: "Weight",
    heightMeasured: "Height",
    activeStatus: "active now",
    closedStatus: "closed",
    formula: "formula",
    breast: "breast",
  },
} as const;

export function ChildCalendarPage() {
  const { copy: sharedCopy, language } = useI18n();
  const text = copy[language];
  const { childId } = useParams<{ childId: string }>();
  const accountLogin = useAppStore((s) => s.accountLogin);
  const accountDisplayName = useAppStore((s) => s.accountDisplayName);
  const clearSession = useAppStore((s) => s.clearSession);
  const [mode, setMode] = useState<ViewMode>("feed");
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [anchorDate, setAnchorDate] = useState(getLocalIsoDate());
  const [enabledKinds, setEnabledKinds] = useState<EventKind[]>(eventKinds);

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId,
  });
  const { data: sleepSessions = [], isLoading: isSleepLoading } = useQuery({
    queryKey: ["sleep-sessions", childId],
    queryFn: () => fetchSleepSessionsByChildId(childId!),
    enabled: !!childId,
  });
  const { data: feedingRecords = [], isLoading: isFeedingLoading } = useQuery({
    queryKey: ["feeding-records", childId],
    queryFn: () => fetchFeedingRecordsByChildId(childId!),
    enabled: !!childId,
  });
  const { data: illnessEpisodes = [], isLoading: isIllnessLoading } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId,
  });
  const { data: weightEntries = [], isLoading: isWeightLoading } = useQuery({
    queryKey: ["weight-entries", childId],
    queryFn: () => fetchWeightEntriesByChildId(childId!),
    enabled: !!childId,
  });
  const { data: heightEntries = [], isLoading: isHeightLoading } = useQuery({
    queryKey: ["height-entries", childId],
    queryFn: () => fetchHeightEntriesByChildId(childId!),
    enabled: !!childId,
  });

  const isLoading =
    isChildLoading ||
    isSleepLoading ||
    isFeedingLoading ||
    isIllnessLoading ||
    isWeightLoading ||
    isHeightLoading;

  const dateRange = useMemo(() => buildDateRange(anchorDate, period), [anchorDate, period]);
  const allEvents = useMemo(
    () =>
      buildTimelineEvents({
        sleepSessions,
        feedingRecords,
        illnessEpisodes,
        weightEntries,
        heightEntries,
        language,
      }),
    [feedingRecords, heightEntries, illnessEpisodes, language, sleepSessions, weightEntries]
  );
  const visibleEvents = useMemo(
    () =>
      allEvents
        .filter((event) => enabledKinds.includes(event.kind))
        .filter((event) => isDateInRange(event.at, dateRange.start, dateRange.end))
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [allEvents, dateRange.end, dateRange.start, enabledKinds]
  );
  const groupedEvents = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents]);
  const summary = useMemo(
    () => buildSummary(visibleEvents, sleepSessions, feedingRecords, illnessEpisodes, text, language),
    [feedingRecords, illnessEpisodes, language, sleepSessions, text, visibleEvents]
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(anchorDate, allEvents, enabledKinds),
    [allEvents, anchorDate, enabledKinds]
  );
  const chartDays = useMemo(
    () => buildChartDays(dateRange.start, dateRange.end, allEvents),
    [allEvents, dateRange.end, dateRange.start]
  );
  const accountLabel = accountDisplayName || accountLogin || sharedCopy.common.userFallback;

  if (!childId || isLoading || !child) {
    return <p className="text-sm text-muted">{text.loading}</p>;
  }

  const tabClass = (tab: ViewMode) =>
    [
      "inline-flex min-h-[2.55rem] flex-1 items-center justify-center rounded-full border px-3 py-1.5 text-center text-xs font-extrabold tracking-[-0.015em] transition",
      mode === tab
        ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_26px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
        : "border-border bg-surface-muted text-muted hover:border-primary/35 hover:text-foreground",
    ].join(" ");
  const periodClass = (value: PeriodKey) =>
    [
      "inline-flex min-h-[2.35rem] items-center justify-center rounded-full border px-3.5 py-1 text-xs font-extrabold tracking-[-0.015em] transition",
      period === value
        ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
        : "border-border bg-surface-muted text-muted hover:border-primary/35 hover:text-foreground",
    ].join(" ");
  const periodLabel = period === "day" ? text.day : period === "week" ? text.week : text.month;
  const filterClass = (kind: EventKind) =>
    [
      "soft-pill inline-flex min-h-[2.2rem] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
      enabledKinds.includes(kind) ? "text-foreground" : "opacity-45",
    ].join(" ");
  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Локальный выход всё равно должен отработать, даже если сессия уже истекла.
    } finally {
      clearSession();
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <Link
          to={`/children/${child.id}`}
          className="inline-flex min-h-[2.35rem] items-center text-sm text-primary hover:underline"
        >
          {text.back}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/feedback"
            className="app-header-utility-button inline-flex h-[2.35rem] min-h-[2.35rem] w-[2.35rem] items-center justify-center p-0"
            aria-label={sharedCopy.feedback.navShort}
            title={sharedCopy.feedback.navShort}
          >
            <FeedbackIcon />
            <span className="sr-only">{sharedCopy.feedback.navShort}</span>
          </Link>
          <ProfileMenu
            accountLabel={accountLabel}
            servicesLabel={sharedCopy.clientLayout.nav.more}
            settingsLabel={sharedCopy.common.settings}
            logoutLabel={sharedCopy.common.logoutFromAccount}
            menuLabel={sharedCopy.common.profileMenuLabel}
            onLogout={handleLogout}
            iconOnly
          />
        </div>
      </div>

      <div className="space-y-1 px-1">
        <h1 className="app-card-title">
          {text.title} · {child.name}
        </h1>
        <p className="text-sm text-muted">{text.hint}</p>
      </div>

      <Surface className="space-y-2 p-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">
            {text.summaryPeriodPrefix}
          </p>
          <span className="inline-flex min-h-[1.55rem] items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-[0.68rem] font-bold text-muted">
            {periodLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {summary.map((item) => (
            <div
              key={item.label}
              className="inline-flex min-h-[2.05rem] min-w-0 items-center gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${summaryAccentStyles[item.kind]}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-[0.72rem] font-extrabold tracking-[-0.02em] text-foreground">
                {item.label} {item.value}
              </span>
              <span className="text-[0.7rem] font-semibold text-muted">/</span>
              <span className="max-w-[4.8rem] shrink-0 truncate text-[0.7rem] font-semibold text-muted">
                {item.hint}
              </span>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="space-y-3 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => setMode("feed")} className={tabClass("feed")}>
            {text.feed}
          </button>
          <button
            type="button"
            onClick={() => setMode("calendar")}
            className={tabClass("calendar")}
          >
            {text.calendar}
          </button>
          <button type="button" onClick={() => setMode("charts")} className={tabClass("charts")}>
            {text.charts}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button type="button" onClick={() => setPeriod("day")} className={periodClass("day")}>
            {text.day}
          </button>
          <button type="button" onClick={() => setPeriod("week")} className={periodClass("week")}>
            {text.week}
          </button>
          <button type="button" onClick={() => setPeriod("month")} className={periodClass("month")}>
            {text.month}
          </button>
          <label className="ml-0 flex min-h-[2.35rem] items-center gap-2 rounded-full border border-border bg-surface-muted px-3 text-xs font-semibold text-muted sm:ml-auto">
            {text.date}
            <input
              type="date"
              value={anchorDate}
              onChange={(event) => setAnchorDate(event.target.value || getLocalIsoDate())}
              className="bg-transparent text-foreground outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setEnabledKinds(eventKinds)}
            className={[
              "soft-pill inline-flex min-h-[2.2rem] items-center rounded-full px-3 py-1 text-xs font-semibold transition",
              enabledKinds.length === eventKinds.length ? "text-foreground" : "opacity-55",
            ].join(" ")}
          >
            {text.all}
          </button>
          {eventKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setEnabledKinds((current) => toggleKind(current, kind))}
              className={filterClass(kind)}
            >
              <span className={`h-2 w-2 rounded-full ${kindStyles[kind]}`} />
              {text.filters[kind]}
            </button>
          ))}
        </div>
      </Surface>

      {mode === "feed" ? (
        <FeedView groupedEvents={groupedEvents} emptyText={text.empty} language={language} />
      ) : mode === "calendar" ? (
        <CalendarView
          days={calendarDays}
          hint={text.calendarHint}
          onSelectDate={(date) => {
            setAnchorDate(date);
            setPeriod("day");
            setMode("feed");
          }}
        />
      ) : (
        <ChartsView
          days={chartDays}
          text={{
            hint: text.chartsHint,
            sleepTotal: text.sleepTotal,
            feedingTotal: text.feedingTotal,
            illnessTotal: text.illnessTotal,
            measurements: text.measurements,
            noChartData: text.noChartData,
          }}
        />
      )}
    </div>
  );
}

function buildTimelineEvents({
  sleepSessions,
  feedingRecords,
  illnessEpisodes,
  weightEntries,
  heightEntries,
  language,
}: {
  sleepSessions: SleepSession[];
  feedingRecords: FeedingRecord[];
  illnessEpisodes: IllnessEpisode[];
  weightEntries: WeightEntry[];
  heightEntries: HeightEntry[];
  language: "ru" | "en";
}): TimelineEvent[] {
  const text = copy[language];
  const events: TimelineEvent[] = [];

  sleepSessions.forEach((session) => {
    events.push({
      id: `sleep-${session.id}`,
      kind: "sleep",
      at: session.startedAt,
      title: text.sleepStarted,
      detail: session.endedAt
        ? `${formatDateTime(session.startedAt)} → ${formatTime(session.endedAt)}`
        : text.activeStatus,
      value: formatDuration(session.durationMinutes, language),
    });
  });

  feedingRecords.forEach((record) => {
    const typeLabel = record.feedingType === "formula" ? text.formula : text.breast;
    const details = [
      formatDateTime(record.recordedAt || record.startedAt),
      typeLabel,
      record.formulaVolumeMl ? `${record.formulaVolumeMl} мл` : null,
      record.durationMinutes ? formatDuration(record.durationMinutes, language) : null,
    ].filter(Boolean);
    events.push({
      id: `feeding-${record.id}`,
      kind: "feeding",
      at: record.recordedAt || record.startedAt || record.endedAt || "",
      title: text.feedingRecorded,
      detail: details.join(" · "),
      value: record.formulaVolumeMl ? `${record.formulaVolumeMl} мл` : undefined,
    });
  });

  illnessEpisodes.forEach((episode) => {
    const episodeName = episode.title || text.illnessNoTitle;
    const durationValue = episode.closedAt
      ? formatIllnessDuration(episode.startedAt, episode.closedAt, language)
      : text.illnessOpenValue;
    events.push({
      id: `illness-start-${episode.id}`,
      kind: "illness",
      at: episode.startedAt,
      title: text.illnessObservation,
      detail: `${text.illnessStarted} · ${episodeName}`,
      value: episode.status === "active" ? text.illnessOpenValue : undefined,
    });
    if (episode.closedAt) {
      events.push({
        id: `illness-close-${episode.id}`,
        kind: "illness",
        at: episode.closedAt,
        title: text.illnessObservation,
        detail: `${text.illnessClosed} · ${episodeName}`,
        value: durationValue,
      });
    }
  });

  weightEntries.forEach((entry) => {
    events.push({
      id: `weight-${entry.id}`,
      kind: "weight",
      at: entry.measuredAt,
      title: text.weightMeasured,
      detail: formatDateTime(entry.measuredAt),
      value: `${formatNumber(entry.valueKg)} кг`,
    });
  });

  heightEntries.forEach((entry) => {
    events.push({
      id: `height-${entry.id}`,
      kind: "height",
      at: entry.measuredAt,
      title: text.heightMeasured,
      detail: formatDateTime(entry.measuredAt),
      value: `${formatNumber(entry.valueCm)} см`,
    });
  });

  return events.filter((event) => event.at);
}

function FeedView({
  groupedEvents,
  emptyText,
  language,
}: {
  groupedEvents: Array<{ date: string; events: TimelineEvent[] }>;
  emptyText: string;
  language: "ru" | "en";
}) {
  if (!groupedEvents.length) {
    return (
      <Surface className="p-5 sm:p-6">
        <p className="text-sm text-muted">{emptyText}</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-3">
      {groupedEvents.map((group) => (
        <Surface key={group.date} className="overflow-hidden p-0">
          <div className="border-b border-border/70 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-extrabold tracking-[-0.02em] text-foreground">
                {formatDate(group.date)}
              </p>
              <p className="text-xs font-semibold text-muted">
                {buildDaySummary(group.events, language)}
              </p>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {group.events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[3.2rem_minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:px-5"
              >
                <span className="text-xs font-semibold tabular-nums text-muted">
                  {formatTime(event.at)}
                </span>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${kindStyles[event.kind]}`} />
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">
                      {event.title}
                    </p>
                  </div>
                  {event.detail ? (
                    <p className="mt-0.5 truncate text-xs leading-5 text-muted">{event.detail}</p>
                  ) : null}
                </div>
                {event.value ? (
                  <span className="shrink-0 text-sm font-extrabold tracking-[-0.02em] text-foreground">
                    {event.value}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </Surface>
      ))}
    </div>
  );
}

function CalendarView({
  days,
  hint,
  onSelectDate,
}: {
  days: CalendarDay[];
  hint: string;
  onSelectDate: (date: string) => void;
}) {
  return (
    <Surface className="p-4 sm:p-5">
      <p className="mb-4 text-sm leading-6 text-muted">{hint}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={[
              "min-h-[3.15rem] rounded-[18px] border px-1.5 py-2 text-left transition hover:border-primary/35",
              day.inMonth
                ? "border-border bg-surface-muted text-foreground"
                : "border-transparent bg-transparent text-muted/45",
            ].join(" ")}
          >
            <span className="text-xs font-semibold">{Number(day.date.slice(8, 10))}</span>
            <span className="mt-2 flex flex-wrap gap-1">
              {day.kinds.map((kind) => (
                <span key={kind} className={`h-1.5 w-1.5 rounded-full ${kindStyles[kind]}`} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </Surface>
  );
}

function ChartsView({
  days,
  text,
}: {
  days: ChartDay[];
  text: {
    hint: string;
    sleepTotal: string;
    feedingTotal: string;
    illnessTotal: string;
    measurements: string;
    noChartData: string;
  };
}) {
  const maxSleep = Math.max(...days.map((day) => day.sleepMinutes), 0);
  const maxFeeding = Math.max(...days.map((day) => day.feedingCount), 0);
  const maxIllness = Math.max(...days.map((day) => day.illnessCount), 0);
  const measurementDays = days.filter((day) => day.weightValue || day.heightValue);

  return (
    <Surface className="space-y-5 p-4 sm:p-5">
      <p className="text-sm leading-6 text-muted">{text.hint}</p>
      <MiniBarChart
        title={text.sleepTotal}
        days={days}
        getValue={(day) => day.sleepMinutes}
        maxValue={maxSleep}
        tone="bg-sky-500"
        emptyText={text.noChartData}
      />
      <MiniBarChart
        title={text.feedingTotal}
        days={days}
        getValue={(day) => day.feedingCount}
        maxValue={maxFeeding}
        tone="bg-amber-500"
        emptyText={text.noChartData}
      />
      <MiniBarChart
        title={text.illnessTotal}
        days={days}
        getValue={(day) => day.illnessCount}
        maxValue={maxIllness}
        tone="bg-rose-500"
        emptyText={text.noChartData}
      />
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">{text.measurements}</p>
        {measurementDays.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {measurementDays.slice(-6).map((day) => (
              <div key={day.date} className="soft-panel-muted rounded-[18px] px-3 py-2.5 text-sm">
                <p className="font-semibold text-foreground">{formatDate(day.date)}</p>
                <p className="mt-1 text-muted">
                  {[
                    day.weightValue ? `${formatNumber(day.weightValue)} кг` : null,
                    day.heightValue ? `${formatNumber(day.heightValue)} см` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{text.noChartData}</p>
        )}
      </div>
    </Surface>
  );
}

function MiniBarChart({
  title,
  days,
  getValue,
  maxValue,
  tone,
  emptyText,
}: {
  title: string;
  days: ChartDay[];
  getValue: (day: ChartDay) => number;
  maxValue: number;
  tone: string;
  emptyText: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      {maxValue > 0 ? (
        <div className="flex h-28 items-end gap-1.5 rounded-[22px] bg-surface-muted px-3 py-3">
          {days.map((day) => {
            const value = getValue(day);
            const height = Math.max(8, Math.round((value / maxValue) * 82));
            return (
              <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-full ${tone}`}
                  style={{ height: value > 0 ? `${height}px` : "4px", opacity: value > 0 ? 1 : 0.25 }}
                  title={`${formatDate(day.date)}: ${value}`}
                />
                <span className="hidden text-[0.62rem] text-muted sm:block">
                  {Number(day.date.slice(8, 10))}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">{emptyText}</p>
      )}
    </div>
  );
}

function buildSummary(
  events: TimelineEvent[],
  sleepSessions: SleepSession[],
  feedingRecords: FeedingRecord[],
  illnessEpisodes: IllnessEpisode[],
  text: (typeof copy)["ru" | "en"],
  language: "ru" | "en"
): SummaryItem[] {
  const sleepIds = new Set(events.filter((event) => event.kind === "sleep").map((event) => event.id));
  const feedingIds = new Set(
    events.filter((event) => event.kind === "feeding").map((event) => event.id)
  );
  const illnessEvents = events.filter((event) => event.kind === "illness");
  const periodDays = getUniqueDayCount(events);
  const totalSleepMinutes = sleepSessions
    .filter((session) => sleepIds.has(`sleep-${session.id}`))
    .reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const feedings = feedingRecords.filter((record) => feedingIds.has(`feeding-${record.id}`));
  const activeIllnesses = illnessEpisodes.filter((episode) =>
    illnessEvents.some((event) => event.id.includes(episode.id)) && episode.status === "active"
  ).length;
  const illnessCount = new Set(
    illnessEvents
      .map((event) => event.id.replace("illness-start-", "").replace("illness-close-", ""))
      .filter(Boolean)
  ).size;
  const averageSleepMinutes = Math.round(totalSleepMinutes / periodDays);
  const averageFeedings = feedings.length / periodDays;
  const averageFormulaMl = Math.round(
    feedings.reduce((sum, item) => sum + (item.formulaVolumeMl ?? 0), 0) / periodDays
  );
  const weightStats = buildMetricStats(events, "weight", text.summary.noData, text.summary.latest);
  const heightStats = buildMetricStats(events, "height", text.summary.noData, text.summary.latest);

  return [
    {
      kind: "sleep",
      label: text.summary.sleep,
      value: totalSleepMinutes
        ? `${formatDuration(averageSleepMinutes, language)}/${text.summary.perDay}`
        : text.summary.noData,
      hint: `${sleepIds.size} ${text.summary.episodes}`,
    },
    {
      kind: "feeding",
      label: text.summary.feeding,
      value: feedings.length
        ? `${formatAverageCount(averageFeedings)}/${text.summary.perDay}`
        : text.summary.noData,
      hint: averageFormulaMl ? `${averageFormulaMl} мл/${text.summary.perDay}` : `${feedings.length} ${text.summary.records}`,
    },
    {
      kind: "height",
      label: text.summary.height,
      value: heightStats.value,
      hint: heightStats.hint,
    },
    {
      kind: "weight",
      label: text.summary.weight,
      value: weightStats.value,
      hint: weightStats.hint,
    },
    {
      kind: "events",
      label: text.summary.events,
      value: String(events.length),
      hint: text.summary.records,
    },
    {
      kind: "illness",
      label: text.summary.illness,
      value: illnessCount ? String(illnessCount) : text.summary.none,
      hint: activeIllnesses ? `${activeIllnesses} ${text.summary.active}` : text.summary.calm,
    },
  ];
}

interface CalendarDay {
  date: string;
  inMonth: boolean;
  kinds: EventKind[];
}

function buildCalendarDays(anchorDate: string, events: TimelineEvent[], enabledKinds: EventKind[]) {
  const anchor = parseLocalDate(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = getLocalIsoDate(date);
    const kinds = uniqueKinds(
      events
        .filter((event) => enabledKinds.includes(event.kind))
        .filter((event) => event.at.slice(0, 10) === isoDate)
        .map((event) => event.kind)
    );
    return {
      date: isoDate,
      inMonth: date.getMonth() === month,
      kinds,
    };
  });
}

interface ChartDay {
  date: string;
  sleepMinutes: number;
  feedingCount: number;
  illnessCount: number;
  weightValue: number | null;
  heightValue: number | null;
}

function buildChartDays(start: Date, end: Date, events: TimelineEvent[]): ChartDay[] {
  const days: ChartDay[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = getLocalIsoDate(cursor);
    const dayEvents = events.filter((event) => event.at.slice(0, 10) === date);
    days.push({
      date,
      sleepMinutes: sumEventDurations(dayEvents.filter((event) => event.kind === "sleep")),
      feedingCount: dayEvents.filter((event) => event.kind === "feeding").length,
      illnessCount: dayEvents.filter((event) => event.kind === "illness").length,
      weightValue: parseMetricValue(dayEvents.find((event) => event.kind === "weight")?.value),
      heightValue: parseMetricValue(dayEvents.find((event) => event.kind === "height")?.value),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function buildDateRange(anchorDate: string, period: PeriodKey) {
  const end = parseLocalDate(anchorDate);
  end.setHours(23, 59, 59, 999);
  const start = parseLocalDate(anchorDate);
  const daysBack = period === "day" ? 0 : period === "week" ? 6 : 29;
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function groupEventsByDay(events: TimelineEvent[]) {
  const groups = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const key = event.at.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });
  return Array.from(groups.entries()).map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

function buildDaySummary(events: TimelineEvent[], language: "ru" | "en") {
  const labels =
    language === "ru"
      ? { sleep: "Сон", feeding: "Кормление", illness: "Болезни", measurements: "Замеры" }
      : { sleep: "Sleep", feeding: "Feeding", illness: "Illness", measurements: "Measures" };
  const chunks = [
    [labels.sleep, events.filter((event) => event.kind === "sleep").length],
    [labels.feeding, events.filter((event) => event.kind === "feeding").length],
    [labels.illness, events.filter((event) => event.kind === "illness").length],
    [
      labels.measurements,
      events.filter((event) => event.kind === "weight" || event.kind === "height").length,
    ],
  ]
    .filter(([, count]) => Number(count) > 0)
    .map(([label, count]) => `${label} ${count}`);
  return chunks.length ? chunks.join(" · ") : `${events.length}`;
}

function getUniqueDayCount(events: TimelineEvent[]) {
  const dayCount = new Set(events.map((event) => event.at.slice(0, 10))).size;
  return Math.max(1, dayCount);
}

function formatAverageCount(value: number) {
  if (value >= 10 || Number.isInteger(value)) {
    return String(Math.round(value));
  }
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

function buildMetricStats(
  events: TimelineEvent[],
  kind: "weight" | "height",
  emptyValue: string,
  fallbackHint: string
) {
  const entries = events
    .filter((event) => event.kind === kind)
    .map((event) => ({
      at: event.at,
      value: event.value ?? "",
      numericValue: parseMetricValue(event.value),
    }))
    .filter((entry) => entry.value)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const latest = entries[0];
  const previous = entries.find((entry) => entry.numericValue !== null && entry.at !== latest?.at);
  if (!latest) {
    return { value: emptyValue, hint: fallbackHint };
  }
  if (latest.numericValue === null || previous?.numericValue === null || !previous) {
    return { value: latest.value, hint: fallbackHint };
  }
  const delta = latest.numericValue - previous.numericValue;
  if (Math.abs(delta) < 0.05) {
    return { value: latest.value, hint: fallbackHint };
  }
  const unit = latest.value.includes("кг") ? "кг" : latest.value.includes("см") ? "см" : "";
  const sign = delta > 0 ? "+" : "";
  return { value: latest.value, hint: `${sign}${formatNumber(delta)} ${unit}`.trim() };
}

function toggleKind(current: EventKind[], kind: EventKind): EventKind[] {
  if (current.includes(kind)) {
    const next = current.filter((item) => item !== kind);
    return next.length ? next : eventKinds;
  }
  return [...current, kind];
}

function isDateInRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
}

function parseLocalDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function formatTime(value: string) {
  return value.slice(11, 16);
}

function formatDuration(minutes: number | null | undefined, language: "ru" | "en") {
  if (!minutes || minutes <= 0) {
    return language === "ru" ? "0 мин" : "0 min";
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) {
    return language === "ru" ? `${rest} мин` : `${rest} min`;
  }
  return language === "ru" ? `${hours} ч ${rest} мин` : `${hours} h ${rest} min`;
}

function formatIllnessDuration(startedAt: string, closedAt: string, language: "ru" | "en") {
  const started = new Date(startedAt).getTime();
  const closed = new Date(closedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(closed) || closed <= started) {
    return language === "ru" ? "1 день" : "1 day";
  }
  const days = Math.max(1, Math.ceil((closed - started) / (24 * 60 * 60 * 1000)));
  if (language === "ru") {
    return `${days} ${getRussianDayWord(days)}`;
  }
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function getRussianDayWord(days: number) {
  const lastTwo = days % 100;
  const last = days % 10;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return "дней";
  }
  if (last === 1) {
    return "день";
  }
  if (last >= 2 && last <= 4) {
    return "дня";
  }
  return "дней";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

function uniqueKinds(kinds: EventKind[]) {
  return eventKinds.filter((kind) => kinds.includes(kind));
}

function sumEventDurations(events: TimelineEvent[]) {
  return events.reduce((sum, event) => {
    const match = event.value?.match(/(\d+)\s*ч\s*(\d+)?|(\d+)\s*h\s*(\d+)?|(\d+)\s*мин|(\d+)\s*min/);
    if (!match) return sum;
    if (match[1]) return sum + Number(match[1]) * 60 + Number(match[2] ?? 0);
    if (match[3]) return sum + Number(match[3]) * 60 + Number(match[4] ?? 0);
    return sum + Number(match[5] ?? match[6] ?? 0);
  }, 0);
}

function parseMetricValue(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
