import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type {
  MobilePillboxHistorySummary,
  MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";

export type PillboxAnalyticsPeriodId =
  | "month"
  | "quarter"
  | "half_year"
  | "year"
  | "all";

export type PillboxAnalyticsContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  planLabel: string;
  planDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  loadingTitle: string;
  loadingDescription: string;
  plansErrorTitle: string;
  plansErrorDescription: string;
  summaryErrorTitle: string;
  summaryErrorDescription: string;
  noDataTitle: string;
  noDataDescription: string;
  retryLabel: string;
  timelineTitle: string;
  timelineDescription: string;
  topMissedTitle: string;
  topMissedEmpty: string;
  adherenceLabel: string;
  onTimeLabel: string;
  lateLabel: string;
  missedLabel: string;
  periods: Array<{ id: PillboxAnalyticsPeriodId; label: string }>;
};

export function buildPillboxAnalyticsContent(locale: MobileLocale): PillboxAnalyticsContent {
  if (locale === "ru") {
    return {
      backLabel: "Назад",
      title: "Аналитика",
      subtitle: "Соблюдение плана, пропуски и общая динамика.",
      planLabel: "План",
      planDescription: "Можно быстро переключаться между разными планами.",
      emptyTitle: "Пока нечего анализировать",
      emptyDescription: "Создайте хотя бы один план, чтобы видеть статистику и динамику.",
      loadingTitle: "Собираем сводку…",
      loadingDescription: "Считаем соблюдение, вовремя отмеченные приёмы и пропуски.",
      plansErrorTitle: "Не удалось загрузить планы",
      plansErrorDescription: "Попробуйте открыть аналитику ещё раз или повторить загрузку.",
      summaryErrorTitle: "Не удалось загрузить аналитику",
      summaryErrorDescription: "Попробуйте выбрать другой план или открыть экран ещё раз.",
      noDataTitle: "Пока нет данных",
      noDataDescription: "Как только по плану появятся отметки, здесь соберётся сводка.",
      retryLabel: "Повторить",
      timelineTitle: "Как идёт план",
      timelineDescription: "Помогает увидеть, где режим держится ровно, а где уже появляются пропуски.",
      topMissedTitle: "Что сбивается чаще всего",
      topMissedEmpty: "По этому плану пока нет пропусков.",
      adherenceLabel: "Соблюдение",
      onTimeLabel: "Вовремя",
      lateLabel: "С опозданием",
      missedLabel: "Пропуски",
      periods: [
        { id: "month", label: "Месяц" },
        { id: "quarter", label: "3 мес." },
        { id: "half_year", label: "6 мес." },
        { id: "year", label: "Год" },
        { id: "all", label: "Всё" },
      ],
    };
  }

  if (locale === "de") {
    return {
      backLabel: "Zurück",
      title: "Analysen",
      subtitle: "Planerfüllung, verpasste Einnahmen und Gesamtdynamik.",
      planLabel: "Plan",
      planDescription: "Sie können schnell zwischen verschiedenen Plänen wechseln.",
      emptyTitle: "Noch nichts zu analysieren",
      emptyDescription: "Erstellen Sie mindestens einen Plan, um Statistiken und Verlauf zu sehen.",
      loadingTitle: "Übersicht wird erstellt…",
      loadingDescription: "Einhaltung, pünktliche Einnahmen und Aussetzer werden berechnet.",
      plansErrorTitle: "Pläne konnten nicht geladen werden",
      plansErrorDescription: "Öffnen Sie die Analyse erneut oder versuchen Sie es noch einmal.",
      summaryErrorTitle: "Analyse konnte nicht geladen werden",
      summaryErrorDescription: "Wählen Sie einen anderen Plan oder öffnen Sie den Bildschirm erneut.",
      noDataTitle: "Noch keine Daten",
      noDataDescription: "Sobald es Markierungen zu diesem Plan gibt, erscheint hier die Übersicht.",
      retryLabel: "Erneut versuchen",
      timelineTitle: "So läuft der Plan",
      timelineDescription: "Zeigt, wo der Rhythmus stabil bleibt und wo Aussetzer beginnen.",
      topMissedTitle: "Was am häufigsten ausfällt",
      topMissedEmpty: "Für diesen Plan gibt es noch keine verpassten Einnahmen.",
      adherenceLabel: "Einhaltung",
      onTimeLabel: "Pünktlich",
      lateLabel: "Verspätet",
      missedLabel: "Verpasst",
      periods: [
        { id: "month", label: "Monat" },
        { id: "quarter", label: "3 Mon." },
        { id: "half_year", label: "6 Mon." },
        { id: "year", label: "Jahr" },
        { id: "all", label: "Alles" },
      ],
    };
  }

  if (locale === "pl") {
    return {
      backLabel: "Wstecz",
      title: "Analityka",
      subtitle: "Realizacja planu, pominięcia i ogólna dynamika.",
      planLabel: "Plan",
      planDescription: "Możesz szybko przełączać się między różnymi planami.",
      emptyTitle: "Jeszcze nic do analizy",
      emptyDescription: "Utwórz co najmniej jeden plan, aby zobaczyć statystyki i przebieg.",
      loadingTitle: "Przygotowujemy podsumowanie…",
      loadingDescription: "Liczymy realizację, terminowe przyjęcia i pominięcia.",
      plansErrorTitle: "Nie udało się załadować planów",
      plansErrorDescription: "Spróbuj otworzyć analitykę ponownie lub powtórzyć ładowanie.",
      summaryErrorTitle: "Nie udało się załadować analityki",
      summaryErrorDescription: "Wybierz inny plan lub otwórz ekran jeszcze raz.",
      noDataTitle: "Brak danych",
      noDataDescription: "Gdy pojawią się oznaczenia dla tego planu, zobaczysz tu podsumowanie.",
      retryLabel: "Spróbuj ponownie",
      timelineTitle: "Jak idzie plan",
      timelineDescription: "Pokazuje, gdzie rytm jest stabilny, a gdzie zaczynają się pominięcia.",
      topMissedTitle: "Co wypada najczęściej",
      topMissedEmpty: "Dla tego planu nie ma jeszcze pominięć.",
      adherenceLabel: "Realizacja",
      onTimeLabel: "Na czas",
      lateLabel: "Spóźnione",
      missedLabel: "Pominięcia",
      periods: [
        { id: "month", label: "Miesiąc" },
        { id: "quarter", label: "3 mies." },
        { id: "half_year", label: "6 mies." },
        { id: "year", label: "Rok" },
        { id: "all", label: "Wszystko" },
      ],
    };
  }

  return {
    backLabel: "Back",
    title: "Analytics",
    subtitle: "Adherence, missed doses, and overall progress.",
    planLabel: "Plan",
    planDescription: "You can quickly switch between different plans.",
    emptyTitle: "Nothing to analyze yet",
    emptyDescription: "Create at least one plan to see stats and progress over time.",
    loadingTitle: "Preparing summary…",
    loadingDescription: "Calculating adherence, on-time doses, and missed intakes.",
    plansErrorTitle: "Could not load plans",
    plansErrorDescription: "Try reopening analytics or load the plans again.",
    summaryErrorTitle: "Could not load analytics",
    summaryErrorDescription: "Try selecting another plan or reopen the screen.",
    noDataTitle: "No data yet",
    noDataDescription: "Once this plan has tracked doses, the summary will appear here.",
    retryLabel: "Retry",
    timelineTitle: "How the plan is going",
    timelineDescription: "Shows where the routine stays stable and where it starts slipping.",
    topMissedTitle: "What slips most often",
    topMissedEmpty: "No missed doses for this plan yet.",
    adherenceLabel: "Adherence",
    onTimeLabel: "On time",
    lateLabel: "Late",
    missedLabel: "Missed",
    periods: [
      { id: "month", label: "Month" },
      { id: "quarter", label: "3 mo" },
      { id: "half_year", label: "6 mo" },
      { id: "year", label: "Year" },
      { id: "all", label: "All" },
    ],
  };
}

export function buildAnalyticsInsight(summary: MobilePillboxHistorySummary, locale: MobileLocale) {
  if (summary.missedSlots === 0 && summary.lateSlots === 0) {
    if (locale === "ru") {
      return "План идёт ровно: все приёмы отмечаются без сбоев.";
    }
    if (locale === "de") {
      return "Der Plan läuft stabil: alle Einnahmen werden konsequent markiert.";
    }
    if (locale === "pl") {
      return "Plan jest stabilny: wszystkie przyjęcia są regularnie oznaczane.";
    }
    return "This plan is stable: all doses are being tracked consistently.";
  }

  if (summary.adherenceRate >= 0.9) {
    if (locale === "ru") {
      return "В целом всё идёт хорошо. Есть редкие отклонения, но режим держится.";
    }
    if (locale === "de") {
      return "Insgesamt läuft der Plan gut, mit nur seltenen Abweichungen.";
    }
    if (locale === "pl") {
      return "Ogólnie plan idzie dobrze, tylko z rzadkimi odchyleniami.";
    }
    return "Overall the plan is on track, with only rare deviations.";
  }

  if (summary.topMissedMedications[0]) {
    if (locale === "ru") {
      return `Чаще всего сбивается: ${summary.topMissedMedications[0].medicationName}.`;
    }
    if (locale === "de") {
      return `Am häufigsten verpasst: ${summary.topMissedMedications[0].medicationName}.`;
    }
    if (locale === "pl") {
      return `Najczęściej pomijane: ${summary.topMissedMedications[0].medicationName}.`;
    }
    return `Most often missed: ${summary.topMissedMedications[0].medicationName}.`;
  }

  if (locale === "ru") {
    return "По этому плану уже есть заметные пропуски.";
  }
  if (locale === "de") {
    return "Dieser Plan zeigt bereits deutliche Aussetzer.";
  }
  if (locale === "pl") {
    return "Ten plan ma już zauważalne pominięcia.";
  }
  return "This plan is already showing notable misses.";
}

export function resolveAnalyticsPlanLabel(
  summaries: MobilePillboxPlanSummary[],
  selectedPlanId: string | null,
  locale: MobileLocale,
) {
  const selected = summaries.find((item) => item.id === selectedPlanId);
  if (selected?.title?.trim()) {
    return selected.title.trim();
  }
  if (locale === "ru") {
    return "Выберите план";
  }
  if (locale === "de") {
    return "Plan auswählen";
  }
  if (locale === "pl") {
    return "Wybierz plan";
  }
  return "Choose a plan";
}
