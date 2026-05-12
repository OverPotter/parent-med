import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  translateOverviewDetail,
  translateOverviewEventDate,
  translateOverviewEventType,
  translateOverviewFilter,
  translateOverviewInsightSubtitle,
  translateOverviewInsightTitle,
  translateOverviewMonth,
} from "./childOverviewCopy";
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
  const isRu = locale === "ru";
  return components.summaryCard.insights.map((item) => ({
    id: `${item.icon}-${item.title}`,
    title: isRu ? item.title : translateOverviewInsightTitle(item.title, locale),
    subtitle: isRu ? item.subtitle : translateOverviewInsightSubtitle(item.subtitle, locale),
    icon: overviewIconTokens[item.icon],
  }));
}

export function buildFallbackFilters(
  locale: MobileLocale,
  components: OverviewComponents,
): ChildOverviewFilter[] {
  const isRu = locale === "ru";
  return components.filters.items
    .filter((item) => item.type !== "dropdown")
    .map((item) => ({
      id: `${item.type ?? "chip"}-${item.label}`,
      label: isRu ? item.label : translateOverviewFilter(item.label, locale),
      active: Boolean(item.active),
      kind: "chip" as const,
      dotColor: item.dotColor,
    }));
}

export function buildFallbackEvents(
  locale: MobileLocale,
  components: OverviewComponents,
): ChildOverviewEventSection[] {
  const isRu = locale === "ru";
  return components.eventsList.items.map((section) => ({
    id: section.date,
    date: isRu ? section.date : translateOverviewEventDate(section.date, locale),
    rows: section.rows.map((row) => ({
      id: `${section.date}-${row.time}-${row.type}`,
      time: row.time,
      type: isRu ? row.type : translateOverviewEventType(row.type, locale),
      detail: isRu ? row.detail : translateOverviewDetail(row.detail, locale),
      icon: overviewIconTokens[row.icon],
    })),
  }));
}

export function buildFallbackCalendarMonths(
  locale: MobileLocale,
  calendarSpec: OverviewCalendarSpec,
): ChildOverviewCalendarMonth[] {
  const isRu = locale === "ru";
  return [
    {
      id: "default-calendar-month",
      label: isRu
        ? calendarSpec.copy.month
        : translateOverviewMonth(calendarSpec.copy.month, locale),
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
  const isRu = locale === "ru";
  return calendarSpec.components.monthStatsCard.items.map((item, index) => ({
    id: `${item.icon}-${index}`,
    icon: item.icon,
    label: isRu
      ? item.label
      : item.label === "Активные дни"
        ? copy.calendarStats.activeDays
        : item.label === "Чаще всего"
          ? copy.calendarStats.mostOften
          : copy.calendarStats.latestEntry,
    value: isRu
      ? item.value
      : item.value === "Кормление"
        ? copy.eventTypes.feeding
        : item.value === "3 мая"
          ? copy.dates.may3
          : item.value,
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
