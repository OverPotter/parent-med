import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileIllnessEpisode, MobileIllnessHistorySummary } from "../../illness/api/illnessAnalyticsApi";

export type AnalyticsInsightItem = {
  id: string;
  icon: "completed" | "activeMonth" | "medicine";
  title: string;
  subtitle: string;
};

export type AnalyticsPeriodOption = {
  id: "month" | "quarter" | "halfYear" | "year" | "allTime";
  label: string;
};

export type AnalyticsDeleteDialogCopy = {
  title: string;
  description: string;
  cancel: string;
  confirm: string;
};

export type AnalyticsEpisodeCard = {
  id: string;
  monthLabel: string;
  dayLabel: string;
  meta: string;
  title: string;
  closedAt: string;
  description: string;
  startedAt: string | null;
  closedAtIso: string | null;
};

export type AnalyticsHighlightCard = {
  id: string;
  label: string;
  value: string;
  icon: "duration" | "longest";
  accent: {
    background: string;
    border: string;
    iconBackground: string;
    iconColor: string;
  };
};

export type AnalyticsScreenContent = {
  backLabel: string;
  subtitle: string;
  periodOptions: AnalyticsPeriodOption[];
  deleteActionLabel: string;
  deleteDialog: AnalyticsDeleteDialogCopy;
  mainSummaryTitle: string;
  mainSummaryInsights: AnalyticsInsightItem[];
  highlights: AnalyticsHighlightCard[];
  episodesTitle: string;
  episodesHelper: string;
  episodes: AnalyticsEpisodeCard[];
};

function formatMonthLabel(value: string | null, locale: MobileLocale) {
  if (!value) {
    return "—";
  }

  const next = new Date(value);
  if (Number.isNaN(next.getTime())) {
    return "—";
  }

  if (locale === "ru") {
    const label = next.toLocaleDateString("ru-RU", { month: "short" });
    return label.replace(".", "").replace(/^\p{L}/u, (char) => char.toUpperCase());
  }
  if (locale === "de") {
    const label = next.toLocaleDateString("de-DE", { month: "short" });
    return label.replace(".", "");
  }
  if (locale === "pl") {
    return next.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "");
  }
  return next.toLocaleDateString("en-US", { month: "short" });
}

function formatDayLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  const next = new Date(value);
  if (Number.isNaN(next.getTime())) {
    return "—";
  }

  return String(next.getDate());
}

function formatClosedAtLabel(value: string | null, locale: MobileLocale) {
  if (!value) {
    return locale === "ru"
      ? "Не закрыт"
      : locale === "de"
        ? "Nicht abgeschlossen"
        : locale === "pl"
          ? "Nie zamknięto"
          : "Not closed";
  }

  const next = new Date(value);
  if (Number.isNaN(next.getTime())) {
    return value;
  }

  const time = next.toLocaleTimeString(locale === "de" ? "de-DE" : locale === "pl" ? "pl-PL" : locale === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (locale === "ru") return `Закрыт ${time}`;
  if (locale === "de") return `Geschlossen ${time}`;
  if (locale === "pl") return `Zamknięto ${time}`;
  return `Closed ${time}`;
}

function mapPeriodToLabel(
  count: number,
  locale: MobileLocale,
) {
  if (locale === "ru") {
    if (count === 1) return "1 эпизод";
    if (count >= 2 && count <= 4) return `${count} эпизода`;
    return `${count} эпизодов`;
  }
  if (locale === "de") {
    return `${count} ${count === 1 ? "Episode" : "Episoden"}`;
  }
  if (locale === "pl") {
    if (count === 1) return "1 epizod";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
      return `${count} epizody`;
    }
    return `${count} epizodów`;
  }
  return `${count} ${count === 1 ? "episode" : "episodes"}`;
}

function formatDurationDays(value: number, locale: MobileLocale) {
  if (locale === "ru") {
    if (value === 1) return "1 день";
    if (value >= 2 && value <= 4) return `${value} дня`;
    return `${value} дней`;
  }
  if (locale === "de") return `${value} ${value === 1 ? "Tag" : "Tage"}`;
  if (locale === "pl") return `${value} ${value === 1 ? "dzień" : "dni"}`;
  return `${value} ${value === 1 ? "day" : "days"}`;
}

function formatZeroEpisodesMessage(locale: MobileLocale) {
  if (locale === "ru") return "Пока нет завершённых эпизодов";
  if (locale === "de") return "Noch keine abgeschlossenen Episoden";
  if (locale === "pl") return "Brak zakończonych epizodów";
  return "No completed episodes yet";
}

function filterEpisodesForPeriod(
  episodes: MobileIllnessEpisode[],
  period: "month" | "quarter" | "half_year" | "year" | "all",
) {
  const closedEpisodes = episodes.filter(
    (episode) => episode.status === "closed" && episode.closedAt,
  );

  if (period === "all") {
    return closedEpisodes;
  }

  const now = new Date();
  const daysByPeriod = {
    month: 30,
    quarter: 90,
    half_year: 180,
    year: 365,
  };
  const start = new Date(now);
  start.setDate(start.getDate() - (daysByPeriod[period] - 1));

  return closedEpisodes.filter((episode) => {
    const reference = episode.closedAt ? new Date(episode.closedAt) : new Date(episode.startedAt);
    return !Number.isNaN(reference.getTime()) && reference >= start;
  });
}

export function buildAnalyticsScreenContent(
  locale: MobileLocale,
  options?: {
    summary?: MobileIllnessHistorySummary | null;
    episodes?: MobileIllnessEpisode[] | null;
    period?: "month" | "quarter" | "half_year" | "year" | "all";
  },
): AnalyticsScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const filteredEpisodes =
    options?.episodes && options?.period
      ? filterEpisodesForPeriod(options.episodes, options.period)
      : null;
  const closedEpisodes = filteredEpisodes
    ? [...filteredEpisodes].sort((a, b) => {
        const aTime = a.closedAt ? new Date(a.closedAt).getTime() : 0;
        const bTime = b.closedAt ? new Date(b.closedAt).getTime() : 0;
        return bTime - aTime;
      })
    : null;
  const summary = options?.summary ?? null;

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    subtitle: isRu
      ? "Короткая сводка по завершённым эпизодам ребёнка."
      : isDe
        ? "Kurze Übersicht über die abgeschlossenen Episoden des Kindes."
      : isPl
        ? "Krótki przegląd zakończonych epizodów dziecka."
      : "Short summary of the child's completed episodes.",
    periodOptions: [
      {
        id: "month",
        label: isRu ? "Месяц" : isDe ? "Monat" : isPl ? "Miesiąc" : "Month",
      },
      {
        id: "quarter",
        label: isRu ? "3 месяца" : isDe ? "3 Monate" : isPl ? "3 miesiące" : "3 months",
      },
      {
        id: "halfYear",
        label: isRu ? "6 месяцев" : isDe ? "6 Monate" : isPl ? "6 miesięcy" : "6 months",
      },
      {
        id: "year",
        label: isRu ? "Год" : isDe ? "Jahr" : isPl ? "Rok" : "Year",
      },
      {
        id: "allTime",
        label: isRu ? "Всё время" : isDe ? "Gesamter Zeitraum" : isPl ? "Cały okres" : "All time",
      },
    ],
    deleteActionLabel: isRu
      ? "Удалить"
      : isDe
        ? "Löschen"
        : isPl
          ? "Usuń"
          : "Delete",
    deleteDialog: isRu
      ? {
          title: "Точно удалить эпизод?",
          description: "Эпизод исчезнет из ленты и аналитики за период.",
          cancel: "Отмена",
          confirm: "Да, удалить",
        }
      : isDe
        ? {
            title: "Episode wirklich löschen?",
            description: "Die Episode verschwindet aus Verlauf und Analyse für den Zeitraum.",
            cancel: "Abbrechen",
            confirm: "Ja, löschen",
          }
        : isPl
          ? {
              title: "Na pewno usunąć epizod?",
              description: "Epizod zniknie z historii i analityki za ten okres.",
              cancel: "Anuluj",
              confirm: "Tak, usuń",
            }
          : {
              title: "Delete this episode?",
              description: "The episode will be removed from the timeline and period analytics.",
              cancel: "Cancel",
              confirm: "Yes, delete",
            },
    mainSummaryTitle: isRu ? "Главное за период" : isDe ? "Wichtigstes im Zeitraum" : isPl ? "Najważniejsze w tym okresie" : "Highlights for the period",
    mainSummaryInsights: [
      {
        id: "completed",
        icon: "completed",
        title: summary
          ? isRu
            ? `${mapPeriodToLabel(summary.episodeCount, locale)} завершено`
            : isDe
              ? `${mapPeriodToLabel(summary.episodeCount, locale)} abgeschlossen`
              : isPl
                ? `${mapPeriodToLabel(summary.episodeCount, locale)} zakończono`
                : `${mapPeriodToLabel(summary.episodeCount, locale)} completed`
          : formatZeroEpisodesMessage(locale),
        subtitle: summary?.episodeCount
          ? isRu
            ? "Вы справились!"
            : isDe
              ? "Gut geschafft."
              : isPl
                ? "Daliście radę."
                : "You handled it."
          : isRu
            ? "Статистика появится после первого завершённого эпизода."
            : isDe
              ? "Die Statistik erscheint nach der ersten abgeschlossenen Episode."
              : isPl
                ? "Statystyki pojawią się po pierwszym zakończonym epizodzie."
                : "Stats will appear after the first completed episode.",
      },
      {
        id: "month",
        icon: "activeMonth",
        title: summary?.mostActivePeriodLabel
          ? isRu
            ? `Активный период — ${summary.mostActivePeriodLabel}`
            : isDe
              ? `Aktivster Zeitraum — ${summary.mostActivePeriodLabel}`
              : isPl
              ? `Najaktywniejszy okres — ${summary.mostActivePeriodLabel}`
              : `Most active period — ${summary.mostActivePeriodLabel}`
          : isRu
            ? "Активный период пока не определён"
            : isDe
              ? "Aktivster Zeitraum noch nicht bestimmt"
              : isPl
                ? "Najaktywniejszy okres nie został jeszcze określony"
                : "Most active period is not available yet",
        subtitle: isRu
          ? "Больше всего записей в этом месяце."
          : isDe
            ? "In diesem Monat wurden die meisten Einträge hinzugefügt."
          : isPl
            ? "Najwięcej wpisów dodano w tym miesiącu."
          : "Most records were added in this month.",
      },
      {
        id: "medicine",
        icon: "medicine",
        title: summary
          ? isRu
            ? `С лекарствами — ${mapPeriodToLabel(summary.episodesWithAdministrations, locale)}`
            : isDe
              ? `Mit Medikamenten — ${mapPeriodToLabel(summary.episodesWithAdministrations, locale)}`
              : isPl
              ? `Z lekami — ${mapPeriodToLabel(summary.episodesWithAdministrations, locale)}`
              : `With medicine — ${mapPeriodToLabel(summary.episodesWithAdministrations, locale)}`
          : isRu
            ? "Эпизодов с лекарствами пока нет"
            : isDe
              ? "Noch keine Episoden mit Medikamenten"
              : isPl
                ? "Nie ma jeszcze epizodów z lekami"
                : "No episodes with medicine yet",
        subtitle: isRu
          ? "Приёмы фиксировались по назначениям."
          : isDe
            ? "Einnahmen wurden nach Plan erfasst."
          : isPl
            ? "Dawki były zapisywane zgodnie z planem."
          : "Doses were tracked by schedule.",
      },
    ],
    highlights: [
      {
        id: "average",
        label: isRu ? "Средняя длительность" : isDe ? "Durchschnittliche Dauer" : isPl ? "Średni czas trwania" : "Average duration",
        value: summary ? formatDurationDays(Math.round(summary.averageDurationDays || 0), locale) : "—",
        icon: "duration",
        accent: {
          background: "#FFFDFC",
          border: "#F3C7BD",
          iconBackground: "#FFF0E3",
          iconColor: "#D98A52",
        },
      },
      {
        id: "longest",
        label: isRu ? "Самый долгий эпизод" : isDe ? "Längste Episode" : isPl ? "Najdłuższy epizod" : "Longest episode",
        value: summary ? formatDurationDays(summary.longestDurationDays, locale) : "—",
        icon: "longest",
        accent: {
          background: "#FFFDFC",
          border: "#F1DDAF",
          iconBackground: "#FFF4DA",
          iconColor: "#F9B84D",
        },
      },
    ],
    episodesTitle: isRu ? "Завершённые эпизоды" : isDe ? "Abgeschlossene Episoden" : isPl ? "Zakończone epizody" : "Completed episodes",
    episodesHelper: isRu
      ? "Все завершённые эпизоды за выбранный период."
      : isDe
        ? "Alle abgeschlossenen Episoden im gewählten Zeitraum."
      : isPl
        ? "Wszystkie zakończone epizody w wybranym okresie."
      : "All completed episodes for the selected period.",
    episodes: closedEpisodes
      ? closedEpisodes.map((episode, index) => ({
          id: episode.id,
          monthLabel: formatMonthLabel(episode.startedAt, locale),
          dayLabel: formatDayLabel(episode.startedAt),
          meta: isRu
            ? `Эпизод ${closedEpisodes.length - index}`
            : isDe
              ? `Episode ${closedEpisodes.length - index}`
              : isPl
                ? `Epizod ${closedEpisodes.length - index}`
                : `Episode ${closedEpisodes.length - index}`,
          title:
            episode.title?.trim() ||
            (isRu ? "Без названия" : isDe ? "Ohne Titel" : isPl ? "Bez nazwy" : "Untitled"),
          closedAt: formatClosedAtLabel(episode.closedAt, locale),
          description:
            episode.note?.trim() ||
            (isRu ? "Без описания" : isDe ? "Keine Beschreibung" : isPl ? "Brak opisu" : "No description"),
          startedAt: episode.startedAt,
          closedAtIso: episode.closedAt,
        }))
      : [],
  };
}
