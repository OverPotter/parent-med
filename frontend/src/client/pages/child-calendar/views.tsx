import { type TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Surface } from "@shared/components/Surface";
import { getLocalIsoDate } from "@shared/utils/date";
import { formatChildDate } from "@client/utils/childDateFormat";
import { childCalendarCopy } from "./copy";
import type { CalendarDay, ChartDay, EventKind, TimelineEvent } from "./types";
import {
  buildCalendarYearOptions,
  buildDateRange,
  buildDaySummary,
  buildPlainCalendarDays,
  formatChartDateLabel,
  formatDuration,
  formatMonthTitle,
  formatNumber,
  formatShortDate,
  formatTime,
  getMonthLabels,
  getWeekdayLabels,
  getXAxisLabels,
  isDateInsideRange,
  kindStyles,
  parseLocalDate,
  uniqueKinds,
} from "./utils";

export function FeedView({
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
                {formatChildDate(group.date, language)}
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

export function DayFeedDialog({
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
      if (event.key === "Escape") onClose();
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
            <h3 className="app-card-title mt-1 text-[1.25rem]">
              {formatChildDate(date, language)}
            </h3>
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

export function CalendarView({
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

export function ChartsView({
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
            language={language}
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
              language={language}
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
              language={language}
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
            language={language}
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
                    language={language}
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
                    language={language}
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
  language,
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
  language: "ru" | "en";
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
          <div className="grid max-w-[48%] shrink-0 grid-cols-1 gap-1 text-right xs:grid-cols-2">
            {stats.map((item) => (
              <span key={item.label} className="min-w-0 rounded-full bg-surface-muted px-2 py-1">
                <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">
                  {item.label}
                </span>
                <span className="block whitespace-normal break-words text-[0.72rem] font-extrabold leading-4 text-foreground">
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
                        title={`${formatChildDate(day.date, language)}: ${formatValue(value)}`}
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
                  {formatChartDateLabel(item.date, language)}
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
  language,
  emptyText,
}: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  days: ChartDay[];
  language: "ru" | "en";
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
        <div className="grid max-w-[48%] shrink-0 grid-cols-1 gap-1 text-right xs:grid-cols-2">
          {stats.map((item) => (
            <span key={item.label} className="min-w-0 rounded-full bg-surface-muted px-2 py-1">
              <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">
                {item.label}
              </span>
              <span className="block whitespace-normal break-words text-[0.72rem] font-extrabold leading-4 text-foreground">
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
                      title={`${formatChildDate(day.date, language)}: ${day.illnessCount}`}
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
                {formatChartDateLabel(item.date, language)}
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
  language,
  getValue,
  unit,
  tone,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  days: ChartDay[];
  language: "ru" | "en";
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
            <title>{`${formatChildDate(point.date, language)}: ${formatNumber(point.value)} ${unit}`}</title>
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
            {formatChartDateLabel(item.date, language)}
          </text>
        ))}
      </svg>
    </section>
  );
}

export function CustomPeriodDialog({
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
  text: (typeof childCalendarCopy)["ru" | "en"];
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
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const selectDate = (date: string) => {
    if (calendarEdge === "start") {
      onStartDateChange(date);
      if (parseLocalDate(date) > parseLocalDate(endDate)) onEndDateChange(date);
      setCalendarEdge(null);
      return;
    }

    onEndDateChange(date);
    if (parseLocalDate(date) < parseLocalDate(startDate)) onStartDateChange(date);
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
          {(["start", "end"] as const).map((edge) => {
            const label = edge === "start" ? text.dateFrom : text.dateTo;
            const value = edge === "start" ? startDate : endDate;
            return (
              <button
                key={edge}
                type="button"
                onClick={() => setCalendarEdge(edge)}
                className="flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[22px] border border-border bg-surface-muted px-3.5 py-2.5 text-left text-foreground transition hover:border-primary/30"
              >
                <span className="min-w-0">
                  <span className="block text-[0.65rem] font-bold uppercase tracking-[0.08em] opacity-70">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm font-extrabold">
                    {formatShortDate(parseLocalDate(value), language)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/80 text-muted shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)]"
                >
                  ▾
                </span>
              </button>
            );
          })}
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
      if (event.key === "Escape") onCancel();
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

function formatAverageCount(value: number) {
  if (value >= 10 || Number.isInteger(value)) {
    return String(Math.round(value));
  }
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}
