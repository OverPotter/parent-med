import { getOverviewCopy } from "./childOverviewCopy";
import type {
  ChildOverviewCalendarDotKey,
  ChildOverviewEventRow,
  ChildOverviewIconToken,
  ChildOverviewTab,
} from "./childOverviewScreen";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

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

type SelectedDayCalendarSpec = {
  components: {
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

export const overviewIconTokens = {
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

export function replaceOverviewDemoName(text: string, childName: string) {
  return text.replace(/Эдик/g, childName).replace(/Edik/g, childName);
}

export function getOverviewTabKind(label: string): ChildOverviewTab["kind"] {
  if (label === "Лента") {
    return "feed";
  }

  if (label === "Календарь") {
    return "calendar";
  }

  return "charts";
}

export function mapOverviewCalendarDotKey(
  dot: string,
): ChildOverviewCalendarDotKey {
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

export function mapOverviewSelectedDayEntries(
  locale: MobileLocale,
  calendarSpec: SelectedDayCalendarSpec,
): ChildOverviewEventRow[] {
  const copy = getOverviewCopy(locale);

  return calendarSpec.components.selectedDayCard.list.items.map((item, index) => ({
    id: `${item.type}-${item.time}-${index}`,
    category: item.type,
    time: item.time,
    type:
      item.title === "Болезнь"
        ? copy.eventTypes.illness
        : item.title === "Кормление"
          ? copy.eventTypes.feeding
          : copy.eventTypes.sleep,
    detail: item.subtitle
      .replace("Температура и наблюдение", copy.details.temperatureObservation)
      .replace("Грудь", copy.details.breast)
      .replace("мин", copy.details.zeroMin.replace(/^0\s*/, ""))
      .replace("ч", copy.details.hourShort),
    icon:
      item.type === "illness"
        ? overviewIconTokens.illness
        : item.type === "feeding"
          ? overviewIconTokens.feeding
          : overviewIconTokens.sleep,
  }));
}
