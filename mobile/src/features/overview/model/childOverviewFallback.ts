import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { getOverviewCopy } from "./childOverviewCopy";
import { mapOverviewCalendarDotKey, overviewIconTokens } from "./childOverviewHelpers";
import type {
  ChildOverviewBarDatum,
  ChildOverviewCalendarDay,
  ChildOverviewCalendarMonth,
  ChildOverviewCalendarStat,
  ChildOverviewEventSection,
  ChildOverviewFilter,
  ChildOverviewPeriodOption,
} from "./childOverviewScreen";

type OverviewIconKey =
  | "sleep"
  | "feeding"
  | "illness"
  | "weightHeight"
  | "notes"
  | "bottomChildren"
  | "bottomPills"
  | "bottomMedicineCabinet"
  | "bottomMore";

type OverviewCalendarSpec = {
  copy: {
    month: string;
  };
  components: {
    calendarCard: {
      weekdays: {
        labels: string[];
      };
      grid: {
        days: Array<{
          day: number;
          muted?: boolean;
          selected?: boolean;
          dots?: string[];
        }>;
      };
    };
    monthStatsCard: {
      items: Array<{
        iconCircleBg: string;
        icon: "calendar" | "star" | "clock";
        label: string;
        value: string;
      }>;
    };
  };
};

type OverviewComponents = {
  summaryCard: {
    insights: Array<{
      icon: OverviewIconKey;
      title: string;
      subtitle: string;
    }>;
  };
  filters: {
    items: Array<{
      label: string;
      active?: boolean;
      type?: "dropdown";
      dotColor?: string;
    }>;
  };
  eventsList: {
    items: Array<{
      date: string;
      rows: Array<{
        time: string;
        type: string;
        detail: string;
        icon: OverviewIconKey;
      }>;
    }>;
  };
};

export function buildOverviewPeriodOptions(copy: {
  periodLabels: Record<ChildOverviewPeriodOption["id"], string>;
}): ChildOverviewPeriodOption[] {
  return [
    { id: "week", label: copy.periodLabels.week },
    { id: "twoWeeks", label: copy.periodLabels.twoWeeks },
    { id: "month", label: copy.periodLabels.month },
  ];
}

export function buildFallbackSummaryInsights(
  locale: MobileLocale,
  components: OverviewComponents,
) {
  const copy = getOverviewCopy(locale);
  const titles = [
    copy.insightTitles.illness,
    copy.insightTitles.feeding,
    copy.insightTitles.sleep,
    copy.insightTitles.growth,
  ];
  const subtitles = [
    copy.insightSubtitles.temperatureObservation,
    copy.insightSubtitles.breast,
    copy.insightSubtitles.addRecords,
    copy.insightSubtitles.nothingNew,
  ];

  return components.summaryCard.insights.map((item, index) => ({
    id: `${item.icon}-${item.title}`,
    title: titles[index] ?? item.title,
    subtitle: subtitles[index] ?? item.subtitle,
    icon: overviewIconTokens[item.icon],
  }));
}

export function buildFallbackFilters(
  locale: MobileLocale,
  components: OverviewComponents,
): ChildOverviewFilter[] {
  const copy = getOverviewCopy(locale);
  const labels = [
    copy.filters.all,
    copy.filters.sleep,
    copy.filters.feeding,
    copy.filters.illness,
    copy.filters.weight,
    copy.filters.height,
  ] as const;
  const ids: ChildOverviewFilter["id"][] = [
    "filter-all",
    "filter-sleep",
    "filter-feeding",
    "filter-illness",
    "filter-weight",
    "filter-height",
  ];

  return components.filters.items
    .filter((item) => item.type !== "dropdown")
    .map((item, index) => ({
      id: ids[index] ?? "filter-all",
      label: labels[index] ?? item.label,
      active: Boolean(item.active),
      kind: "chip" as const,
      dotColor: item.dotColor,
    }));
}

export function buildFallbackEvents(
  locale: MobileLocale,
  components: OverviewComponents,
): ChildOverviewEventSection[] {
  const copy = getOverviewCopy(locale);
  return components.eventsList.items.map((section, sectionIndex) => ({
    id: section.date,
    date: sectionIndex === 0 ? copy.dates.today : copy.dates.may3,
    rows: section.rows.map((row) => ({
      id: `${section.date}-${row.time}-${row.type}`,
      category:
        row.icon === "feeding"
          ? "feeding"
          : row.icon === "sleep"
            ? "sleep"
            : "illness",
      time: row.time,
      type:
        row.icon === "feeding"
          ? copy.eventTypes.feeding
          : row.icon === "sleep"
            ? copy.eventTypes.sleep
            : copy.eventTypes.illness,
      detail:
        row.icon === "feeding"
          ? copy.details.breast
          : row.icon === "sleep"
            ? copy.details.zeroMin
            : copy.details.temperatureObservation,
      icon: overviewIconTokens[row.icon],
    })),
  }));
}

export function buildFallbackCalendarMonths(
  locale: MobileLocale,
  calendarSpec: OverviewCalendarSpec,
): ChildOverviewCalendarMonth[] {
  const copy = getOverviewCopy(locale);
  return [
    {
      id: "default-calendar-month",
      label: copy.month,
      days: calendarSpec.components.calendarCard.grid.days.map((day, index) => ({
        id: `calendar-day-${index}-${day.day}`,
        day: day.day,
        muted: Boolean(day.muted),
        selected: Boolean(day.selected),
        dots: (day.dots ?? []).map(mapOverviewCalendarDotKey),
      })),
    },
  ];
}

export function buildFallbackCalendarDays(
  calendarSpec: OverviewCalendarSpec,
): ChildOverviewCalendarDay[] {
  return calendarSpec.components.calendarCard.grid.days.map((day, index) => ({
    id: `calendar-day-${index}-${day.day}`,
    day: day.day,
    muted: Boolean(day.muted),
    selected: Boolean(day.selected),
    dots: (day.dots ?? []).map(mapOverviewCalendarDotKey),
  }));
}

export function buildFallbackCalendarWeekdays(
  locale: MobileLocale,
  calendarSpec: OverviewCalendarSpec,
) {
  if (locale === "ru") {
    return calendarSpec.components.calendarCard.weekdays.labels;
  }
  if (locale === "pl") return ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];
  if (locale === "de") return ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

export function buildFallbackCalendarStats(
  locale: MobileLocale,
  copy: {
    calendarStats: {
      activeDays: string;
      mostOften: string;
      latestEntry: string;
    };
    eventTypes: {
      feeding: string;
    };
    dates: {
      may3: string;
    };
  },
  calendarSpec: OverviewCalendarSpec,
): ChildOverviewCalendarStat[] {
  const labels = [
    copy.calendarStats.activeDays,
    copy.calendarStats.mostOften,
    copy.calendarStats.latestEntry,
  ];
  const values = [
    calendarSpec.components.monthStatsCard.items[0]?.value ?? "0",
    copy.eventTypes.feeding,
    copy.dates.may3,
  ];

  return calendarSpec.components.monthStatsCard.items.map((item, index) => ({
    id: `${item.icon}-${index}`,
    icon: item.icon,
    label: labels[index] ?? item.label,
    value: values[index] ?? item.value,
    iconCircleBg: item.iconCircleBg,
  }));
}

export function buildFallbackGraphics(copy: {
  eventTypes: { feeding: string };
  filters: { illness: string; sleep: string; weight: string; height: string };
}) {
  const rows = [
    {
      icon: "feeding" as const,
      label: copy.eventTypes.feeding,
      value: 4,
      unit: "entries" as const,
      color: "#F7A14C",
    },
    {
      icon: "illness" as const,
      label: copy.filters.illness,
      value: 2,
      unit: "episodes" as const,
      color: "#F58E97",
    },
    {
      icon: "sleep" as const,
      label: copy.filters.sleep,
      value: 3,
      unit: "sleeps" as const,
      color: "#8B74D9",
    },
    {
      icon: "weight" as const,
      label: copy.filters.weight,
      value: 1,
      unit: "measurements" as const,
      color: "#39C0A6",
    },
    {
      icon: "growth" as const,
      label: copy.filters.height,
      value: 1,
      unit: "measurements" as const,
      color: "#8CCB2E",
    },
  ];
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  const peak = rows.reduce((max, item) => (item.value > max.value ? item : max), rows[0]);

  return {
    total,
    peak,
    rows: rows.map((item, index) => ({
      id: `${item.label}-${index}`,
      icon: item.icon,
      label: item.label,
      value: item.value,
      unit: item.unit,
      color: item.color,
      highlighted: item.value === peak.value && item.value > 0,
    })) satisfies ChildOverviewBarDatum[],
  };
}
