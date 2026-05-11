import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { ChildCard } from "../../children/model/childrenRedesign";
import type { MobileIllnessEpisodeInsights } from "../../illness/api/illnessAnalyticsApi";
import { AnalyticsEpisodeCard } from "./analyticsScreen";

export type AnalyticsBreakdownSummaryTip = {
  id: string;
  text: string;
  icon: "duration" | "medicine" | "temperature" | "mode";
  accent: {
    background: string;
    border: string;
    iconBackground: string;
    iconColor: string;
  };
};

export type AnalyticsBreakdownContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  childName: string;
  childDate: string;
  episodeChipLabel: string;
  summaryLines: string[];
  summaryTips: AnalyticsBreakdownSummaryTip[];
  temperatureTitle: string;
  temperatureEmptyState: string;
};

export function buildAnalyticsBreakdownContent(
  episode: AnalyticsEpisodeCard,
  locale: MobileLocale,
  options?: {
    child?: ChildCard;
    insights?: MobileIllnessEpisodeInsights | null;
  },
): AnalyticsBreakdownContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const child = options?.child;
  const insights = options?.insights ?? null;
  const childDate = episode.startedAt
    ? new Date(episode.startedAt)
    : episode.closedAtIso
      ? new Date(episode.closedAtIso)
      : null;
  const childDateLabel = childDate && !Number.isNaN(childDate.getTime())
    ? childDate.toLocaleDateString(
        locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : locale === "pl" ? "pl-PL" : "en-US",
        { day: "numeric", month: "long" },
      )
    : "—";
  const peakLine = insights?.peakTemperatureCelsius != null
    ? isRu
      ? `Пик температуры: ${insights.peakTemperatureCelsius.toFixed(1)}°C.`
      : isDe
        ? `Temperaturspitze: ${insights.peakTemperatureCelsius.toFixed(1)}°C.`
        : isPl
          ? `Szczyt temperatury: ${insights.peakTemperatureCelsius.toFixed(1)}°C.`
          : `Peak temperature: ${insights.peakTemperatureCelsius.toFixed(1)}°C.`
    : null;
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
    childName: child?.name ?? "—",
    childDate: childDateLabel,
    episodeChipLabel: episode.meta.split("•")[0]?.trim() ?? episode.meta,
    summaryLines: peakLine ? [peakLine] : [],
    summaryTips: [
      {
        id: "duration",
        text: insights
          ? (isRu ? `${insights.durationDays} дн.` : isDe ? `${insights.durationDays} Tage` : isPl ? `${insights.durationDays} dni` : `${insights.durationDays} days`)
          : "—",
        icon: "duration",
        accent: {
          background: "#FFF7F1",
          border: "#F0D8CA",
          iconBackground: "#FCE9DE",
          iconColor: "#CC8B67",
        },
      },
      {
        id: "doses",
        text: insights
          ? (isRu
              ? `${insights.administrationCount} приёмов`
              : isDe
                ? `${insights.administrationCount} Einnahmen`
                : isPl
                  ? `${insights.administrationCount} dawek`
                  : `${insights.administrationCount} doses`)
          : isRu
            ? "0 приёмов"
            : isDe
              ? "0 Einnahmen"
              : isPl
                ? "0 dawek"
                : "0 doses",
        icon: "medicine",
        accent: {
          background: "#FEF4EA",
          border: "#F3D1BF",
          iconBackground: "#F9E0CC",
          iconColor: "#D98659",
        },
      },
      {
        id: "readings",
        text: insights
          ? String(insights.temperatureCount)
          : "0",
        icon: "temperature",
        accent: {
          background: "#FEF0EE",
          border: "#F4CDC6",
          iconBackground: "#FAD8D2",
          iconColor: "#E27C6D",
        },
      },
      {
        id: "mode",
        text: insights
          ? (insights.medicationMode === "guided"
              ? (isRu ? "1 напоминание" : isDe ? "1 Erinnerung" : isPl ? "1 przypomnienie" : "1 reminder")
              : (isRu ? "0 напоминаний" : isDe ? "0 Erinnerungen" : isPl ? "0 przypomnień" : "0 reminders"))
          : isRu
            ? "0 напоминаний"
            : isDe
              ? "0 Erinnerungen"
              : isPl
                ? "0 przypomnień"
                : "0 reminders",
        icon: "mode",
        accent: {
          background: "#F6F0FF",
          border: "#DDD0F8",
          iconBackground: "#E5D8FF",
          iconColor: "#8B6CD9",
        },
      },
    ],
    temperatureTitle: isRu ? "Температура по эпизоду" : isDe ? "Temperatur in der Episode" : isPl ? "Temperatura w epizodzie" : "Episode temperature",
    temperatureEmptyState: insights && insights.temperatureCount > 0
      ? isRu
        ? `Замеров: ${insights.temperatureCount}. Последний: ${insights.lastTemperatureCelsius?.toFixed(1) ?? "—"}°C.`
        : isDe
          ? `Messungen: ${insights.temperatureCount}. Letzter Wert: ${insights.lastTemperatureCelsius?.toFixed(1) ?? "—"}°C.`
          : isPl
            ? `Pomiary: ${insights.temperatureCount}. Ostatni wynik: ${insights.lastTemperatureCelsius?.toFixed(1) ?? "—"}°C.`
            : `Readings: ${insights.temperatureCount}. Last value: ${insights.lastTemperatureCelsius?.toFixed(1) ?? "—"}°C.`
      : isRu
        ? "Для этого эпизода не было\nзамеров температуры."
        : isDe
          ? "Für diese Episode gab es\nkeine Temperaturmessungen."
          : isPl
            ? "Dla tego epizodu nie było\npomiarów temperatury."
            : "There were no temperature\nreadings for this episode.",
  };
}
