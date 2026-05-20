import { overviewScreenSpecs } from "../../../redesign/screens/overview/specs";

export type OverviewIconKey =
  | "sleep"
  | "feeding"
  | "illness"
  | "weightHeight"
  | "notes"
  | "bottomChildren"
  | "bottomPills"
  | "bottomMedicineCabinet"
  | "bottomMore";

export type OverviewStyleGuide = {
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

export type OverviewCalendarSpec = {
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

export const overviewSpec = overviewScreenSpecs.childOverview as OverviewStyleGuide;
export const overviewCalendarSpec =
  overviewScreenSpecs.childOverviewCalendar as OverviewCalendarSpec;
