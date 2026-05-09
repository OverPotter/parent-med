import { ImageSourcePropType } from "react-native";
import { ChildCard } from "../../children/model/childrenRedesign";
import { overviewScreenSpecs } from "../../../redesign/screens/overview/specs";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";

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
  avatarSource: ImageSourcePropType;
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
  selectedDayEntries: ChildOverviewEventRow[];
  graphicsBarTitle: string;
  graphicsBarSubtitle: string;
  graphicsBarTotalLabel: string;
  graphicsBarPeakLabel: string;
  graphicsBarData: ChildOverviewBarDatum[];
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
const iconTokens = {
  sleep: {
    key: "sleep",
    label: "Сон",
    symbol: "moon with small stars",
    color: "#8C6DDA",
    background: "#EFE9FF",
  },
  feeding: {
    key: "feeding",
    label: "Кормление",
    symbol: "baby bottle",
    color: "#F6A24D",
    background: "#FFF1E4",
  },
  illness: {
    key: "illness",
    label: "Болезни",
    symbol: "thermometer",
    color: "#F58E97",
    background: "#FFE8EA",
  },
  weightHeight: {
    key: "weightHeight",
    label: "Вес/Рост",
    symbol: "scale or height ruler",
    color: "#8BCB73",
    background: "#E9F7E5",
  },
  notes: {
    key: "notes",
    label: "Наблюдения",
    symbol: "clipboard",
    color: "#F2C85B",
    background: "#FFF6D8",
  },
  bottomChildren: {
    key: "bottomChildren",
    label: "Дети",
    symbol: "baby face",
    color: "#FF7E6B",
    background: "#FFE6E0",
  },
  bottomPills: {
    key: "bottomPills",
    label: "Таблетки",
    symbol: "pill",
    color: "#587088",
    background: "#EEF3F8",
  },
  bottomMedicineCabinet: {
    key: "bottomMedicineCabinet",
    label: "Аптечка",
    symbol: "medical bag",
    color: "#587088",
    background: "#EEF3F8",
  },
  bottomMore: {
    key: "bottomMore",
    label: "Ещё",
    symbol: "menu",
    color: "#587088",
    background: "#EEF3F8",
  },
} satisfies Record<OverviewIconKey, ChildOverviewIconToken>;

function replaceEdik(text: string, childName: string) {
  return text.replace(/Эдик/g, childName).replace(/Edik/g, childName);
}

function stripBackArrow(text: string) {
  return text.replace(/^←\s*/, "");
}

function translateTab(label: string) {
  if (label === "Лента") {
    return "Feed";
  }

  if (label === "Календарь") {
    return "Calendar";
  }

  return "Charts";
}

function getOverviewTabKind(label: string): ChildOverviewTab["kind"] {
  if (label === "Лента") {
    return "feed";
  }

  if (label === "Календарь") {
    return "calendar";
  }

  return "charts";
}

function translateFilter(label: string) {
  if (label === "7 дней") {
    return "7 days";
  }

  if (label === "Все") {
    return "All";
  }

  if (label === "Сон") {
    return "Sleep";
  }

  if (label === "Кормление") {
    return "Feeding";
  }

  if (label === "Болезни") {
    return "Illness";
  }

  if (label === "Вес") {
    return "Weight";
  }

  return "Height";
}

function translateEventDate(label: string) {
  if (label === "Сегодня") {
    return "Today";
  }

  return "May 3";
}

function translateEventType(label: string) {
  if (label === "Кормление") {
    return "Feeding";
  }

  if (label === "Сон") {
    return "Sleep";
  }

  return "Illness";
}

function translateDetail(label: string) {
  if (label === "грудь") {
    return "breast";
  }

  if (label === "0 мин") {
    return "0 min";
  }

  return "temperature and observation";
}

function translateBottomNavLabel(label: string) {
  if (label === "Дети") {
    return "Children";
  }

  if (label === "Таблетки") {
    return "Pills";
  }

  if (label === "Аптечка") {
    return "Cabinet";
  }

  return "More";
}

function translateMonth(label: string) {
  return label === "Май 2026 г." ? "May 2026" : label;
}

function translateSelectedDayHeader(label: string) {
  return label === "Записи за 3 мая" ? "Entries for May 3" : label;
}

function translateSelectedDayHint(label: string) {
  return label === "Нажмите на день, чтобы сменить выбор."
    ? "Tap a day to change the selection."
    : label;
}

function mapCalendarDotKey(dot: string): ChildOverviewCalendarDotKey {
  if (dot === "sleep/blue") {
    return "sleep";
  }

  if (dot === "feeding/orange") {
    return "feeding";
  }

  if (dot === "illness/pink") {
    return "illness";
  }

  if (dot === "weight/teal") {
    return "weight";
  }

  if (dot === "growth/green") {
    return "growth";
  }

  return "secondary";
}

function mapSelectedDayEntries(locale: MobileLocale) {
  const isRu = locale === "ru";

  return calendarSpec.components.selectedDayCard.list.items.map((item, index) => ({
    id: `${item.type}-${item.time}-${index}`,
    time: item.time,
    type: isRu
      ? item.title
      : item.title === "Болезнь"
        ? "Illness"
        : item.title === "Кормление"
          ? "Feeding"
          : "Sleep",
    detail: isRu
      ? item.subtitle
      : item.subtitle
          .replace("Температура и наблюдение", "Temperature and observation")
          .replace("Грудь", "Breast")
          .replace("мин", "min")
          .replace("ч", "h"),
    icon:
      item.type === "illness"
        ? iconTokens.illness
        : item.type === "feeding"
          ? iconTokens.feeding
          : iconTokens.sleep,
  }));
}

function translateInsightTitle(label: string) {
  if (label === "Болезни — 2 эпизода") {
    return "Illnesses — 2 episodes";
  }

  if (label === "Кормление — 1 запись") {
    return "Feeding — 1 record";
  }

  if (label === "Сон — пока нет данных") {
    return "Sleep — no data yet";
  }

  return "Height and weight — no new records";
}

function translateInsightSubtitle(label: string) {
  if (label === "температура и наблюдение") {
    return "temperature and observation";
  }

  if (label === "грудь") {
    return "breast";
  }

  if (label === "добавьте, чтобы следить") {
    return "add records to track it";
  }

  return "nothing new was added";
}

export function buildChildOverviewScreenContent(
  child: ChildCard,
  locale: MobileLocale,
): ChildOverviewScreenContent {
  const isRu = locale === "ru";
  const { components, colors, gradients, characterIllustration } = spec;
  const demoBarData = [
    {
      icon: "feeding" as const,
      label: isRu ? "Кормление" : "Feeding",
      value: 4,
      unit: "entries" as const,
      color: "#F7A14C",
    },
    {
      icon: "illness" as const,
      label: isRu ? "Болезни" : "Illness",
      value: 2,
      unit: "episodes" as const,
      color: "#F58E97",
    },
    {
      icon: "sleep" as const,
      label: isRu ? "Сон" : "Sleep",
      value: 3,
      unit: "sleeps" as const,
      color: "#8B74D9",
    },
    {
      icon: "weight" as const,
      label: isRu ? "Вес" : "Weight",
      value: 1,
      unit: "measurements" as const,
      color: "#39C0A6",
    },
    {
      icon: "growth" as const,
      label: isRu ? "Рост" : "Growth",
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
    backLabel: isRu
      ? stripBackArrow(components.topBar.backLink.text)
      : "Back to child profile",
    title: isRu
      ? replaceEdik(components.heroHeader.title, child.name)
      : `${child.name} overview`,
    subtitle: isRu
      ? components.heroHeader.subtitle
      : "Quickly understand what happened with your child during the selected period.",
    avatarSource: child.avatarSource,
    periodOptions: [
      {
        id: "week",
        label: isRu ? "7 дней" : "7 days",
        helperLabel: isRu ? "Сводка за последние 7 дней." : "Summary for the last 7 days.",
      },
      {
        id: "twoWeeks",
        label: isRu ? "14 дней" : "14 days",
        helperLabel: isRu ? "Сводка за последние 14 дней." : "Summary for the last 14 days.",
      },
      {
        id: "month",
        label: isRu ? "30 дней" : "30 days",
        helperLabel: isRu ? "Сводка за последние 30 дней." : "Summary for the last 30 days.",
      },
      {
        id: "customRange",
        label: isRu ? "Свой период" : "Custom range",
        helperLabel: isRu
          ? "Выберите диапазон дат вручную."
          : "Choose a custom date range.",
      },
    ],
    summaryTitle: isRu
      ? components.summaryCard.title
      : "Highlights for 7 days",
    summaryInsights: components.summaryCard.insights.map((item) => ({
      id: `${item.icon}-${item.title}`,
      title: isRu ? item.title : translateInsightTitle(item.title),
      subtitle: isRu ? item.subtitle : translateInsightSubtitle(item.subtitle),
      icon: iconTokens[item.icon],
    })),
    tabs: components.tabs.items.map((item, index) => ({
      id: item,
      kind: getOverviewTabKind(item),
      label: isRu ? item : translateTab(item),
      active: index === 0,
    })),
    filters: components.filters.items
      .filter((item) => item.type !== "dropdown")
      .map((item) => ({
        id: `${item.type ?? "chip"}-${item.label}`,
        label: isRu ? item.label : translateFilter(item.label),
        active: Boolean(item.active),
        kind: "chip" as const,
        dotColor: item.dotColor,
      })),
    eventsTitle: isRu ? components.eventsList.sectionTitle : "Events",
    events: components.eventsList.items.map((section) => ({
      id: section.date,
      date: isRu ? section.date : translateEventDate(section.date),
      rows: section.rows.map((row) => ({
        id: `${section.date}-${row.time}-${row.type}`,
        time: row.time,
        type: isRu ? row.type : translateEventType(row.type),
        detail: isRu ? row.detail : translateDetail(row.detail),
        icon: iconTokens[row.icon],
      })),
    })),
    calendarMonthLabel: isRu
      ? calendarSpec.copy.month
      : translateMonth(calendarSpec.copy.month),
    calendarWeekdays: calendarSpec.components.calendarCard.weekdays.labels,
    calendarDays: calendarSpec.components.calendarCard.grid.days.map((day, index) => ({
      id: `calendar-day-${index}-${day.day}`,
      day: day.day,
      muted: Boolean(day.muted),
      selected: Boolean(day.selected),
      dots: (day.dots ?? []).map(mapCalendarDotKey),
    })),
    calendarStats: calendarSpec.components.monthStatsCard.items.map((item, index) => ({
      id: `${item.icon}-${index}`,
      icon: item.icon,
      label: isRu
        ? item.label
        : item.label === "Активные дни"
          ? "Active days"
          : item.label === "Чаще всего"
            ? "Most often"
            : "Latest entry",
      value: isRu
        ? item.value
        : item.value === "Кормление"
          ? "Feeding"
          : item.value === "3 мая"
            ? "May 3"
            : item.value,
      iconCircleBg: item.iconCircleBg,
    })),
    selectedDayHeader: isRu
      ? calendarSpec.copy.selectedDayHeader
      : translateSelectedDayHeader(calendarSpec.copy.selectedDayHeader),
    selectedDayHint: isRu
      ? calendarSpec.copy.selectedDayHint
      : translateSelectedDayHint(calendarSpec.copy.selectedDayHint),
    selectedDayEntries: mapSelectedDayEntries(locale),
    graphicsBarTitle: isRu ? "Что отмечали чаще" : "What was logged most often",
    graphicsBarSubtitle: isRu
      ? "Чем длиннее полоса, тем чаще эта категория встречалась за период."
      : "The longer the bar, the more often this category appeared in the selected period.",
    graphicsBarTotalLabel: isRu
      ? `Всего событий: ${demoBarTotal}`
      : `Total events: ${demoBarTotal}`,
    graphicsBarPeakLabel: isRu
      ? `Лидер периода: ${demoBarPeak.label} · ${demoBarPeak.value}`
      : `Top category: ${demoBarPeak.label} · ${demoBarPeak.value}`,
    graphicsBarData: demoBarData.map((item, index) => ({
      id: `${item.label}-${index}`,
      icon: item.icon,
      label: item.label,
      value: item.value,
      unit: item.unit,
      color: item.color,
      highlighted: item.value === demoBarPeak.value && item.value > 0,
    })),
    bottomNav: components.bottomNavigation.items.map((item) => ({
      id: item.icon,
      label: isRu ? item.label : translateBottomNavLabel(item.label),
      icon: iconTokens[item.icon],
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
