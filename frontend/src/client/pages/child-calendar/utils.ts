import type {
  FeedingRecord,
  HeightEntry,
  IllnessEpisode,
  SleepSession,
  WeightEntry,
} from "@shared/types/api";
import { getLocalIsoDate } from "@shared/utils/date";
import { formatChildDate } from "@client/utils/childDateFormat";
import { childCalendarCopy } from "./copy";
import type {
  CalendarDay,
  ChartDay,
  EventKind,
  PeriodKey,
  SummaryItem,
  TimelineEvent,
} from "./types";

export const eventKinds: EventKind[] = ["sleep", "feeding", "illness", "weight", "height"];
export const periodOptions: PeriodKey[] = ["day", "week", "twoWeeks", "month", "custom"];

export const kindStyles: Record<EventKind, string> = {
  sleep: "bg-sky-500",
  feeding: "bg-teal-500",
  illness: "bg-rose-500",
  weight: "bg-emerald-500",
  height: "bg-lime-500",
};

export const summaryAccentStyles: Record<SummaryItem["kind"], string> = {
  sleep: "bg-sky-500",
  feeding: "bg-teal-500",
  illness: "bg-rose-500",
  weight: "bg-emerald-500",
  height: "bg-lime-500",
  events: "bg-violet-500",
  measurements: "bg-emerald-500",
};

export function buildTimelineEvents({
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
  const text = childCalendarCopy[language];
  const events: TimelineEvent[] = [];

  sleepSessions.forEach((session) => {
    events.push({
      id: `sleep-${session.id}`,
      kind: "sleep",
      at: session.startedAt,
      title: text.sleepStarted,
      detail: session.endedAt
        ? `${language === "ru" ? "до" : "until"} ${formatTimelineEndLabel(
            session.startedAt,
            session.endedAt,
            language
          )}`
        : text.activeStatus,
      value: formatDuration(session.durationMinutes, language),
    });
  });

  feedingRecords.forEach((record) => {
    const typeLabel = record.feedingType === "formula" ? text.formula : text.breast;
    const details = [
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
      detail: "",
      value: `${formatNumber(entry.valueKg)} кг`,
    });
  });

  heightEntries.forEach((entry) => {
    events.push({
      id: `height-${entry.id}`,
      kind: "height",
      at: entry.measuredAt,
      title: text.heightMeasured,
      detail: "",
      value: `${formatNumber(entry.valueCm)} см`,
    });
  });

  return events.filter((event) => event.at);
}

export function buildSummary(
  events: TimelineEvent[],
  sleepSessions: SleepSession[],
  feedingRecords: FeedingRecord[],
  illnessEpisodes: IllnessEpisode[],
  text: (typeof childCalendarCopy)["ru" | "en"],
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

export function buildCalendarDays(
  anchorDate: string,
  events: TimelineEvent[],
  enabledKinds: EventKind[]
) {
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
    return { date: isoDate, inMonth: date.getMonth() === month, kinds };
  });
}

export function buildPlainCalendarDays(anchorDate: Date): CalendarDay[] {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date: getLocalIsoDate(date), inMonth: date.getMonth() === month, kinds: [] };
  });
}

export function isDateInsideRange(date: Date, range: { start: Date; end: Date }) {
  return date >= range.start && date <= range.end;
}

export function formatMonthTitle(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getWeekdayLabels(language: "ru" | "en") {
  return language === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

export function getMonthLabels(language: "ru" | "en") {
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

export function buildCalendarYearOptions(viewDate: Date) {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(currentYear + 1, viewDate.getFullYear());
  const minYear = Math.min(currentYear - 18, viewDate.getFullYear());
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

export function getXAxisLabels(days: ChartDay[]) {
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

export function formatChartDateLabel(value: string, language: "ru" | "en") {
  return formatChildDate(value, language, { month: "short", relative: false });
}

export function buildChartDays(start: Date, end: Date, events: TimelineEvent[]): ChartDay[] {
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

export function buildDateRange(
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

export function getPeriodOptionLabel(
  period: PeriodKey,
  text: (typeof childCalendarCopy)["ru" | "en"]
) {
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

export function getPeriodLabel(
  period: PeriodKey,
  dateRange: { start: Date; end: Date },
  text: (typeof childCalendarCopy)["ru" | "en"],
  language: "ru" | "en"
) {
  if (period === "custom") {
    return `${formatShortDate(dateRange.start, language)}–${formatShortDate(dateRange.end, language)}`;
  }
  return getPeriodOptionLabel(period, text);
}

export function groupEventsByDay(events: TimelineEvent[]) {
  const groups = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const key = event.at.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  });
  return Array.from(groups.entries()).map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

export function buildDaySummary(events: TimelineEvent[], language: "ru" | "en") {
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
            ? `${labels.average} ${Math.round(feedingVolumes.reduce((sum, value) => sum + value, 0) / feedingVolumes.length)} мл`
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

export function getUniqueDayCount(events: TimelineEvent[]) {
  const dayCount = new Set(events.map((event) => event.at.slice(0, 10))).size;
  return Math.max(1, dayCount);
}

export function formatAverageCount(value: number) {
  if (value >= 10 || Number.isInteger(value)) return String(Math.round(value));
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
  if (!latest) return { value: emptyValue, hint: "", delta: "" };
  if (latest.numericValue === null || previous?.numericValue === null || !previous) {
    return { value: latest.value, hint: "", delta: "" };
  }
  const delta = latest.numericValue - previous.numericValue;
  if (Math.abs(delta) < 0.05) return { value: latest.value, hint: "", delta: "" };
  const unit = latest.value.includes("кг") ? "кг" : latest.value.includes("см") ? "см" : "";
  const sign = delta > 0 ? "+" : "";
  return { value: latest.value, hint: "", delta: `${sign}${formatNumber(delta)} ${unit}`.trim() };
}

export function toggleKind(current: EventKind[], kind: EventKind): EventKind[] {
  if (current.length === eventKinds.length) return [kind];
  if (current.includes(kind)) {
    const next = current.filter((item) => item !== kind);
    return next.length ? next : eventKinds;
  }
  return [...current, kind];
}

export function isDateInRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
}

export function parseLocalDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function getShiftedLocalIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getLocalIsoDate(date);
}

export function formatShortDate(date: Date, language: "ru" | "en") {
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatTime(value: string) {
  return value.slice(11, 16);
}

function formatTimelineEndLabel(startedAt: string, endedAt: string, language: "ru" | "en") {
  if (startedAt.slice(0, 10) === endedAt.slice(0, 10)) return formatTime(endedAt);
  return `${formatTime(endedAt)} · ${formatChildDate(endedAt, language, { month: "short" })}`;
}

export function formatDuration(minutes: number | null | undefined, language: "ru" | "en") {
  if (!minutes || minutes <= 0) return language === "ru" ? "0 мин" : "0 min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return language === "ru" ? `${rest} мин` : `${rest} min`;
  return language === "ru" ? `${hours} ч ${rest} мин` : `${hours} h ${rest} min`;
}

function formatIllnessDuration(startedAt: string, closedAt: string, language: "ru" | "en") {
  const started = new Date(startedAt).getTime();
  const closed = new Date(closedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(closed) || closed <= started) {
    return language === "ru" ? "1 день" : "1 day";
  }
  const days = Math.max(1, Math.ceil((closed - started) / (24 * 60 * 60 * 1000)));
  if (language === "ru") return `${days} ${getRussianDayWord(days)}`;
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function getRussianDayWord(days: number) {
  const lastTwo = days % 100;
  const last = days % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value);
}

export function uniqueKinds(kinds: EventKind[]) {
  return eventKinds.filter((kind) => kinds.includes(kind));
}

function sumEventDurations(events: TimelineEvent[]) {
  return events.reduce((sum, event) => sum + (parseDurationMinutes(event.value) ?? 0), 0);
}

function sumMetricValues(events: TimelineEvent[]) {
  return events.reduce((sum, event) => sum + (parseMetricValue(event.value) ?? 0), 0);
}

export function parseDurationMinutes(value: string | undefined) {
  if (!value) return null;
  const hours = value.match(/(\d+)\s*(?:ч|h)/i);
  const minutes = value.match(/(\d+)\s*(?:мин|min)/i);
  const total = Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0);
  return total > 0 ? total : null;
}

export function parseMetricValue(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
