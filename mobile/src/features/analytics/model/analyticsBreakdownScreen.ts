import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { AnalyticsEpisodeCard } from "./analyticsScreen";

export type AnalyticsBreakdownInfoCard = {
  id: string;
  label: string;
  value: string;
};

export type AnalyticsBreakdownProgressItem = {
  id: string;
  value: string;
  label: string;
};

export type AnalyticsBreakdownContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  childName: string;
  childDate: string;
  episodeChipLabel: string;
  summaryTitle: string;
  summaryLines: string[];
  infoCards: AnalyticsBreakdownInfoCard[];
  progressTitle: string;
  progressItems: AnalyticsBreakdownProgressItem[];
  temperatureTitle: string;
  temperatureEmptyState: string;
};

export function buildAnalyticsBreakdownContent(
  episode: AnalyticsEpisodeCard,
  locale: MobileLocale,
): AnalyticsBreakdownContent {
  const isRu = locale === "ru";

  return {
    backLabel: isRu ? "Назад" : "Back",
    title: isRu ? "Разбор эпизода" : "Episode breakdown",
    subtitle: isRu
      ? "Подробная сводка по конкретному эпизоду."
      : "Detailed summary for a specific episode.",
    childName: isRu ? "Эдик" : "Edik",
    childDate: isRu ? "3 мая" : "May 3",
    episodeChipLabel: episode.meta.split("•")[0]?.trim() ?? episode.meta,
    summaryTitle: isRu ? "Кратко об эпизоде" : "Episode summary",
    summaryLines: [
      isRu ? "Эпизод длился 1 день." : "The episode lasted 1 day.",
      isRu
        ? "Замеров температуры не было."
        : "There were no temperature readings.",
      isRu
        ? "Приёмы велись с напоминаниями."
        : "Doses were tracked with reminders.",
    ],
    infoCards: [
      {
        id: "duration",
        label: isRu ? "Длительность" : "Duration",
        value: isRu ? "1 день" : "1 day",
      },
      {
        id: "last-entry",
        label: isRu ? "Последняя запись" : "Last entry",
        value: isRu ? "21:04 • 3 мая" : "21:04 • May 3",
      },
    ],
    progressTitle: isRu ? "Ход эпизода" : "Episode progress",
    progressItems: [
      {
        id: "doses",
        value: "7",
        label: isRu ? "приёмов" : "doses",
      },
      {
        id: "readings",
        value: "0",
        label: isRu ? "замеров" : "readings",
      },
      {
        id: "mode",
        value: isRu ? "с" : "with",
        label: isRu ? "напоминаниями" : "reminders",
      },
    ],
    temperatureTitle: isRu ? "Температура по эпизоду" : "Episode temperature",
    temperatureEmptyState: isRu
      ? "Для этого эпизода ещё нет\nзамеров температуры."
      : "There are no temperature\nreadings for this episode yet.",
  };
}
