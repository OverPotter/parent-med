import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchChild } from "@shared/api/children";
import { fetchFeedingRecordsByChildId } from "@shared/api/feedingRecords";
import { fetchHeightEntriesByChildId } from "@shared/api/heightEntries";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { fetchSleepSessionsByChildId } from "@shared/api/sleepSessions";
import { fetchWeightEntriesByChildId } from "@shared/api/weightEntries";
import { OverlayDialog } from "@shared/components/OverlayDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { canViewChild } from "@shared/permissions/familyAccess";
import { useAppStore } from "@shared/store/useAppStore";
import { getLocalIsoDate } from "@shared/utils/date";
import { ChildSectionTopBar } from "@client/components/ChildSectionTopBar";
import { IosEdgeBackGesture } from "@shared/components/IosEdgeBackGesture";
import { childCalendarCopy } from "./child-calendar/copy";
import type { EventKind, PeriodKey, ViewMode } from "./child-calendar/types";
import {
  buildCalendarDays,
  buildChartDays,
  buildDateRange,
  buildSummary,
  buildTimelineEvents,
  eventKinds,
  formatMonthTitle,
  getPeriodLabel,
  getPeriodOptionLabel,
  getShiftedLocalIsoDate,
  getWeekdayLabels,
  groupEventsByDay,
  isDateInRange,
  periodOptions,
  kindColorValues,
  summaryAccentColors,
  toggleKind,
} from "./child-calendar/utils";
import {
  CalendarView,
  ChartsView,
  CustomPeriodDialog,
  DayFeedDialog,
  FeedView,
} from "./child-calendar/views";

export function ChildCalendarPage() {
  const { language } = useI18n();
  const isIosShell = useIsIosShell();
  const navigate = useNavigate();
  const text = childCalendarCopy[language];
  const { childId } = useParams<{ childId: string }>();
  const accountFamilyRole = useAppStore((s) => s.accountFamilyRole);
  const accountAccessPolicy = useAppStore((s) => s.accountAccessPolicy);
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
  const [enabledKinds, setEnabledKinds] = useState<EventKind[]>(eventKinds);
  const calendarFeedHistoryRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canViewCalendar =
    !!childId && canViewChild(childId, accountFamilyRole, accountAccessPolicy);

  const { data: child, isLoading: isChildLoading } = useQuery({
    queryKey: ["child", childId],
    queryFn: () => fetchChild(childId!),
    enabled: !!childId && canViewCalendar,
  });
  const { data: sleepSessions = [], isLoading: isSleepLoading } = useQuery({
    queryKey: ["sleep-sessions", childId],
    queryFn: () => fetchSleepSessionsByChildId(childId!),
    enabled: !!childId && canViewCalendar,
  });
  const { data: feedingRecords = [], isLoading: isFeedingLoading } = useQuery({
    queryKey: ["feeding-records", childId],
    queryFn: () => fetchFeedingRecordsByChildId(childId!),
    enabled: !!childId && canViewCalendar,
  });
  const { data: illnessEpisodes = [], isLoading: isIllnessLoading } = useQuery({
    queryKey: ["illness-episodes", childId],
    queryFn: () => fetchIllnessEpisodesByChildId(childId!),
    enabled: !!childId && canViewCalendar,
  });
  const { data: weightEntries = [], isLoading: isWeightLoading } = useQuery({
    queryKey: ["weight-entries", childId],
    queryFn: () => fetchWeightEntriesByChildId(childId!),
    enabled: !!childId && canViewCalendar,
  });
  const { data: heightEntries = [], isLoading: isHeightLoading } = useQuery({
    queryKey: ["height-entries", childId],
    queryFn: () => fetchHeightEntriesByChildId(childId!),
    enabled: !!childId && canViewCalendar,
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

  if (!childId || !canViewCalendar) {
    return <Navigate to="/children" replace />;
  }

  if (isLoading || !child) {
    return <p className="text-sm text-muted">{text.loading}</p>;
  }

  const tabClass = (tab: ViewMode) =>
    [
      "inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-full border px-3.25 py-1 text-center text-[0.8rem] font-bold tracking-[-0.025em] transition sm:min-h-[2.6rem] sm:text-[0.82rem]",
      mode === tab
        ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_26px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
        : "border-border bg-surface-muted text-muted hover:border-primary/35 hover:text-foreground",
    ].join(" ");
  const periodLabel = getPeriodLabel(period, dateRange, text, language);
  const filterClass = (kind: EventKind) =>
    [
      "soft-pill inline-flex min-h-[2.3rem] items-center gap-1.5 rounded-full px-3 py-1 text-[0.76rem] font-semibold tracking-[-0.02em] transition sm:min-h-[2.38rem] sm:text-[0.78rem]",
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
  const handleBack = () => {
    if (!child) return;
    navigate(`/children/${child.id}`);
  };

  return (
    <div
      ref={rootRef}
      className="child-profile-shell child-overview-page min-h-[100dvh] space-y-4 sm:space-y-5"
    >
      <IosEdgeBackGesture isEnabled={isIosShell} onBack={handleBack} targetRef={rootRef} />
      <ChildSectionTopBar
        onBack={handleBack}
        backLabel={text.back}
        title={`${text.title} · ${child.name}`}
        hint={text.hint}
        containerClassName="max-w-5xl"
      />

      <Surface className="mx-auto w-full max-w-5xl space-y-2 p-2 pt-3">
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
              className="inline-flex min-h-[2.35rem] min-w-0 items-start gap-1.5 rounded-[16px] bg-surface-muted/70 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
            >
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: summaryAccentColors[item.kind] }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.7rem] font-extrabold leading-4 tracking-[-0.02em] text-foreground">
                  {item.label}
                </span>
                <span className="block truncate text-[0.68rem] font-semibold leading-4 tracking-[-0.015em] text-muted">
                  {item.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Surface>

      <Surface className="relative z-30 mx-auto w-full max-w-5xl space-y-3 overflow-visible p-3 sm:p-4">
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
          <div className="min-w-[10.5rem]">
            <button
              type="button"
              onClick={() => setIsPeriodMenuOpen((current) => !current)}
              className="soft-input flex min-h-[2.95rem] w-full items-center justify-between gap-3 px-4 text-left text-[0.92rem] tracking-[-0.02em] sm:min-h-[3.1rem]"
              aria-haspopup="dialog"
              aria-expanded={isPeriodMenuOpen}
            >
              <span className="min-w-0 truncate text-foreground">{periodLabel}</span>
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted"
              >
                ▾
              </span>
            </button>
          </div>
          {period === "custom" ? (
            <button
              type="button"
              onClick={openCustomPeriodDialog}
              className="soft-pill app-profile-action min-h-[2.5rem] rounded-[18px] px-3.25 text-[0.8rem] font-bold tracking-[-0.025em] sm:min-h-[2.6rem] sm:text-[0.82rem]"
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
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: kindColorValues[kind] }}
              />
              {text.filters[kind]}
            </button>
          ))}
        </div>
      </Surface>

      <OverlayDialog
        isOpen={isPeriodMenuOpen}
        onClose={() => setIsPeriodMenuOpen(false)}
        placement="bottom"
        zIndexClassName="z-[890]"
        backdropAriaLabel={language === "ru" ? "Закрыть выбор периода" : "Close period options"}
        containerClassName="flex items-end"
        backdropClassName="bg-[rgba(15,23,42,0.32)]"
      >
        <div
          data-ios-disable-back-swipe="true"
          className="relative z-[1] w-full rounded-t-[30px] bg-background px-4 pb-[max(1.25rem,var(--app-safe-bottom-runtime,env(safe-area-inset-bottom)))] pt-4 shadow-[0_-24px_64px_rgba(15,23,42,0.24)] sm:mx-auto sm:max-w-xl"
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[color:color-mix(in_srgb,var(--color-foreground)_16%,transparent)]" />
          <div className="space-y-1.5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">
              {text.summaryPeriodPrefix}
            </p>
            <h2 className="app-card-title text-[1.08rem] sm:text-[1.15rem]">
              {language === "ru" ? "Выберите период" : "Choose period"}
            </h2>
            <p className="text-sm leading-5 text-muted">{periodLabel}</p>
          </div>

          <div className="soft-choice-list mt-4">
            {periodOptions.map((option) => {
              const isActive = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handlePeriodChange(option)}
                  className={["soft-choice-row", isActive ? "soft-choice-row-active" : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="min-w-0 text-left text-sm font-semibold tracking-[-0.02em] text-foreground">
                    {getPeriodOptionLabel(option, text)}
                  </span>
                  <span className="soft-choice-check">
                    {isActive ? "✓" : language === "ru" ? "Выбрать" : "Select"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </OverlayDialog>

      {mode === "feed" ? (
        <FeedView groupedEvents={groupedEvents} emptyText={text.empty} language={language} />
      ) : mode === "calendar" ? (
        <CalendarView
          days={calendarDays}
          hint={text.calendarHint}
          monthTitle={formatMonthTitle(new Date(`${anchorDate}T00:00:00`), language)}
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
