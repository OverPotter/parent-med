import { ImageSourcePropType } from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { overviewScreenSpecs } from "../../../redesign/screens/overview/specs";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  getOverviewCopy,
  translateOverviewBottomNavLabel,
  translateOverviewDetail,
  translateOverviewEventDate,
  translateOverviewEventType,
  translateOverviewFilter,
  translateOverviewInsightSubtitle,
  translateOverviewInsightTitle,
  translateOverviewMonth,
  translateOverviewSelectedDayHeader,
  translateOverviewSelectedDayHint,
  translateOverviewTab,
} from "./childOverviewCopy";
import {
  getOverviewTabKind,
  mapOverviewCalendarDotKey,
  mapOverviewSelectedDayEntries,
  overviewIconTokens,
  replaceOverviewDemoName,
} from "./childOverviewHelpers";

const overviewSpec = overviewScreenSpecs.childOverview;
const overviewCalendarSpec = overviewScreenSpecs.childOverviewCalendar;

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

type OverviewStyleGuide = {
  canvas: {
    layout: {
      sideMarginPt: number;
      contentWidthPt: number;
      sectionGapPt: number;
      columnGapPt: number;
    };
  };
  colors: {
    background: string;
    surface: string;
    surfaceAccent: string;
    stroke: string;
    textPrimary: string;
    textSecondary: string;
    accentCoral: string;
    accentCoralSoft: string;
    sleepPurple: string;
    feedingOrange: string;
    illnessPink: string;
    weightGreen: string;
    notesYellow: string;
    heightGreen: string;
    blueSoft: string;
    white: string;
  };
  gradients: {
    screenBackground: {
      type: "linear";
      angle: number;
      stops: Array<{ color: string; position: number }>;
    };
    selectedTab: {
      type: "linear";
      angle: number;
      stops: Array<{ color: string; position: number }>;
    };
    primaryCoralButton: {
      type: "linear";
      angle: number;
      stops: Array<{ color: string; position: number }>;
    };
  };
  components: {
    topBar: {
      backLink: { text: string; color: string };
      actions: { icons: string[] };
    };
    heroHeader: {
      title: string;
      subtitle: string;
    };
    summaryCard: {
      title: string;
      periodSelector: { text: string };
      insights: Array<{
        icon: OverviewIconKey;
        title: string;
        subtitle: string;
      }>;
    };
    quickCards: {
      items: Array<{
        label: string;
        value: string;
        caption: string;
        icon: OverviewIconKey;
      }>;
    };
    tabs: {
      items: string[];
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
      sectionTitle: string;
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
    bottomNavigation: {
      items: Array<{
        label: string;
        icon: OverviewIconKey;
        active?: boolean;
      }>;
    };
  };
  characterIllustration: {
    blobColor: string;
    decorations: {
      smallHeartColor: string;
      smallLeafColor: string;
      opacity: number;
    };
  };
  spacingReference: {
    screenPaddingHorizontalPt: number;
    headerTopFromSafeAreaPt: number;
    headerToSummaryCardPt: number;
    summaryCardToQuickCardsPt: number;
    quickCardsToTabsPt: number;
    tabsToFiltersPt: number;
    filtersToEventsTitlePt: number;
    eventsTitleToListPt: number;
    bottomNavFloatingMarginPt: number;
  };
};

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
  id: string;
  label: string;
  active: boolean;
  kind: "dropdown" | "chip";
  dotColor?: string;
};

export type ChildOverviewEventRow = {
  id: string;
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
  id: string;
  label: string;
  icon: ChildOverviewIconToken;
  active: boolean;
};

export type ChildOverviewPeriodOption = {
  id: "week" | "twoWeeks" | "month" | "customRange";
  label: string;
  helperLabel: string;
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
  calendarMonthLabel: string;
  calendarWeekdays: string[];
  calendarDays: ChildOverviewCalendarDay[];
  calendarStats: ChildOverviewCalendarStat[];
  selectedDayHeader: string;
  selectedDayHint: string;
  selectedDayToggleHint: string;
  selectedDayEmptyLabel: string;
  selectedDayEntries: ChildOverviewEventRow[];
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

const spec = overviewSpec as OverviewStyleGuide;
const calendarSpec = overviewCalendarSpec as {
  copy: {
    month: string;
    selectedDayHeader: string;
    selectedDayHint: string;
    addEntry: string;
    monthStats: Array<{ label: string; value: string }>;
  };
  colorTokens: {
    ["sleep/blue"]: string;
    ["feeding/orange"]: string;
    ["illness/pink"]: string;
    ["weight/teal"]: string;
    ["growth/green"]: string;
    ["purple/secondary"]: string;
  };
  components: {
    calendarCard: {
      legend: {
        items: Array<{ label: string; dotColor: string }>;
      };
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
    selectedDayCard: {
      list: {
        items: Array<{
          type: "illness" | "feeding" | "sleep";
          time: string;
          title: string;
          subtitle: string;
        }>;
      };
    };
  };
};
export function buildChildOverviewScreenContent(
  child: ChildCard,
  locale: MobileLocale,
): ChildOverviewScreenContent {
  const isRu = locale === "ru";
  const copy = getOverviewCopy(locale);
  const { components, colors, gradients, characterIllustration } = spec;
  const demoBarData = [
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
  const demoBarTotal = demoBarData.reduce((sum, item) => sum + item.value, 0);
  const demoBarPeak = demoBarData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    demoBarData[0],
  );

  return {
    backLabel: copy.backLabel,
    title: isRu
      ? replaceOverviewDemoName(components.heroHeader.title, child.name)
      : `${child.name} ${copy.titleSuffix}`,
    subtitle: isRu
      ? components.heroHeader.subtitle
      : copy.subtitle,
    avatarSource: child.avatarSource,
    periodOptions: [
      {
        id: "week",
        label: copy.periodLabels.week,
        helperLabel: copy.periodHelpers.week,
      },
      {
        id: "twoWeeks",
        label: copy.periodLabels.twoWeeks,
        helperLabel: copy.periodHelpers.twoWeeks,
      },
      {
        id: "month",
        label: copy.periodLabels.month,
        helperLabel: copy.periodHelpers.month,
      },
      {
        id: "customRange",
        label: copy.periodLabels.customRange,
        helperLabel: copy.periodHelpers.customRange,
      },
    ],
    summaryTitle: copy.summaryTitle,
    summaryInsights: components.summaryCard.insights.map((item) => ({
      id: `${item.icon}-${item.title}`,
      title: isRu ? item.title : translateOverviewInsightTitle(item.title, locale),
      subtitle: isRu ? item.subtitle : translateOverviewInsightSubtitle(item.subtitle, locale),
      icon: overviewIconTokens[item.icon],
    })),
    tabs: components.tabs.items.map((item, index) => ({
      id: item,
      kind: getOverviewTabKind(item),
      label: isRu ? item : translateOverviewTab(item, locale),
      active: index === 0,
    })),
    filters: components.filters.items
      .filter((item) => item.type !== "dropdown")
      .map((item) => ({
        id: `${item.type ?? "chip"}-${item.label}`,
        label: isRu ? item.label : translateOverviewFilter(item.label, locale),
        active: Boolean(item.active),
        kind: "chip" as const,
        dotColor: item.dotColor,
      })),
    eventsTitle: copy.eventsTitle,
    events: components.eventsList.items.map((section) => ({
      id: section.date,
      date: isRu ? section.date : translateOverviewEventDate(section.date, locale),
      rows: section.rows.map((row) => ({
        id: `${section.date}-${row.time}-${row.type}`,
        time: row.time,
        type: isRu ? row.type : translateOverviewEventType(row.type, locale),
        detail: isRu ? row.detail : translateOverviewDetail(row.detail, locale),
        icon: overviewIconTokens[row.icon],
      })),
    })),
    calendarMonthLabel: isRu
      ? calendarSpec.copy.month
      : translateOverviewMonth(calendarSpec.copy.month, locale),
    calendarWeekdays: isRu
      ? calendarSpec.components.calendarCard.weekdays.labels
      : locale === "pl"
        ? ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"]
        : locale === "de"
          ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    calendarDays: calendarSpec.components.calendarCard.grid.days.map((day, index) => ({
      id: `calendar-day-${index}-${day.day}`,
      day: day.day,
      muted: Boolean(day.muted),
      selected: Boolean(day.selected),
      dots: (day.dots ?? []).map(mapOverviewCalendarDotKey),
    })),
    calendarStats: calendarSpec.components.monthStatsCard.items.map((item, index) => ({
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
    })),
    selectedDayHeader: isRu
      ? calendarSpec.copy.selectedDayHeader
      : translateOverviewSelectedDayHeader(calendarSpec.copy.selectedDayHeader, locale),
    selectedDayHint: isRu
      ? calendarSpec.copy.selectedDayHint
      : translateOverviewSelectedDayHint(calendarSpec.copy.selectedDayHint, locale),
    selectedDayToggleHint: copy.selectedDayToggleHint,
    selectedDayEmptyLabel: copy.selectedDayEmptyLabel,
    selectedDayEntries: mapOverviewSelectedDayEntries(locale, calendarSpec),
    graphicsBarTitle: copy.graphics.title,
    graphicsBarSubtitle: copy.graphics.subtitle,
    graphicsBarTotalLabel: `${copy.graphics.totalPrefix}: ${demoBarTotal}`,
    graphicsBarPeakLabel: `${copy.graphics.peakPrefix}: ${demoBarPeak.label} · ${demoBarPeak.value}`,
    graphicsBarData: demoBarData.map((item, index) => ({
      id: `${item.label}-${index}`,
      icon: item.icon,
      label: item.label,
      value: item.value,
      unit: item.unit,
      color: item.color,
      highlighted: item.value === demoBarPeak.value && item.value > 0,
    })),
    graphicsCategoryTitle: copy.graphics.categoryTitle,
    graphicsCategorySubtitle: copy.graphics.categorySubtitle,
    calendarMonthSummaryTitle: copy.calendarMonthSummaryTitle,
    calendarMonthSummaryHint: copy.calendarMonthSummaryHint,
    bottomNav: components.bottomNavigation.items.map((item) => ({
      id: item.icon,
      label: isRu ? item.label : translateOverviewBottomNavLabel(item.label, locale),
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
