import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileIllnessObservation } from "./illnessObservation";

export type IllnessJournalEntry = MobileIllnessObservation["entries"][number];

export type IllnessJournalEntrySection = {
  key: string;
  label: string;
  entries: IllnessJournalEntry[];
  sortValue: number;
};

export function formatIllnessEntryTime(
  createdAt: string,
  locale: MobileLocale,
) {
  const date = new Date(createdAt);

  return new Intl.DateTimeFormat(resolveTimelineLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatIllnessEntryDate(
  createdAt: string,
  locale: MobileLocale,
) {
  const date = new Date(createdAt);

  return new Intl.DateTimeFormat(resolveTimelineLocale(locale), {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function groupIllnessEntriesByDay(
  entries: IllnessJournalEntry[],
  locale: MobileLocale,
) {
  const now = new Date();
  const todayKey = buildDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = buildDayKey(yesterday);
  const groups = new Map<string, IllnessJournalEntrySection>();

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    const key = buildDayKey(date);
    const existing = groups.get(key);

    if (existing) {
      existing.entries.push(entry);
      continue;
    }

    groups.set(key, {
      key,
      label: formatIllnessEntryDayLabel(date, key, todayKey, yesterdayKey, locale),
      sortValue: date.getTime(),
      entries: [entry],
    });
  }

  return Array.from(groups.values()).sort(
    (left, right) => right.sortValue - left.sortValue,
  );
}

function buildDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatIllnessEntryDayLabel(
  date: Date,
  key: string,
  todayKey: string,
  yesterdayKey: string,
  locale: MobileLocale,
) {
  if (key === todayKey) {
    if (locale === "ru") return "Сегодня";
    if (locale === "de") return "Heute";
    if (locale === "pl") return "Dzisiaj";
    return "Today";
  }

  if (key === yesterdayKey) {
    if (locale === "ru") return "Вчера";
    if (locale === "de") return "Gestern";
    if (locale === "pl") return "Wczoraj";
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(resolveTimelineLocale(locale), {
    day: "numeric",
    month: "long",
  }).format(date);
}

function resolveTimelineLocale(locale: MobileLocale) {
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  if (locale === "ru") return "ru-RU";
  return "en-US";
}
