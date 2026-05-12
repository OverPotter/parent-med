import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { getOverviewCopy } from "./childOverviewCopy";
import type {
  ChildOverviewCalendarDay,
  ChildOverviewCalendarDotKey,
  ChildOverviewCalendarMonth,
  ChildOverviewCalendarStat,
  ChildOverviewEventRow,
  ChildOverviewEventSection,
  ChildOverviewIconToken,
} from "./childOverviewScreen";

export type ChildOverviewTimestampedEvent = ChildOverviewEventRow & {
  timestamp: number;
  dayKey: string;
};

export type ChildOverviewCalendarData = {
  availableMonthKeys: string[];
  visibleMonthStart: Date;
  months: ChildOverviewCalendarMonth[];
  days: ChildOverviewCalendarDay[];
  entriesByDay: Record<string, ChildOverviewEventRow[]>;
  stats: ChildOverviewCalendarStat[];
};

export function buildOverviewEvent(
  iso: string,
  locale: MobileLocale,
  type: string,
  detail: string,
  icon: ChildOverviewIconToken,
): ChildOverviewTimestampedEvent {
  const date = new Date(iso);
  return {
    id: `${type}-${iso}`,
    time: Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleTimeString(resolveOverviewLocale(locale), {
          hour: "2-digit",
          minute: "2-digit",
        }),
    type,
    detail,
    icon,
    timestamp: Number.isNaN(date.getTime()) ? 0 : date.getTime(),
    dayKey: Number.isNaN(date.getTime()) ? "" : buildDayKey(date),
  };
}

export function groupOverviewEventsByDay(
  items: ChildOverviewTimestampedEvent[],
  locale: MobileLocale,
): ChildOverviewEventSection[] {
  const grouped = new Map<string, ChildOverviewEventRow[]>();

  items.slice(0, 24).forEach((item) => {
    const rows = grouped.get(item.dayKey) ?? [];
    rows.push(item);
    grouped.set(item.dayKey, rows);
  });

  return Array.from(grouped.entries()).map(([dayKey, rows]) => ({
    id: dayKey,
    date: formatOverviewDateLabel(dayKey, locale),
    rows,
  }));
}

export function buildOverviewCalendarData(
  locale: MobileLocale,
  copy: ReturnType<typeof getOverviewCopy>,
  events: ChildOverviewTimestampedEvent[],
  periodStart: Date | null,
  periodEnd: Date,
  visibleCalendarMonthKey?: string | null,
): ChildOverviewCalendarData {
  const visibleMonthStart = periodStart
    ? new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
    : new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
  const visibleMonthEnd = new Date(
    periodEnd.getFullYear(),
    periodEnd.getMonth(),
    1,
  );
  const entriesByDay = new Map<string, ChildOverviewEventRow[]>();
  const dotsByDay = new Map<string, Set<ChildOverviewCalendarDotKey>>();
  const requestedVisibleMonth = visibleCalendarMonthKey
    ? parseOverviewMonthKey(visibleCalendarMonthKey)
    : null;
  const fallbackVisibleMonth = visibleMonthEnd;
  const normalizedRequestedMonth = requestedVisibleMonth ?? fallbackVisibleMonth;
  const primaryVisibleMonth =
    normalizedRequestedMonth.getTime() > visibleMonthEnd.getTime()
      ? visibleMonthEnd
      : normalizedRequestedMonth;
  const primaryMonthKey = buildOverviewMonthKey(primaryVisibleMonth);

  events.forEach((item) => {
    const date = new Date(item.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const dayKey = buildDayKey(date);
    const monthKey = buildOverviewMonthKey(date);
    if (monthKey !== primaryMonthKey) {
      return;
    }

    const rows = entriesByDay.get(dayKey) ?? [];
    rows.push(item);
    entriesByDay.set(dayKey, rows);

    const dots = dotsByDay.get(dayKey) ?? new Set<ChildOverviewCalendarDotKey>();
    dots.add(mapTypeToCalendarDot(item.type, copy));
    dotsByDay.set(dayKey, dots);
  });

  const months = [buildOverviewCalendarMonth(primaryMonthKey, 0, locale, dotsByDay)];
  const days = months.flatMap((month) => month.days);
  const activeDays = Array.from(entriesByDay.keys()).length;
  const categoryCounts = new Map<string, number>();
  events.forEach((item) => {
    categoryCounts.set(item.type, (categoryCounts.get(item.type) ?? 0) + 1);
  });
  const topCategory =
    Array.from(categoryCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    copy.filters.feeding;
  const latestEvent = events[0];

  return {
    availableMonthKeys: [primaryMonthKey],
    visibleMonthStart: primaryVisibleMonth,
    months,
    days,
    entriesByDay: Object.fromEntries(
      Array.from(entriesByDay.entries()).map(([dayKey, rows]) => [dayKey, rows]),
    ) as Record<string, ChildOverviewEventRow[]>,
    stats: [
      {
        id: "active-days",
        icon: "calendar",
        label: copy.calendarStats.activeDays,
        value: String(activeDays),
        iconCircleBg: "#FFF0E6",
      },
      {
        id: "top-category",
        icon: "star",
        label: copy.calendarStats.mostOften,
        value: topCategory,
        iconCircleBg: "#FFF4DD",
      },
      {
        id: "latest-event",
        icon: "clock",
        label: copy.calendarStats.latestEntry,
        value: latestEvent ? formatOverviewShortDay(latestEvent.timestamp, locale) : "—",
        iconCircleBg: "#EAF4FF",
      },
    ],
  };
}

export function startOfOverviewMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildOverviewMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseOverviewMonthKey(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return new Date();
  }

  const [, year, month] = match;
  return new Date(Number(year), Number(month) - 1, 1);
}

function mapTypeToCalendarDot(
  type: string,
  copy: ReturnType<typeof getOverviewCopy>,
): ChildOverviewCalendarDotKey {
  if (type === copy.eventTypes.sleep) return "sleep";
  if (type === copy.eventTypes.feeding) return "feeding";
  if (type === copy.eventTypes.illness) return "illness";
  if (type === copy.filters.weight) return "weight";
  if (type === copy.filters.height) return "growth";
  return "secondary";
}

function formatOverviewMonthLabel(date: Date, locale: MobileLocale) {
  return new Intl.DateTimeFormat(resolveOverviewLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatOverviewDateLabel(dayKey: string, locale: MobileLocale) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const todayKey = buildDayKey(today);
  if (dayKey === todayKey) {
    return getOverviewCopy(locale).dates.today;
  }
  return new Intl.DateTimeFormat(resolveOverviewLocale(locale), {
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatOverviewShortDay(timestamp: number, locale: MobileLocale) {
  return new Intl.DateTimeFormat(resolveOverviewLocale(locale), {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function buildDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildOverviewMutedCalendarDay(id: string): ChildOverviewCalendarDay {
  return {
    id,
    day: 0,
    muted: true,
    selected: false,
    dots: [],
  };
}

function buildOverviewCalendarMonth(
  monthKey: string,
  monthIndex: number,
  locale: MobileLocale,
  dotsByDay: Map<string, Set<ChildOverviewCalendarDotKey>>,
): ChildOverviewCalendarMonth {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();
  const monthStartWeekdayIndex = (monthStart.getDay() + 6) % 7;
  const leadingMutedDays = Array.from({ length: monthStartWeekdayIndex }, (_, index) =>
    buildOverviewMutedCalendarDay(`${monthKey}-leading-${index}`),
  );
  const visibleDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const dayKey = buildDayKey(date);
    return {
      id: dayKey,
      day,
      muted: false,
      selected: false,
      dots: Array.from(dotsByDay.get(dayKey) ?? []),
    };
  });
  const trailingMutedCount =
    (7 - ((leadingMutedDays.length + visibleDays.length) % 7 || 7)) % 7;
  const trailingMutedDays = Array.from({ length: trailingMutedCount }, (_, index) =>
    buildOverviewMutedCalendarDay(`${monthKey}-trailing-${index}`),
  );

  return {
    id: `${monthKey}-${monthIndex}`,
    label: formatOverviewMonthLabel(monthStart, locale),
    days: [...leadingMutedDays, ...visibleDays, ...trailingMutedDays],
  };
}

function resolveOverviewLocale(locale: MobileLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}
