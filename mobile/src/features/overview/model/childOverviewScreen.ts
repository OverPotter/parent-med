import { ImageSourcePropType } from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { getInclusiveDaySpan, type DateRangeValue } from "../../../shared/lib/dateRange";
import { getOverviewCopy } from "./childOverviewCopy";
import { overviewIconTokens, replaceOverviewDemoName } from "./childOverviewHelpers";
import { buildLiveOverviewData, type ChildOverviewDataBundle } from "./childOverviewLive";
import {
  buildFallbackCalendarDays,
  buildFallbackCalendarMonths,
  buildFallbackCalendarStats,
  buildFallbackCalendarWeekdays,
  buildFallbackEvents,
  buildFallbackFilters,
  buildFallbackGraphics,
  buildFallbackSummaryInsights,
  buildOverviewPeriodOptions,
} from "./childOverviewFallback";
import {
  overviewCalendarSpec as calendarSpec,
  overviewSpec as spec,
  type OverviewIconKey,
  type OverviewStyleGuide,
} from "./childOverviewSpec";

export type ChildOverviewTheme = {
  colors: OverviewStyleGuide["colors"];
  screenBackground: OverviewStyleGuide["gradients"]["screenBackground"];
  selectedTabGradient: OverviewStyleGuide["gradients"]["selectedTab"];
  primaryButtonGradient: OverviewStyleGuide["gradients"]["primaryCoralButton"];
  avatarBlobColor: string;
  avatarDecoration: OverviewStyleGuide["characterIllustration"]["decorations"];
};

export type ChildOverviewIconToken = {
  key: OverviewIconKey;
  label: string;
  symbol: string;
  color: string;
  background: string;
};

export type ChildOverviewTab = {
  id: string;
  kind: "feed" | "calendar" | "charts";
  label: string;
  active: boolean;
};

export type ChildOverviewFilter = {
  id:
    | "filter-all"
    | "filter-sleep"
    | "filter-feeding"
    | "filter-illness"
    | "filter-weight"
    | "filter-height";
  label: string;
  active: boolean;
  kind: "dropdown" | "chip";
  dotColor?: string;
};

export type ChildOverviewEventRow = {
  id: string;
  category: "feeding" | "sleep" | "illness" | "weight" | "height";
  time: string;
  type: string;
  detail: string;
  icon: ChildOverviewIconToken;
};

export type ChildOverviewEventSection = {
  id: string;
  date: string;
  rows: ChildOverviewEventRow[];
};

export type ChildOverviewBottomNavItem = {
  id: "bottomChildren" | "bottomPills" | "bottomMedicineCabinet" | "bottomMore";
  label: string;
  icon: ChildOverviewIconToken;
  active: boolean;
};

export type ChildOverviewPeriodOption = {
  id: "week" | "twoWeeks" | "month";
  label: string;
};

export type ChildOverviewCalendarDotKey =
  | "sleep"
  | "feeding"
  | "illness"
  | "weight"
  | "growth"
  | "secondary";

export type ChildOverviewCalendarDay = {
  id: string;
  day: number;
  muted: boolean;
  selected: boolean;
  dots: ChildOverviewCalendarDotKey[];
};

export type ChildOverviewCalendarMonth = {
  id: string;
  label: string;
  days: ChildOverviewCalendarDay[];
};

export type ChildOverviewCalendarStat = {
  id: string;
  icon: "calendar" | "star" | "clock";
  label: string;
  value: string;
  iconCircleBg: string;
};

export type ChildOverviewBarDatum = {
  id: string;
  icon: "feeding" | "illness" | "sleep" | "weight" | "growth";
  label: string;
  value: number;
  unit: "entries" | "episodes" | "sleeps" | "measurements";
  color: string;
  highlighted: boolean;
};

export type ChildOverviewScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  avatarSource: ImageSourcePropType | null;
  periodOptions: ChildOverviewPeriodOption[];
  summaryTitle: string;
  summaryInsights: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: ChildOverviewIconToken;
  }>;
  tabs: ChildOverviewTab[];
  filters: ChildOverviewFilter[];
  eventsTitle: string;
  events: ChildOverviewEventSection[];
  calendarAvailableMonthKeys: string[];
  calendarMonths: ChildOverviewCalendarMonth[];
  calendarWeekdays: string[];
  calendarDays: ChildOverviewCalendarDay[];
  calendarStats: ChildOverviewCalendarStat[];
  selectedDayHeader: string;
  selectedDayHint: string;
  selectedDayToggleHint: string;
  selectedDayEmptyLabel: string;
  selectedDayEntriesByDay: Record<string, ChildOverviewEventRow[]>;
  graphicsBarTitle: string;
  graphicsBarSubtitle: string;
  graphicsBarTotalLabel: string;
  graphicsBarPeakLabel: string;
  graphicsBarData: ChildOverviewBarDatum[];
  graphicsCategoryTitle: string;
  graphicsCategorySubtitle: string;
  calendarMonthSummaryTitle: string;
  calendarMonthSummaryHint: string;
  bottomNav: ChildOverviewBottomNavItem[];
  theme: ChildOverviewTheme;
  spacing: OverviewStyleGuide["spacingReference"] & {
    sideMarginPt: number;
    contentWidthPt: number;
    sectionGapPt: number;
    columnGapPt: number;
  };
};

const overviewTabs = [
  { id: "tab-feed", kind: "feed" as const, labelKey: "feed" as const },
  { id: "tab-calendar", kind: "calendar" as const, labelKey: "calendar" as const },
  { id: "tab-charts", kind: "charts" as const, labelKey: "charts" as const },
];

export function buildChildOverviewScreenContent(
  child: ChildCard,
  locale: MobileLocale,
  options?: {
    periodId?: ChildOverviewPeriodOption["id"];
    activeFilterId?: string;
    data?: ChildOverviewDataBundle;
    customRange?: DateRangeValue | null;
    visibleCalendarMonthKey?: string | null;
  },
): ChildOverviewScreenContent {
  const isRu = locale === "ru";
  const copy = getOverviewCopy(locale);
  const { components, colors, gradients, characterIllustration } = spec;
  const periodId = options?.periodId ?? "week";
  const activeFilterId = options?.activeFilterId ?? "filter-all";
  const data = options?.data;
  const customRange = options?.customRange ?? null;
  const visibleCalendarMonthKey = options?.visibleCalendarMonthKey ?? null;
  const liveOverview = buildLiveOverviewData(
    locale,
    copy,
    periodId,
    activeFilterId,
    data,
    customRange,
    visibleCalendarMonthKey,
  );
  const fallbackGraphics = buildFallbackGraphics(copy);

  return {
    backLabel: copy.backLabel,
    title: isRu
      ? replaceOverviewDemoName(components.heroHeader.title, child.name)
      : `${child.name} ${copy.titleSuffix}`,
    subtitle: isRu
      ? components.heroHeader.subtitle
      : copy.subtitle,
    avatarSource: child.avatarSource,
    periodOptions: buildOverviewPeriodOptions(copy),
    summaryTitle: resolveOverviewSummaryTitle(locale, copy, periodId, customRange),
    summaryInsights: liveOverview?.summaryInsights ?? buildFallbackSummaryInsights(locale, components),
    tabs: overviewTabs.map((item, index) => ({
      id: item.id,
      kind: item.kind,
      label: copy.tabs[item.labelKey],
      active: index === 0,
    })),
    filters: buildFallbackFilters(locale, components),
    eventsTitle: copy.eventsTitle,
    events: liveOverview?.events ?? buildFallbackEvents(locale, components),
    calendarAvailableMonthKeys: liveOverview?.calendarAvailableMonthKeys ?? [],
    calendarMonths: liveOverview?.calendarMonths ?? buildFallbackCalendarMonths(locale, calendarSpec),
    calendarWeekdays: buildFallbackCalendarWeekdays(locale, calendarSpec),
    calendarDays: liveOverview?.calendarDays ?? buildFallbackCalendarDays(calendarSpec),
    calendarStats: liveOverview?.calendarStats ?? buildFallbackCalendarStats(locale, copy, calendarSpec),
    selectedDayHeader: copy.selectedDayHeader,
    selectedDayHint: copy.selectedDayHint,
    selectedDayToggleHint: copy.selectedDayToggleHint,
    selectedDayEmptyLabel: copy.selectedDayEmptyLabel,
    selectedDayEntriesByDay: liveOverview?.selectedDayEntriesByDay ?? {},
    graphicsBarTitle: copy.graphics.title,
    graphicsBarSubtitle: copy.graphics.subtitle,
    graphicsBarTotalLabel:
      liveOverview?.graphicsBarTotalLabel ?? `${copy.graphics.totalPrefix}: ${fallbackGraphics.total}`,
    graphicsBarPeakLabel:
      liveOverview?.graphicsBarPeakLabel ??
      `${copy.graphics.peakPrefix}: ${fallbackGraphics.peak.label} · ${fallbackGraphics.peak.value}`,
    graphicsBarData: liveOverview?.graphicsBarData ?? fallbackGraphics.rows,
    graphicsCategoryTitle: copy.graphics.categoryTitle,
    graphicsCategorySubtitle: copy.graphics.categorySubtitle,
    calendarMonthSummaryTitle: copy.calendarMonthSummaryTitle,
    calendarMonthSummaryHint: copy.calendarMonthSummaryHint,
    bottomNav: components.bottomNavigation.items.map((item) => ({
      id:
        item.icon === "bottomChildren"
          ? "bottomChildren"
          : item.icon === "bottomPills"
            ? "bottomPills"
            : item.icon === "bottomMedicineCabinet"
              ? "bottomMedicineCabinet"
              : "bottomMore",
      label:
        item.icon === "bottomChildren"
          ? copy.bottomNav.children
          : item.icon === "bottomPills"
            ? copy.bottomNav.pills
            : item.icon === "bottomMedicineCabinet"
              ? copy.bottomNav.cabinet
              : copy.bottomNav.more,
      icon: overviewIconTokens[item.icon],
      active: Boolean(item.active),
    })),
    theme: {
      colors,
      screenBackground: gradients.screenBackground,
      selectedTabGradient: gradients.selectedTab,
      primaryButtonGradient: gradients.primaryCoralButton,
      avatarBlobColor: characterIllustration.blobColor,
      avatarDecoration: characterIllustration.decorations,
    },
    spacing: {
      ...spec.spacingReference,
      sideMarginPt: spec.canvas.layout.sideMarginPt,
      contentWidthPt: spec.canvas.layout.contentWidthPt,
      sectionGapPt: spec.canvas.layout.sectionGapPt,
      columnGapPt: spec.canvas.layout.columnGapPt,
    },
  };
}

function resolveOverviewSummaryTitle(
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
  periodId: ChildOverviewPeriodOption["id"],
  customRange: DateRangeValue | null,
) {
  if (customRange) {
    const daySpan = getInclusiveDaySpan(customRange);
    if (locale === "ru") return `Главное за ${daySpan} дн.`;
    if (locale === "pl") return `Najważniejsze z ${daySpan} dni`;
    if (locale === "de") return `Wichtigstes der letzten ${daySpan} Tage`;
    return `Highlights for ${daySpan} days`;
  }

  if (periodId === "twoWeeks") {
    if (locale === "ru") return "Главное за 14 дней";
    if (locale === "pl") return "Najważniejsze z 14 dni";
    if (locale === "de") return "Wichtigstes der letzten 14 Tage";
    return "Highlights for 14 days";
  }

  if (periodId === "month") {
    if (locale === "ru") return "Главное за 30 дней";
    if (locale === "pl") return "Najważniejsze z 30 dni";
    if (locale === "de") return "Wichtigstes der letzten 30 Tage";
    return "Highlights for 30 days";
  }

  return copy.summaryTitle;
}
