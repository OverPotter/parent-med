import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
type PeriodKey = "day" | "week" | "twoWeeks" | "month" | "custom";
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
const periodOptions: PeriodKey[] = ["day", "week", "twoWeeks", "month", "custom"];

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
    today: "Сегодня",
    week: "7 дней",
    twoWeeks: "14 дней",
    month: "30 дней",
    date: "Дата",
    customPeriod: "Свой период",
    editCustomPeriod: "Изменить",
    dateFrom: "Начало",
    dateTo: "Конец",
    customPeriodTitle: "Свой период",
    customPeriodHint: "Выберите даты, за которые нужно показать ленту, календарь и графики.",
    apply: "Применить",
    cancel: "Отмена",
    closePeriodDialog: "Закрыть выбор периода",
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
      formulaAverage: "Смесь",
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
    calendarHint: "Точки показывают типы событий в дне. Нажмите на день, чтобы открыть ленту дня.",
    dayFeedTitle: "Лента дня",
    backToCalendar: "Назад к календарю",
    dayFeedEmpty: "В этот день событий по выбранным фильтрам нет.",
    chartsHint:
      "Быстрые графики по выбранному периоду. Детальную аналитику добавим следующим этапом.",
    sleepTotal: "Сон за период",
    feedingTotal: "Кормлений",
    feedingFormulaTotal: "Смесь за период",
    illnessTotal: "Болезней",
    measurements: "Замеры",
    chartAverage: "среднее",
    chartTotal: "всего",
    chartDays: "дней с данными",
    chartSleepHint: "Сколько в среднем малыш спит по дням.",
    chartFeedingHint: "Частота кормлений и объем смеси по дням.",
    chartIllnessHint: "Дни, где были события по наблюдениям.",
    chartMeasurementsHint: "Последние замеры за выбранный период.",
    noChartData: "Для этого нет данных.",
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
    today: "Today",
    week: "7 days",
    twoWeeks: "14 days",
    month: "30 days",
    date: "Date",
    customPeriod: "Custom period",
    editCustomPeriod: "Edit",
    dateFrom: "Start",
    dateTo: "End",
    customPeriodTitle: "Custom period",
    customPeriodHint: "Choose the dates for the feed, calendar and charts.",
    apply: "Apply",
    cancel: "Cancel",
    closePeriodDialog: "Close period picker",
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
      formulaAverage: "Formula",
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
    calendarHint: "Dots show event types for each day. Tap a day to open that day's feed.",
    dayFeedTitle: "Day feed",
    backToCalendar: "Back to calendar",
    dayFeedEmpty: "No events for the selected filters on this day.",
    chartsHint: "Quick charts for the selected period. Detailed analytics can be added next.",
    sleepTotal: "Sleep in period",
    feedingTotal: "Feedings",
    feedingFormulaTotal: "Formula in period",
    illnessTotal: "Illnesses",
    measurements: "Measurements",
    chartAverage: "average",
    chartTotal: "total",
    chartDays: "days with data",
    chartSleepHint: "How much the child sleeps by day on average.",
    chartFeedingHint: "Feeding frequency and formula volume by day.",
    chartIllnessHint: "Days with observation events.",
    chartMeasurementsHint: "Latest measurements in the selected period.",
    noChartData: "No data for this yet.",
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
  const [customStartDate, setCustomStartDate] = useState(() => getShiftedLocalIsoDate(-6));
  const [customEndDate, setCustomEndDate] = useState(getLocalIsoDate());
  const [draftCustomStartDate, setDraftCustomStartDate] = useState(customStartDate);
  const [draftCustomEndDate, setDraftCustomEndDate] = useState(customEndDate);
  const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [calendarFeedDate, setCalendarFeedDate] = useState<string | null>(null);
  const calendarFeedHistoryRef = useRef(false);
  const periodMenuRef = useRef<HTMLDivElement | null>(null);
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

  const dateRange = useMemo(
    () => buildDateRange(anchorDate, period, customStartDate, customEndDate),
    [anchorDate, customEndDate, customStartDate, period]
  );
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
  const periodEvents = useMemo(
    () =>
      allEvents
        .filter((event) => isDateInRange(event.at, dateRange.start, dateRange.end))
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [allEvents, dateRange.end, dateRange.start]
  );
  const groupedEvents = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents]);
  const calendarFeedEvents = useMemo(() => {
    if (!calendarFeedDate) return [];
    return allEvents
      .filter((event) => enabledKinds.includes(event.kind))
      .filter((event) => event.at.slice(0, 10) === calendarFeedDate)
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [allEvents, calendarFeedDate, enabledKinds]);
  const summary = useMemo(
    () =>
      buildSummary(periodEvents, sleepSessions, feedingRecords, illnessEpisodes, text, language),
    [feedingRecords, illnessEpisodes, language, periodEvents, sleepSessions, text]
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(anchorDate, allEvents, enabledKinds),
    [allEvents, anchorDate, enabledKinds]
  );
  const chartDays = useMemo(
    () => buildChartDays(dateRange.start, dateRange.end, visibleEvents),
    [dateRange.end, dateRange.start, visibleEvents]
  );
  const accountLabel = accountDisplayName || accountLogin || sharedCopy.common.userFallback;

  useEffect(() => {
    if (!isPeriodMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !periodMenuRef.current?.contains(target)) {
        setIsPeriodMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPeriodMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPeriodMenuOpen]);

  useEffect(() => {
    if (!calendarFeedDate || calendarFeedHistoryRef.current) return;

    window.history.pushState({ calendarFeedDate }, "", window.location.href);
    calendarFeedHistoryRef.current = true;
  }, [calendarFeedDate]);

  useEffect(() => {
    if (!calendarFeedDate) return;

    const handlePopState = () => {
      setCalendarFeedDate(null);
      calendarFeedHistoryRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [calendarFeedDate]);

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
  const periodLabel = getPeriodLabel(period, dateRange, text, language);
  const filterClass = (kind: EventKind) =>
    [
      "soft-pill inline-flex min-h-[2.2rem] items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
      enabledKinds.includes(kind) ? "text-foreground" : "opacity-45",
    ].join(" ");
  const openCustomPeriodDialog = () => {
    setDraftCustomStartDate(customStartDate);
    setDraftCustomEndDate(customEndDate);
    setIsCustomPeriodOpen(true);
  };
  const applyCustomPeriod = () => {
    setCustomStartDate(draftCustomStartDate || getLocalIsoDate());
    setCustomEndDate(draftCustomEndDate || getLocalIsoDate());
    setPeriod("custom");
    setIsCustomPeriodOpen(false);
  };
  const handlePeriodChange = (value: PeriodKey) => {
    setIsPeriodMenuOpen(false);
    if (value === "custom") {
      openCustomPeriodDialog();
      return;
    }
    setPeriod(value);
    setAnchorDate(getLocalIsoDate());
  };

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
    <div className="child-overview-page min-w-0 space-y-4 sm:space-y-5">
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
                {item.label}:{" "}
                <span className="text-[0.68rem] font-semibold tracking-[-0.015em] text-muted">
                  {item.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="relative z-30 space-y-3 overflow-visible p-3 sm:p-4">
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

        <div className="grid gap-2 sm:grid-cols-[max-content_auto] sm:items-start">
          <div ref={periodMenuRef} className="relative z-50 min-w-[10.5rem]">
            <button
              type="button"
              onClick={() => setIsPeriodMenuOpen((current) => !current)}
              className="soft-pill app-profile-action app-profile-action--split min-h-[2.45rem] w-full gap-2 rounded-[18px] text-left text-xs font-extrabold"
              aria-haspopup="listbox"
              aria-expanded={isPeriodMenuOpen}
            >
              <span className="min-w-0 truncate">{periodLabel}</span>
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
              >
                ▾
              </span>
            </button>
            {isPeriodMenuOpen ? (
              <div
                role="listbox"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-border bg-background p-2 shadow-[0_24px_64px_rgba(15,23,42,0.28)]"
              >
                {periodOptions.map((option) => {
                  const isActive = option === period;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handlePeriodChange(option)}
                      className={[
                        "flex min-h-[2.45rem] w-full items-center justify-between rounded-[17px] px-3 text-left text-sm font-extrabold tracking-[-0.02em] transition",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                          : "bg-surface text-foreground hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      <span>{getPeriodOptionLabel(option, text)}</span>
                      {isActive ? <span aria-hidden="true">✓</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {period === "custom" ? (
            <button
              type="button"
              onClick={openCustomPeriodDialog}
              className="soft-pill app-profile-action min-h-[2.45rem] rounded-[18px] px-4 text-xs font-extrabold"
            >
              {text.editCustomPeriod}
            </button>
          ) : null}
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
          monthTitle={formatMonthTitle(parseLocalDate(anchorDate), language)}
          weekdayLabels={getWeekdayLabels(language)}
          visibleKinds={enabledKinds}
          filterLabels={text.filters}
          onSelectDate={setCalendarFeedDate}
        />
      ) : (
        <ChartsView
          days={chartDays}
          visibleKinds={enabledKinds}
          language={language}
          text={{
            hint: text.chartsHint,
            sleepTotal: text.sleepTotal,
            feedingTotal: text.feedingTotal,
            feedingFormulaTotal: text.feedingFormulaTotal,
            illnessTotal: text.illnessTotal,
            measurements: text.measurements,
            average: text.chartAverage,
            total: text.chartTotal,
            daysWithData: text.chartDays,
            sleepHint: text.chartSleepHint,
            feedingHint: text.chartFeedingHint,
            illnessHint: text.chartIllnessHint,
            measurementsHint: text.chartMeasurementsHint,
            noChartData: text.noChartData,
          }}
        />
      )}

      <CustomPeriodDialog
        isOpen={isCustomPeriodOpen}
        text={text}
        language={language}
        startDate={draftCustomStartDate}
        endDate={draftCustomEndDate}
        onStartDateChange={setDraftCustomStartDate}
        onEndDateChange={setDraftCustomEndDate}
        onApply={applyCustomPeriod}
        onCancel={() => setIsCustomPeriodOpen(false)}
      />
      <DayFeedDialog
        isOpen={Boolean(calendarFeedDate)}
        date={calendarFeedDate}
        events={calendarFeedEvents}
        title={text.dayFeedTitle}
        backLabel={text.backToCalendar}
        emptyText={text.dayFeedEmpty}
        language={language}
        onClose={() => {
          if (calendarFeedHistoryRef.current) {
            window.history.back();
            return;
          }
          setCalendarFeedDate(null);
        }}
      />
    </div>
  );
}

function CustomPeriodDialog({
  isOpen,
  text,
  language,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onCancel,
}: {
  isOpen: boolean;
  text: (typeof copy)["ru" | "en"];
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const [calendarEdge, setCalendarEdge] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setCalendarEdge(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const selectDate = (date: string) => {
    if (calendarEdge === "start") {
      onStartDateChange(date);
      if (parseLocalDate(date) > parseLocalDate(endDate)) {
        onEndDateChange(date);
      }
      setCalendarEdge(null);
      return;
    }

    onEndDateChange(date);
    if (parseLocalDate(date) < parseLocalDate(startDate)) {
      onStartDateChange(date);
    }
    setCalendarEdge(null);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-background p-4 sm:p-6">
      <button
        type="button"
        aria-label={text.closePeriodDialog}
        onClick={onCancel}
        className="absolute inset-0 bg-background"
      />
      <div className="soft-panel relative z-10 w-full max-w-md rounded-[30px] border border-border bg-surface p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-5">
        <div className="mb-4 h-1.5 w-14 rounded-full bg-primary/55" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
            {text.summaryPeriodPrefix}
          </p>
          <h2 className="app-card-title text-[1.15rem]">{text.customPeriodTitle}</h2>
          <p className="text-sm leading-5 text-muted">{text.customPeriodHint}</p>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => setCalendarEdge("start")}
            className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[22px] border border-border bg-surface-muted px-3.5 py-2.5 text-left text-foreground transition hover:border-primary/30"
          >
            <span className="min-w-0">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.08em] opacity-70">
                {text.dateFrom}
              </span>
              <span className="mt-1 block text-sm font-extrabold">
                {formatShortDate(parseLocalDate(startDate), language)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/80 text-muted shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
            >
              ▾
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCalendarEdge("end")}
            className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[22px] border border-border bg-surface-muted px-3.5 py-2.5 text-left text-foreground transition hover:border-primary/30"
          >
            <span className="min-w-0">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.08em] opacity-70">
                {text.dateTo}
              </span>
              <span className="mt-1 block text-sm font-extrabold">
                {formatShortDate(parseLocalDate(endDate), language)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/80 text-muted shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
            >
              ▾
            </span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="soft-pill app-profile-action min-h-[2.9rem] px-4 text-sm font-extrabold"
          >
            {text.cancel}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="soft-pill-warning app-profile-action app-profile-action--active min-h-[2.9rem] px-4 text-sm font-extrabold"
          >
            {text.apply}
          </button>
        </div>
      </div>

      <CalendarPickerDialog
        isOpen={calendarEdge !== null}
        title={calendarEdge === "start" ? text.dateFrom : text.dateTo}
        language={language}
        startDate={startDate}
        endDate={endDate}
        selectedDate={calendarEdge === "start" ? startDate : endDate}
        onSelectDate={selectDate}
        onCancel={() => setCalendarEdge(null)}
      />
    </div>
  );
}

function CalendarPickerDialog({
  isOpen,
  title,
  language,
  startDate,
  endDate,
  selectedDate,
  onSelectDate,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  language: "ru" | "en";
  startDate: string;
  endDate: string;
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onCancel: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => parseLocalDate(selectedDate || getLocalIsoDate()));
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const calendarDays = useMemo(() => buildPlainCalendarDays(viewDate), [viewDate]);
  const normalizedRange = useMemo(
    () => buildDateRange(startDate, "custom", startDate, endDate),
    [endDate, startDate]
  );

  useEffect(() => {
    if (!isOpen) return;

    setViewDate(parseLocalDate(selectedDate || getLocalIsoDate()));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, selectedDate]);

  if (!isOpen) return null;

  const shiftViewMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    shiftViewMonth(deltaX < 0 ? 1 : -1);
  };
  const yearOptions = buildCalendarYearOptions(viewDate);

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-background p-4 sm:p-6">
      <button
        type="button"
        aria-label={language === "ru" ? "Закрыть календарь" : "Close calendar"}
        onClick={onCancel}
        className="absolute inset-0 bg-background"
      />
      <div className="soft-panel relative z-10 w-full max-w-sm rounded-[30px] border border-border bg-surface p-4 shadow-[0_32px_90px_rgba(15,23,42,0.24)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              {language === "ru" ? "Выбор даты" : "Date picker"}
            </p>
            <h3 className="app-card-title mt-1 truncate text-[1.05rem]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="app-header-icon-button h-9 min-h-0 w-9 shrink-0 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="rounded-[26px] border border-border bg-surface-muted p-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]">
          <div className="grid grid-cols-[2.35rem_minmax(0,1fr)_2.35rem] items-center gap-2 rounded-[20px] bg-surface p-1.5">
            <button
              type="button"
              onClick={() => shiftViewMonth(-1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
            >
              ←
            </button>
            <p className="app-card-title min-w-0 truncate text-center text-[0.95rem]">
              {formatMonthTitle(viewDate, language)}
            </p>
            <button
              type="button"
              onClick={() => shiftViewMonth(1)}
              className="app-header-icon-button h-9 min-h-0 w-9 text-sm"
            >
              →
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_6.6rem] gap-2">
            <label className="relative block">
              <span className="sr-only">{language === "ru" ? "Месяц" : "Month"}</span>
              <select
                value={viewDate.getMonth()}
                onChange={(event) =>
                  setViewDate(new Date(viewDate.getFullYear(), Number(event.target.value), 1))
                }
                className="soft-input min-h-[2.35rem] w-full appearance-none rounded-[16px] px-3 pr-8 text-[0.82rem] font-bold"
              >
                {getMonthLabels(language).map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </label>
            <label className="relative block">
              <span className="sr-only">{language === "ru" ? "Год" : "Year"}</span>
              <select
                value={viewDate.getFullYear()}
                onChange={(event) =>
                  setViewDate(new Date(Number(event.target.value), viewDate.getMonth(), 1))
                }
                className="soft-input min-h-[2.35rem] w-full appearance-none rounded-[16px] px-3 pr-7 text-[0.82rem] font-bold"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                ▾
              </span>
            </label>
          </div>

          <div
            className="touch-pan-y select-none px-1 pb-1 pt-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-muted">
              {getWeekdayLabels(language).map((label) => (
                <div key={label} className="py-0.5">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const date = parseLocalDate(day.date);
                const isSelected =
                  day.date === startDate ||
                  day.date === endDate ||
                  isDateInsideRange(date, normalizedRange);
                const isEdge = day.date === startDate || day.date === endDate;
                const isToday = day.date === getLocalIsoDate();

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDate(day.date)}
                    className={[
                      "flex h-8 items-center justify-center rounded-[1rem] text-[0.82rem] font-bold transition",
                      isEdge
                        ? "bg-primary text-primary-foreground shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
                        : isSelected
                          ? "bg-primary/12 text-foreground"
                          : day.inMonth
                            ? "bg-surface text-foreground"
                            : "bg-surface text-muted opacity-45",
                      isToday && !isEdge ? "ring-1 ring-primary/25" : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
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

function DayFeedDialog({
  isOpen,
  date,
  events,
  title,
  backLabel,
  emptyText,
  language,
  onClose,
}: {
  isOpen: boolean;
  date: string | null;
  events: TimelineEvent[];
  title: string;
  backLabel: string;
  emptyText: string;
  language: "ru" | "en";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !date) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "max(0.75rem, var(--app-safe-top))",
        paddingBottom: "var(--app-safe-bottom)",
      }}
    >
      <div className="shrink-0 border-b border-border/70 bg-background px-4 pb-3 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[2.25rem] items-center text-sm font-extrabold text-primary"
          >
            ← {backLabel}
          </button>
          <div className="mt-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              {title}
            </p>
            <h3 className="app-card-title mt-1 text-[1.25rem]">{formatDate(date)}</h3>
            {events.length ? (
              <p className="mt-1 text-xs font-semibold leading-5 text-muted">
                {buildDaySummary(events, language)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-4 py-3 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {events.length ? (
            <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div className="divide-y divide-border/60">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[3.2rem_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:px-5"
                  >
                    <span className="text-xs font-semibold tabular-nums text-muted">
                      {formatTime(event.at)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${kindStyles[event.kind]}`}
                        />
                        <p className="truncate text-sm font-semibold leading-5 text-foreground">
                          {event.title}
                        </p>
                      </div>
                      {event.detail ? (
                        <p className="mt-0.5 truncate text-xs leading-5 text-muted">
                          {event.detail}
                        </p>
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
            </div>
          ) : (
            <div className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <p className="text-sm leading-6 text-muted">{emptyText}</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CalendarView({
  days,
  hint,
  monthTitle,
  weekdayLabels,
  visibleKinds,
  filterLabels,
  onSelectDate,
}: {
  days: CalendarDay[];
  hint: string;
  monthTitle: string;
  weekdayLabels: string[];
  visibleKinds: EventKind[];
  filterLabels: Record<EventKind, string>;
  onSelectDate: (date: string) => void;
}) {
  return (
    <Surface className="space-y-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="app-card-title text-[1.05rem] capitalize">{monthTitle}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{hint}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {uniqueKinds(visibleKinds).map((kind) => (
          <span
            key={kind}
            className="inline-flex min-h-[1.65rem] items-center gap-1.5 rounded-full bg-surface-muted px-2.5 text-[0.7rem] font-bold text-muted"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${kindStyles[kind]}`} />
            {filterLabels[kind]}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-extrabold uppercase tracking-[0.04em] text-muted">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
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
  visibleKinds,
  language,
  text,
}: {
  days: ChartDay[];
  visibleKinds: EventKind[];
  language: "ru" | "en";
  text: {
    hint: string;
    sleepTotal: string;
    feedingTotal: string;
    feedingFormulaTotal: string;
    illnessTotal: string;
    measurements: string;
    average: string;
    total: string;
    daysWithData: string;
    sleepHint: string;
    feedingHint: string;
    illnessHint: string;
    measurementsHint: string;
    noChartData: string;
  };
}) {
  const maxSleep = Math.max(...days.map((day) => day.sleepMinutes), 0);
  const maxFeeding = Math.max(...days.map((day) => day.feedingCount), 0);
  const maxFormula = Math.max(...days.map((day) => day.feedingMl), 0);
  const showSleep = visibleKinds.includes("sleep");
  const showFeeding = visibleKinds.includes("feeding");
  const showIllness = visibleKinds.includes("illness");
  const showMeasurements = visibleKinds.includes("weight") || visibleKinds.includes("height");
  const measurementDays = days.filter(
    (day) =>
      (visibleKinds.includes("weight") && day.weightValue) ||
      (visibleKinds.includes("height") && day.heightValue)
  );
  const totalSleep = days.reduce((sum, day) => sum + day.sleepMinutes, 0);
  const sleepDays = days.filter((day) => day.sleepMinutes > 0).length;
  const totalFeedings = days.reduce((sum, day) => sum + day.feedingCount, 0);
  const totalFormula = days.reduce((sum, day) => sum + day.feedingMl, 0);
  const feedingDays = days.filter((day) => day.feedingCount > 0 || day.feedingMl > 0).length;
  const illnessDays = days.filter((day) => day.illnessCount > 0).length;
  const illnessEvents = days.reduce((sum, day) => sum + day.illnessCount, 0);
  const visibleSections = [showSleep, showFeeding, showIllness, showMeasurements].filter(
    Boolean
  ).length;

  return (
    <Surface className="p-4 sm:p-5">
      <p className="text-sm leading-6 text-muted">{text.hint}</p>
      <div className="mt-4 divide-y divide-border/70">
        {visibleSections === 0 ? <EmptyChartMessage text={text.noChartData} /> : null}
        {showSleep ? (
          <MiniBarChart
            title={text.sleepTotal}
            subtitle={text.sleepHint}
            stats={[
              {
                label: text.average,
                value: sleepDays
                  ? formatDuration(Math.round(totalSleep / sleepDays), language)
                  : "—",
              },
              { label: text.total, value: formatDuration(totalSleep, language) },
            ]}
            days={days}
            getValue={(day) => day.sleepMinutes}
            formatValue={(value) => formatDuration(value, language)}
            maxValue={maxSleep}
            tone="bg-sky-500"
            emptyText={text.noChartData}
          />
        ) : null}
        {showFeeding ? (
          <>
            <MiniBarChart
              title={text.feedingFormulaTotal}
              subtitle={text.feedingHint}
              stats={[
                { label: text.total, value: `${totalFormula} мл` },
                {
                  label: text.average,
                  value: feedingDays ? `${Math.round(totalFormula / feedingDays)} мл` : "—",
                },
              ]}
              days={days}
              getValue={(day) => day.feedingMl}
              formatValue={(value) => `${value} мл`}
              maxValue={maxFormula}
              tone="bg-teal-500"
              emptyText={text.noChartData}
            />
            <MiniBarChart
              title={text.feedingTotal}
              subtitle={`${text.daysWithData}: ${feedingDays}`}
              stats={[
                { label: text.total, value: String(totalFeedings) },
                {
                  label: text.average,
                  value: feedingDays ? formatAverageCount(totalFeedings / feedingDays) : "0",
                },
              ]}
              days={days}
              getValue={(day) => day.feedingCount}
              formatValue={(value) => String(value)}
              maxValue={maxFeeding}
              tone="bg-cyan-500"
              emptyText={text.noChartData}
            />
          </>
        ) : null}
        {showIllness ? (
          <IllnessTimelineChart
            title={text.illnessTotal}
            subtitle={text.illnessHint}
            stats={[
              { label: text.daysWithData, value: String(illnessDays) },
              { label: text.total, value: String(illnessEvents) },
            ]}
            days={days}
            emptyText={text.noChartData}
          />
        ) : null}
        {showMeasurements ? (
          <>
            {measurementDays.length ? (
              <>
                {visibleKinds.includes("weight") ? (
                  <MetricLineChart
                    title={language === "ru" ? "Вес" : "Weight"}
                    subtitle={text.measurementsHint}
                    days={days}
                    getValue={(day) => day.weightValue}
                    unit={language === "ru" ? "кг" : "kg"}
                    tone="#10b981"
                    emptyText={text.noChartData}
                  />
                ) : null}
                {visibleKinds.includes("height") ? (
                  <MetricLineChart
                    title={language === "ru" ? "Рост" : "Height"}
                    subtitle={text.measurementsHint}
                    days={days}
                    getValue={(day) => day.heightValue}
                    unit={language === "ru" ? "см" : "cm"}
                    tone="#84cc16"
                    emptyText={text.noChartData}
                  />
                ) : null}
              </>
            ) : (
              <EmptyChartMessage text={text.noChartData} />
            )}
          </>
        ) : null}
      </div>
    </Surface>
  );
}

function MiniBarChart({
  title,
  subtitle,
  stats,
  days,
  getValue,
  formatValue,
  maxValue,
  tone,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  stats?: Array<{ label: string; value: string }>;
  days: ChartDay[];
  getValue: (day: ChartDay) => number;
  formatValue: (value: number) => string;
  maxValue: number;
  tone: string;
  emptyText: string;
}) {
  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-[-0.02em] text-foreground">{title}</p>
          {subtitle ? <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p> : null}
        </div>
        {stats?.length ? (
          <div className="grid max-w-[46%] shrink-0 grid-cols-2 gap-1 text-right">
            {stats.map((item) => (
              <span key={item.label} className="min-w-0 rounded-full bg-surface-muted px-2 py-1">
                <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">
                  {item.label}
                </span>
                <span className="block truncate text-[0.72rem] font-extrabold text-foreground">
                  {item.value}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {maxValue > 0 ? (
        <>
          <div className="grid grid-cols-[2.4rem_minmax(0,1fr)] gap-2">
            <div className="flex h-28 flex-col justify-between text-right text-[0.62rem] font-bold text-muted">
              <span>{formatValue(maxValue)}</span>
              <span>{formatValue(Math.round(maxValue / 2))}</span>
              <span>0</span>
            </div>
            <div className="relative h-28 border-b border-l border-border/70">
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-border/50" />
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/50" />
              <div className="absolute inset-x-1 bottom-0 top-1 flex items-end gap-1.5">
                {days.map((day) => {
                  const value = getValue(day);
                  const height = Math.max(4, Math.round((value / maxValue) * 96));
                  return (
                    <div key={day.date} className="flex min-w-0 flex-1 items-end">
                      <div
                        className={`w-full rounded-t-full ${tone}`}
                        style={{
                          height: value > 0 ? `${height}px` : "4px",
                          opacity: value > 0 ? 1 : 0.18,
                        }}
                        title={`${formatDate(day.date)}: ${formatValue(value)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-[2.4rem_minmax(0,1fr)] gap-2">
            <span />
            <div className="flex justify-between text-[0.62rem] font-bold text-muted">
              {getXAxisLabels(days).map((item) => (
                <span key={`${item.date}-${item.align}`} className={item.align}>
                  {formatChartDateLabel(item.date)}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyChartMessage text={emptyText} />
      )}
    </section>
  );
}

function EmptyChartMessage({ text }: { text: string }) {
  return (
    <div className="my-1 rounded-[20px] border border-border bg-surface-muted px-3 py-2.5">
      <p className="break-words text-sm leading-5 text-muted">{text}</p>
    </div>
  );
}

function IllnessTimelineChart({
  title,
  subtitle,
  stats,
  days,
  emptyText,
}: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  days: ChartDay[];
  emptyText: string;
}) {
  const activeDays = days.filter((day) => day.illnessCount > 0);

  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold tracking-[-0.02em] text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
        </div>
        <div className="grid max-w-[46%] shrink-0 grid-cols-2 gap-1 text-right">
          {stats.map((item) => (
            <span key={item.label} className="min-w-0 rounded-full bg-surface-muted px-2 py-1">
              <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">
                {item.label}
              </span>
              <span className="block truncate text-[0.72rem] font-extrabold text-foreground">
                {item.value}
              </span>
            </span>
          ))}
        </div>
      </div>
      {activeDays.length ? (
        <>
          <div className="relative min-h-[3.2rem]">
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border" />
            <div className="relative flex justify-between gap-1">
              {days.map((day) => {
                const active = day.illnessCount > 0;
                return (
                  <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span
                      className={[
                        "relative z-10 h-3 w-3 rounded-full border",
                        active
                          ? "border-rose-500 bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.14)]"
                          : "border-border bg-surface-muted",
                      ].join(" ")}
                      title={`${formatDate(day.date)}: ${day.illnessCount}`}
                    />
                    {active ? (
                      <span className="text-[0.62rem] font-bold text-muted">
                        {Number(day.date.slice(8, 10))}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[0.62rem] font-bold text-muted">
            {getXAxisLabels(days).map((item) => (
              <span key={`${item.date}-${item.align}`} className={item.align}>
                {formatChartDateLabel(item.date)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <EmptyChartMessage text={emptyText} />
      )}
    </section>
  );
}

function MetricLineChart({
  title,
  subtitle,
  days,
  getValue,
  unit,
  tone,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  days: ChartDay[];
  getValue: (day: ChartDay) => number | null;
  unit: string;
  tone: string;
  emptyText: string;
}) {
  const points = days
    .map((day, index) => ({ date: day.date, index, value: getValue(day) }))
    .filter(
      (point): point is { date: string; index: number; value: number } => point.value !== null
    );
  if (!points.length) {
    return (
      <section className="py-4 first:pt-0 last:pb-0">
        <EmptyChartMessage text={emptyText} />
      </section>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const width = 320;
  const height = 132;
  const left = 38;
  const right = 12;
  const top = 14;
  const bottom = 28;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const xFor = (index: number) =>
    left + (days.length <= 1 ? innerWidth / 2 : (index / (days.length - 1)) * innerWidth);
  const yFor = (value: number) => top + (1 - (value - min) / range) * innerHeight;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(point.index)} ${yFor(point.value)}`)
    .join(" ");

  return (
    <section className="py-4 first:pt-0 last:pb-0">
      <div className="mb-2">
        <p className="text-sm font-extrabold tracking-[-0.02em] text-foreground">{title}</p>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p> : null}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible">
        <line x1={left} y1={top} x2={left} y2={top + innerHeight} stroke="var(--color-border)" />
        <line
          x1={left}
          y1={top + innerHeight}
          x2={left + innerWidth}
          y2={top + innerHeight}
          stroke="var(--color-border)"
        />
        <line
          x1={left}
          y1={top + innerHeight / 2}
          x2={left + innerWidth}
          y2={top + innerHeight / 2}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <text
          x={left - 6}
          y={top + 4}
          textAnchor="end"
          className="fill-muted text-[10px] font-bold"
        >
          {formatNumber(max)} {unit}
        </text>
        <text
          x={left - 6}
          y={top + innerHeight + 3}
          textAnchor="end"
          className="fill-muted text-[10px] font-bold"
        >
          {formatNumber(min)} {unit}
        </text>
        <path
          d={path}
          fill="none"
          stroke={tone}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point) => (
          <circle key={point.date} cx={xFor(point.index)} cy={yFor(point.value)} r="4" fill={tone}>
            <title>{`${formatDate(point.date)}: ${formatNumber(point.value)} ${unit}`}</title>
          </circle>
        ))}
        {getXAxisLabels(days).map((item) => (
          <text
            key={`${item.date}-${item.align}`}
            x={xFor(item.index)}
            y={height - 5}
            textAnchor={
              item.index === 0 ? "start" : item.index === days.length - 1 ? "end" : "middle"
            }
            className="fill-muted text-[10px] font-bold"
          >
            {formatChartDateLabel(item.date)}
          </text>
        ))}
      </svg>
    </section>
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
  const sleepIds = new Set(
    events.filter((event) => event.kind === "sleep").map((event) => event.id)
  );
  const feedingIds = new Set(
    events.filter((event) => event.kind === "feeding").map((event) => event.id)
  );
  const illnessEvents = events.filter((event) => event.kind === "illness");
  const periodDays = getUniqueDayCount(events);
  const totalSleepMinutes = sleepSessions
    .filter((session) => sleepIds.has(`sleep-${session.id}`))
    .reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
  const feedings = feedingRecords.filter((record) => feedingIds.has(`feeding-${record.id}`));
  const activeIllnesses = illnessEpisodes.filter(
    (episode) =>
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
  const weightStats = buildMetricStats(events, "weight", text.summary.noData);
  const heightStats = buildMetricStats(events, "height", text.summary.noData);
  const formulaAverageLabel = averageFormulaMl
    ? `${averageFormulaMl} мл/${text.summary.perDay}`
    : text.summary.noData;

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
      hint: averageFormulaMl
        ? `${averageFormulaMl} мл/${text.summary.perDay}`
        : `${feedings.length} ${text.summary.records}`,
    },
    {
      kind: "height",
      label: text.summary.height,
      value: heightStats.delta ? `${heightStats.value} (${heightStats.delta})` : heightStats.value,
      hint: heightStats.hint,
    },
    {
      kind: "weight",
      label: text.summary.weight,
      value: weightStats.delta ? `${weightStats.value} (${weightStats.delta})` : weightStats.value,
      hint: weightStats.hint,
    },
    {
      kind: "feeding",
      label: text.summary.formulaAverage,
      value: formulaAverageLabel,
      hint: text.summary.perDay,
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

function buildPlainCalendarDays(anchorDate: Date): CalendarDay[] {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date: getLocalIsoDate(date),
      inMonth: date.getMonth() === month,
      kinds: [],
    };
  });
}

function isDateInsideRange(date: Date, range: { start: Date; end: Date }) {
  return date >= range.start && date <= range.end;
}

function formatMonthTitle(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getWeekdayLabels(language: "ru" | "en") {
  return language === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

function getMonthLabels(language: "ru" | "en") {
  return language === "ru"
    ? [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
      ]
    : [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
}

function buildCalendarYearOptions(viewDate: Date) {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear + 1, viewDate.getFullYear());
  const minYear = Math.min(currentYear - 18, viewDate.getFullYear());
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

function getXAxisLabels(days: ChartDay[]) {
  if (!days.length) return [];
  const indexes = Array.from(new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]));
  return indexes.flatMap((index) => {
    const day = days[index];
    if (!day) return [];
    return {
      date: day.date,
      index,
      align: index === 0 ? "text-left" : index === days.length - 1 ? "text-right" : "text-center",
    };
  });
}

function formatChartDateLabel(value: string) {
  const [, month, day] = value.slice(0, 10).split("-");
  return `${day}.${month}`;
}

interface ChartDay {
  date: string;
  sleepMinutes: number;
  feedingCount: number;
  feedingMl: number;
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
      feedingMl: sumMetricValues(dayEvents.filter((event) => event.kind === "feeding")),
      illnessCount: dayEvents.filter((event) => event.kind === "illness").length,
      weightValue: parseMetricValue(dayEvents.find((event) => event.kind === "weight")?.value),
      heightValue: parseMetricValue(dayEvents.find((event) => event.kind === "height")?.value),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function buildDateRange(
  anchorDate: string,
  period: PeriodKey,
  customStartDate: string,
  customEndDate: string
) {
  if (period === "custom") {
    const first = parseLocalDate(customStartDate);
    const second = parseLocalDate(customEndDate);
    const start = first <= second ? first : second;
    const end = first <= second ? second : first;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  const end = parseLocalDate(anchorDate);
  end.setHours(23, 59, 59, 999);
  const start = parseLocalDate(anchorDate);
  const daysBack = period === "day" ? 0 : period === "week" ? 6 : period === "twoWeeks" ? 13 : 29;
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getPeriodOptionLabel(period: PeriodKey, text: (typeof copy)["ru" | "en"]) {
  switch (period) {
    case "day":
      return text.today;
    case "week":
      return text.week;
    case "twoWeeks":
      return text.twoWeeks;
    case "month":
      return text.month;
    case "custom":
      return text.customPeriod;
  }
}

function getPeriodLabel(
  period: PeriodKey,
  dateRange: { start: Date; end: Date },
  text: (typeof copy)["ru" | "en"],
  language: "ru" | "en"
) {
  if (period === "custom") {
    return `${formatShortDate(dateRange.start, language)}–${formatShortDate(dateRange.end, language)}`;
  }
  return getPeriodOptionLabel(period, text);
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
      ? {
          sleep: "Сон",
          feeding: "Кормление",
          illness: "Болезни",
          measurements: "Замеры",
          average: "ср",
        }
      : {
          sleep: "Sleep",
          feeding: "Feeding",
          illness: "Illness",
          measurements: "Measures",
          average: "avg",
        };
  const sleepEvents = events.filter((event) => event.kind === "sleep");
  const sleepDurations = sleepEvents
    .map((event) => parseDurationMinutes(event.value))
    .filter((value): value is number => value !== null && value > 0);
  const feedingEvents = events.filter((event) => event.kind === "feeding");
  const feedingVolumes = feedingEvents
    .map((event) => parseMetricValue(event.value))
    .filter((value): value is number => value !== null && value > 0);
  const illnessCount = events.filter((event) => event.kind === "illness").length;
  const measurementCount = events.filter(
    (event) => event.kind === "weight" || event.kind === "height"
  ).length;

  const chunks = [
    sleepEvents.length
      ? [
          labels.sleep,
          sleepEvents.length,
          sleepDurations.length
            ? `${labels.average} ${formatDuration(
                Math.round(
                  sleepDurations.reduce((sum, value) => sum + value, 0) / sleepDurations.length
                ),
                language
              )}`
            : "",
        ]
      : null,
    feedingEvents.length
      ? [
          labels.feeding,
          feedingEvents.length,
          feedingVolumes.length
            ? `${labels.average} ${Math.round(
                feedingVolumes.reduce((sum, value) => sum + value, 0) / feedingVolumes.length
              )} мл`
            : "",
        ]
      : null,
    illnessCount ? [labels.illness, illnessCount, ""] : null,
    measurementCount ? [labels.measurements, measurementCount, ""] : null,
  ]
    .filter((chunk): chunk is [string, number, string] => Boolean(chunk))
    .map(([label, count, extra]) => `${label} ${count}${extra ? `, ${extra}` : ""}`);
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

function buildMetricStats(events: TimelineEvent[], kind: "weight" | "height", emptyValue: string) {
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
    return { value: emptyValue, hint: "", delta: "" };
  }
  if (latest.numericValue === null || previous?.numericValue === null || !previous) {
    return { value: latest.value, hint: "", delta: "" };
  }
  const delta = latest.numericValue - previous.numericValue;
  if (Math.abs(delta) < 0.05) {
    return { value: latest.value, hint: "", delta: "" };
  }
  const unit = latest.value.includes("кг") ? "кг" : latest.value.includes("см") ? "см" : "";
  const sign = delta > 0 ? "+" : "";
  return { value: latest.value, hint: "", delta: `${sign}${formatNumber(delta)} ${unit}`.trim() };
}

function toggleKind(current: EventKind[], kind: EventKind): EventKind[] {
  if (current.length === eventKinds.length) {
    return [kind];
  }
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

function getShiftedLocalIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalIsoDate(date);
}

function formatShortDate(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
    return sum + (parseDurationMinutes(event.value) ?? 0);
  }, 0);
}

function sumMetricValues(events: TimelineEvent[]) {
  return events.reduce((sum, event) => sum + (parseMetricValue(event.value) ?? 0), 0);
}

function parseDurationMinutes(value: string | undefined) {
  if (!value) return null;
  const hours = value.match(/(\d+)\s*(?:ч|h)/i);
  const minutes = value.match(/(\d+)\s*(?:мин|min)/i);
  const total = Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0);
  return total > 0 ? total : null;
}

function parseMetricValue(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
