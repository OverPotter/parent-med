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
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    title: isRu ? "Разбор эпизода" : isDe ? "Episodendetails" : isPl ? "Szczegóły epizodu" : "Episode breakdown",
    subtitle: isRu
      ? "Подробная сводка по конкретному эпизоду."
      : isDe
        ? "Detaillierte Übersicht zu einer bestimmten Episode."
      : isPl
        ? "Szczegółowe podsumowanie konkretnego epizodu."
      : "Detailed summary for a specific episode.",
    childName: isRu ? "Эдик" : "Edik",
    childDate: isRu ? "3 мая" : isDe ? "3. Mai" : isPl ? "3 maja" : "May 3",
    episodeChipLabel: episode.meta.split("•")[0]?.trim() ?? episode.meta,
    summaryTitle: isRu ? "Кратко об эпизоде" : isDe ? "Kurz zur Episode" : isPl ? "Krótko o epizodzie" : "Episode summary",
    summaryLines: [
      isRu ? "Эпизод длился 1 день." : isDe ? "Die Episode dauerte 1 Tag." : isPl ? "Epizod trwał 1 dzień." : "The episode lasted 1 day.",
      isRu
        ? "Замеров температуры не было."
        : isDe
          ? "Es gab keine Temperaturmessungen."
        : isPl
          ? "Nie było pomiarów temperatury."
        : "There were no temperature readings.",
      isRu
        ? "Приёмы велись с напоминаниями."
        : isDe
          ? "Einnahmen wurden mit Erinnerungen erfasst."
        : isPl
          ? "Dawki były zapisywane z przypomnieniami."
        : "Doses were tracked with reminders.",
    ],
    infoCards: [
      {
        id: "duration",
        label: isRu ? "Длительность" : isDe ? "Dauer" : isPl ? "Czas trwania" : "Duration",
        value: isRu ? "1 день" : isDe ? "1 Tag" : isPl ? "1 dzień" : "1 day",
      },
      {
        id: "last-entry",
        label: isRu ? "Последняя запись" : isDe ? "Letzter Eintrag" : isPl ? "Ostatni wpis" : "Last entry",
        value: isRu ? "21:04 • 3 мая" : isDe ? "21:04 • 3. Mai" : isPl ? "21:04 • 3 maja" : "21:04 • May 3",
      },
    ],
    progressTitle: isRu ? "Ход эпизода" : isDe ? "Verlauf der Episode" : isPl ? "Przebieg epizodu" : "Episode progress",
    progressItems: [
      {
        id: "doses",
        value: "7",
        label: isRu ? "приёмов" : isDe ? "Einnahmen" : isPl ? "dawek" : "doses",
      },
      {
        id: "readings",
        value: "0",
        label: isRu ? "замеров" : isDe ? "Messungen" : isPl ? "pomiarów" : "readings",
      },
      {
        id: "mode",
        value: isRu ? "с" : isDe ? "mit" : isPl ? "z" : "with",
        label: isRu ? "напоминаниями" : isDe ? "Erinnerungen" : isPl ? "przypomnieniami" : "reminders",
      },
    ],
    temperatureTitle: isRu ? "Температура по эпизоду" : isDe ? "Temperatur in der Episode" : isPl ? "Temperatura w epizodzie" : "Episode temperature",
    temperatureEmptyState: isRu
      ? "Для этого эпизода ещё нет\nзамеров температуры."
      : isDe
        ? "Für diese Episode gibt es noch\nkeine Temperaturmessungen."
      : isPl
        ? "Dla tego epizodu nie ma jeszcze\npomiarów temperatury."
      : "There are no temperature\nreadings for this episode yet.",
  };
}
