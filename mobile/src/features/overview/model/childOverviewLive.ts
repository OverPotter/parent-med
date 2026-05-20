import type { DateRangeValue } from "../../../shared/lib/dateRange";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFeedingRecord } from "../../feeding/api/feedingRecordsApi";
import type { MobileHeightEntry } from "../../growth/api/heightEntriesApi";
import type { MobileIllnessEpisode } from "../../illness/api/illnessAnalyticsApi";
import type { MobileSleepSession } from "../../sleep/api/sleepSessionsApi";
import type { MobileWeightEntry } from "../../weight/api/weightEntriesApi";
import { overviewIconTokens } from "./childOverviewHelpers";
import {
  buildOverviewCalendarData,
  buildOverviewEvent,
  groupOverviewEventsByDay,
  startOfOverviewMonth,
  type ChildOverviewTimestampedEvent,
} from "./childOverviewCalendar";
import { getOverviewCopy } from "./childOverviewCopy";
import { parseDateOnlyIso } from "../../../shared/lib/dateRange";
import type {
  ChildOverviewBarDatum,
  ChildOverviewCalendarDay,
  ChildOverviewCalendarMonth,
  ChildOverviewCalendarStat,
  ChildOverviewEventRow,
  ChildOverviewEventSection,
  ChildOverviewIconToken,
  ChildOverviewPeriodOption,
} from "./childOverviewScreen";

export type ChildOverviewDataBundle = {
  feedingRecords?: MobileFeedingRecord[];
  sleepSessions?: MobileSleepSession[];
  weightEntries?: MobileWeightEntry[];
  heightEntries?: MobileHeightEntry[];
  illnessEpisodes?: MobileIllnessEpisode[];
};

export type ChildOverviewLiveData = {
  calendarAvailableMonthKeys: string[];
  summaryInsights: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: ChildOverviewIconToken;
  }>;
  events: ChildOverviewEventSection[];
  calendarMonths: ChildOverviewCalendarMonth[];
  calendarDays: ChildOverviewCalendarDay[];
  calendarStats: ChildOverviewCalendarStat[];
  selectedDayEntriesByDay: Record<string, ChildOverviewEventRow[]>;
  graphicsBarData: ChildOverviewBarDatum[];
  graphicsBarTotalLabel: string;
  graphicsBarPeakLabel: string;
};

export function buildLiveOverviewData(
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
  periodId: ChildOverviewPeriodOption["id"],
  activeFilterId: string,
  data?: ChildOverviewDataBundle,
  customRange?: DateRangeValue | null,
  visibleCalendarMonthKey?: string | null,
): ChildOverviewLiveData | null {
  if (!data) {
    return null;
  }

  const allFeedingRecords = data.feedingRecords ?? [];
  const allSleepSessions = data.sleepSessions ?? [];
  const allWeightEntries = data.weightEntries ?? [];
  const allHeightEntries = data.heightEntries ?? [];
  const allIllnessEpisodes = data.illnessEpisodes ?? [];
  const periodStart = customRange ? null : resolvePeriodStart(periodId);
  const periodEnd = new Date();
  periodEnd.setHours(23, 59, 59, 999);
  const feedingRecords = allFeedingRecords.filter((item) =>
    isInOverviewRange(item.recordedAt, periodStart, customRange),
  );
  const sleepSessions = allSleepSessions.filter((item) =>
    isInOverviewRange(item.startedAt, periodStart, customRange),
  );
  const weightEntries = allWeightEntries.filter((item) =>
    isInOverviewRange(item.measuredAt, periodStart, customRange),
  );
  const heightEntries = allHeightEntries.filter((item) =>
    isInOverviewRange(item.measuredAt, periodStart, customRange),
  );
  const illnessEpisodes = allIllnessEpisodes.filter((item) =>
    isInOverviewRange(item.closedAt ?? item.startedAt, periodStart, customRange),
  );
  const allEvents = [
    ...buildFeedingEvents(allFeedingRecords, locale, copy),
    ...buildSleepEvents(allSleepSessions, locale, copy),
    ...buildIllnessEvents(allIllnessEpisodes, locale, copy),
    ...buildWeightEvents(allWeightEntries, locale, copy),
    ...buildHeightEvents(allHeightEntries, locale, copy),
  ].sort((left, right) => right.timestamp - left.timestamp);
  const filteredEvents = filterOverviewEvents(
    [
      ...buildFeedingEvents(feedingRecords, locale, copy),
      ...buildSleepEvents(sleepSessions, locale, copy),
      ...buildIllnessEvents(illnessEpisodes, locale, copy),
      ...buildWeightEvents(weightEntries, locale, copy),
      ...buildHeightEvents(heightEntries, locale, copy),
    ].sort((left, right) => right.timestamp - left.timestamp),
    activeFilterId,
  );
  const groupedEvents = groupOverviewEventsByDay(filteredEvents, locale);
  const calendarRangeStart =
    allEvents.length === 0
      ? null
      : startOfOverviewMonth(new Date(allEvents[allEvents.length - 1].timestamp));
  const calendarData = buildOverviewCalendarData(
    locale,
    copy,
    allEvents,
    calendarRangeStart,
    periodEnd,
    visibleCalendarMonthKey,
  );
  const chartData = buildOverviewChartData(
    copy,
    feedingRecords.length,
    illnessEpisodes.length,
    sleepSessions.length,
    weightEntries.length,
    heightEntries.length,
  );

  return {
    calendarAvailableMonthKeys: calendarData.availableMonthKeys,
    summaryInsights: [
      {
        id: "illness-live",
        title: `${copy.filters.illness} — ${illnessEpisodes.length} ${localizeEpisodeLabel(illnessEpisodes.length, locale)}`,
        subtitle:
          illnessEpisodes.length > 0
            ? copy.insightSubtitles.temperatureObservation
            : copy.insightSubtitles.addRecords,
        icon: overviewIconTokens.illness,
      },
      {
        id: "feeding-live",
        title: `${copy.filters.feeding} — ${feedingRecords.length} ${localizeEntryLabel(feedingRecords.length, locale)}`,
        subtitle:
          feedingRecords.length > 0
            ? copy.insightSubtitles.breast
            : copy.insightSubtitles.addRecords,
        icon: overviewIconTokens.feeding,
      },
      {
        id: "sleep-live",
        title: `${copy.filters.sleep} — ${sleepSessions.length} ${localizeSleepLabel(sleepSessions.length, locale)}`,
        subtitle:
          sleepSessions.length > 0
            ? buildAverageSleepHint(sleepSessions, locale)
            : copy.insightSubtitles.addRecords,
        icon: overviewIconTokens.sleep,
      },
      {
        id: "growth-live",
        title: `${copy.filters.height} / ${copy.filters.weight} — ${weightEntries.length + heightEntries.length} ${localizeMeasurementLabel(weightEntries.length + heightEntries.length, locale)}`,
        subtitle:
          weightEntries.length + heightEntries.length > 0
            ? copy.insightSubtitles.nothingNew
            : copy.insightSubtitles.addRecords,
        icon: overviewIconTokens.weightHeight,
      },
    ],
    events: groupedEvents,
    calendarMonths: calendarData.months,
    calendarDays: calendarData.days,
    calendarStats: calendarData.stats,
    selectedDayEntriesByDay: calendarData.entriesByDay,
    graphicsBarData: chartData.rows,
    graphicsBarTotalLabel: `${copy.graphics.totalPrefix}: ${chartData.total}`,
    graphicsBarPeakLabel: `${copy.graphics.peakPrefix}: ${chartData.peakLabel}`,
  };
}

function buildFeedingEvents(
  items: MobileFeedingRecord[],
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
) {
  return items.map((item) =>
    buildOverviewEvent(
      item.recordedAt,
      locale,
      "feeding",
      copy.eventTypes.feeding,
      buildFeedingDetail(item, locale),
      overviewIconTokens.feeding,
    ),
  );
}

function buildSleepEvents(
  items: MobileSleepSession[],
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
) {
  return items.map((item) =>
    buildOverviewEvent(
      item.startedAt,
      locale,
      "sleep",
      copy.eventTypes.sleep,
      buildSleepDetail(item, locale),
      overviewIconTokens.sleep,
    ),
  );
}

function buildIllnessEvents(
  items: MobileIllnessEpisode[],
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
) {
  return items.map((item) =>
    buildOverviewEvent(
      item.closedAt ?? item.startedAt,
      locale,
      "illness",
      copy.eventTypes.illness,
      buildIllnessDetail(item, locale),
      overviewIconTokens.illness,
    ),
  );
}

function buildWeightEvents(
  items: MobileWeightEntry[],
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
) {
  return items.map((item) =>
    buildOverviewEvent(
      item.measuredAt,
      locale,
      "weight",
      copy.filters.weight,
      formatWeightDetail(item.valueKg, locale),
      overviewIconTokens.weightHeight,
    ),
  );
}

function buildHeightEvents(
  items: MobileHeightEntry[],
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
) {
  return items.map((item) =>
    buildOverviewEvent(
      item.measuredAt,
      locale,
      "height",
      copy.filters.height,
      formatHeightDetail(item.valueCm),
      overviewIconTokens.weightHeight,
    ),
  );
}

function resolvePeriodStart(periodId: ChildOverviewPeriodOption["id"]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now);

  if (periodId === "twoWeeks") {
    start.setDate(now.getDate() - 13);
    return start;
  }

  if (periodId === "month") {
    start.setDate(now.getDate() - 29);
    return start;
  }

  start.setDate(now.getDate() - 6);
  return start;
}

function isInOverviewRange(
  value: string | null,
  start: Date | null,
  customRange: DateRangeValue | null | undefined,
) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  if (customRange) {
    const rangeStart = parseDateOnlyIso(customRange.startDate);
    const rangeEnd = parseDateOnlyIso(customRange.endDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);
    return date >= rangeStart && date <= rangeEnd;
  }

  return start ? date >= start : true;
}

function filterOverviewEvents(
  items: ChildOverviewTimestampedEvent[],
  activeFilterId: string,
) {
  if (activeFilterId === "filter-all" || !activeFilterId) {
    return items;
  }

  return items.filter((item) => activeFilterId === `filter-${item.category}`);
}

function buildOverviewChartData(
  copy: ReturnType<typeof getOverviewCopy>,
  feedingCount: number,
  illnessCount: number,
  sleepCount: number,
  weightCount: number,
  heightCount: number,
) {
  const rows: ChildOverviewBarDatum[] = [
    {
      id: "feeding",
      icon: "feeding",
      label: copy.filters.feeding,
      value: feedingCount,
      unit: "entries",
      color: "#F7A14C",
      highlighted: false,
    },
    {
      id: "illness",
      icon: "illness",
      label: copy.filters.illness,
      value: illnessCount,
      unit: "episodes",
      color: "#F58E97",
      highlighted: false,
    },
    {
      id: "sleep",
      icon: "sleep",
      label: copy.filters.sleep,
      value: sleepCount,
      unit: "sleeps",
      color: "#8B74D9",
      highlighted: false,
    },
    {
      id: "weight",
      icon: "weight",
      label: copy.filters.weight,
      value: weightCount,
      unit: "measurements",
      color: "#39C0A6",
      highlighted: false,
    },
    {
      id: "growth",
      icon: "growth",
      label: copy.filters.height,
      value: heightCount,
      unit: "measurements",
      color: "#8CCB2E",
      highlighted: false,
    },
  ];
  const peak = rows.reduce((max, item) => (item.value > max.value ? item : max), rows[0]);
  return {
    rows: rows.map((item) => ({ ...item, highlighted: item.id === peak.id && item.value > 0 })),
    total: rows.reduce((sum, item) => sum + item.value, 0),
    peakLabel: `${peak.label} · ${peak.value}`,
  };
}

function buildFeedingDetail(item: MobileFeedingRecord, locale: MobileLocale) {
  if (item.feedingType === "formula" && item.formulaVolumeMl) {
    return `${Math.round(item.formulaVolumeMl)} ml`;
  }

  return getOverviewCopy(locale).details.breast;
}

function buildSleepDetail(item: MobileSleepSession, locale: MobileLocale) {
  const duration = item.durationMinutes ?? 0;
  if (duration <= 0) {
    return getOverviewCopy(locale).details.zeroMin;
  }

  if (duration >= 60) {
    const hours = Math.round((duration / 60) * 10) / 10;
    return `${hours} ${getOverviewCopy(locale).details.hourShort}`;
  }

  return `${duration} ${locale === "de" || locale === "pl" || locale === "en" ? "min" : "мин"}`;
}

function buildIllnessDetail(item: MobileIllnessEpisode, locale: MobileLocale) {
  return item.title?.trim() || getOverviewCopy(locale).details.temperatureObservation;
}

function formatWeightDetail(valueKg: number, locale: MobileLocale) {
  return `${valueKg} ${locale === "ru" ? "кг" : "kg"}`;
}

function formatHeightDetail(valueCm: number) {
  return `${valueCm} cm`;
}

function localizeEpisodeLabel(count: number, locale: MobileLocale) {
  if (locale === "ru") return count === 1 ? "эпизод" : count < 5 ? "эпизода" : "эпизодов";
  if (locale === "de") return count === 1 ? "Episode" : "Episoden";
  if (locale === "pl") return count === 1 ? "epizod" : "epizody";
  return count === 1 ? "episode" : "episodes";
}

function localizeEntryLabel(count: number, locale: MobileLocale) {
  if (locale === "ru") return count === 1 ? "запись" : count < 5 ? "записи" : "записей";
  if (locale === "de") return count === 1 ? "Eintrag" : "Einträge";
  if (locale === "pl") return count === 1 ? "wpis" : "wpisy";
  return count === 1 ? "entry" : "entries";
}

function localizeSleepLabel(count: number, locale: MobileLocale) {
  if (locale === "ru") return count === 1 ? "сон" : count < 5 ? "сна" : "снов";
  if (locale === "de") return count === 1 ? "Schlaf" : "Schlafphasen";
  if (locale === "pl") return count === 1 ? "sen" : "sny";
  return count === 1 ? "sleep" : "sleeps";
}

function localizeMeasurementLabel(count: number, locale: MobileLocale) {
  if (locale === "ru") return count === 1 ? "измерение" : count < 5 ? "измерения" : "измерений";
  if (locale === "de") return count === 1 ? "Messung" : "Messungen";
  if (locale === "pl") return count === 1 ? "pomiar" : "pomiary";
  return count === 1 ? "measurement" : "measurements";
}

function buildAverageSleepHint(items: MobileSleepSession[], locale: MobileLocale) {
  const withDuration = items.filter((item) => typeof item.durationMinutes === "number");
  if (withDuration.length === 0) {
    return getOverviewCopy(locale).insightSubtitles.addRecords;
  }

  const avg = Math.round(
    withDuration.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0) /
      withDuration.length,
  );
  return buildSleepDetail({ durationMinutes: avg } as MobileSleepSession, locale);
}
