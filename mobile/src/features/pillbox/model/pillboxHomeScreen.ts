import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type {
  MobilePillboxPlan,
  MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";
import {
  buildPillboxMedicineCountLabel,
  buildPillboxNextInfoLabel,
  localizePillboxCourse,
  localizePillboxFallback,
  localizePillboxMealRule,
  localizePillboxStatus,
} from "./pillboxLocalization";

export type PillboxIntakeCard = {
  id: string;
  medicationId?: string | null;
  scheduledFor?: string | null;
  time: string;
  relativeDate: string;
  countdown: string;
  planTitle: string;
  medicineSummary: string;
};

export type PillboxPlanStatus = "active" | "attention" | "missed" | "completed";

export type PillboxPlanCard = {
  id: string;
  title: string;
  avatarText: string;
  medicineCount: string;
  nextInfo: string;
  status: PillboxPlanStatus;
  statusText: string;
  nextDoseAt?: string | null;
  nextMedicationId?: string | null;
  canMarkNow: boolean;
};

export type PillboxSummaryStat = {
  id: string;
  number: string;
  label: string;
};

export type PillboxHomeScreenContent = {
  title: string;
  subtitle: string;
  createPlanLabel: string;
  analyticsLabel: string;
  activePlansTitle: string;
  nextIntakeLabel: string;
  nextIntakeAction: string;
  emptyTodayTitle: string;
  emptyTodayDescription: string;
  emptyPlansTitle: string;
  emptyPlansDescription: string;
  loadingPlansTitle: string;
  loadingPlansDescription: string;
  loadingErrorTitle: string;
  retryLabel: string;
};

export type PillboxPlanDetailMedicine = {
  id: string;
  title: string;
  summary: string;
  schedule: string;
};

export type PillboxPlanDetail = {
  id: string;
  title: string;
  avatarText: string;
  status: "active" | "paused" | "completed" | "archived" | "attention" | "missed";
  statusText: string;
  recipientIds: string[];
  medicineCountLabel: string;
  recipientsLabel: string;
  scheduleNote: string;
  medicines: PillboxPlanDetailMedicine[];
  isCreatedPlan: boolean;
};

export function buildPillboxHomeScreenContent(
  locale: MobileLocale,
): PillboxHomeScreenContent {
  if (locale === "ru") {
    return {
      title: "Таблетница",
      subtitle: "Планы и напоминания для всей семьи.",
      createPlanLabel: "Создать план",
      analyticsLabel: "Аналитика",
      activePlansTitle: "Активные планы",
      nextIntakeLabel: "Следующий приём",
      nextIntakeAction: "Отметить приём",
      emptyTodayTitle: "Сегодня приёмов нет",
      emptyTodayDescription:
        "На сегодня всё спокойно. Следующий приём появится здесь.",
      emptyPlansTitle: "Планов пока нет",
      emptyPlansDescription:
        "Создайте первый план, чтобы видеть расписание и напоминания.",
      loadingPlansTitle: "Загружаем планы…",
      loadingPlansDescription: "Подтягиваем ближайшие приёмы и активные планы.",
      loadingErrorTitle: "Не удалось загрузить планы",
      retryLabel: "Повторить",
    };
  }

  if (locale === "de") {
    return {
      title: "Pillendose",
      subtitle: "Pläne und Erinnerungen für die ganze Familie.",
      createPlanLabel: "Plan erstellen",
      analyticsLabel: "Analytik",
      activePlansTitle: "Aktive Pläne",
      nextIntakeLabel: "Nächste Einnahme",
      nextIntakeAction: "Einnahme markieren",
      emptyTodayTitle: "Heute keine Einnahmen",
      emptyTodayDescription:
        "Für heute ist nichts geplant. Die nächste Einnahme erscheint hier.",
      emptyPlansTitle: "Noch keine Pläne",
      emptyPlansDescription:
        "Erstellen Sie Ihren ersten Plan, um Zeitpläne und Erinnerungen zu sehen.",
      loadingPlansTitle: "Pläne werden geladen…",
      loadingPlansDescription: "Anstehende Einnahmen und aktive Pläne werden geladen.",
      loadingErrorTitle: "Pläne konnten nicht geladen werden",
      retryLabel: "Erneut versuchen",
    };
  }

  if (locale === "pl") {
    return {
      title: "Organizer leków",
      subtitle: "Plany i przypomnienia dla całej rodziny.",
      createPlanLabel: "Utwórz plan",
      analyticsLabel: "Analityka",
      activePlansTitle: "Aktywne plany",
      nextIntakeLabel: "Następne przyjęcie",
      nextIntakeAction: "Oznacz jako przyjęte",
      emptyTodayTitle: "Dziś nie ma przyjęć",
      emptyTodayDescription:
        "Na dziś nic nie zaplanowano. Następne przyjęcie pojawi się tutaj.",
      emptyPlansTitle: "Nie ma jeszcze planów",
      emptyPlansDescription:
        "Utwórz pierwszy plan, aby zobaczyć harmonogramy i przypomnienia.",
      loadingPlansTitle: "Ładowanie planów…",
      loadingPlansDescription: "Pobieramy najbliższe przyjęcia i aktywne plany.",
      loadingErrorTitle: "Nie udało się załadować planów",
      retryLabel: "Spróbuj ponownie",
    };
  }

  return {
    title: "Pillbox",
    subtitle: "Plans and reminders for the whole family.",
    createPlanLabel: "Create plan",
    analyticsLabel: "Analytics",
    activePlansTitle: "Active plans",
    nextIntakeLabel: "Next intake",
    nextIntakeAction: "Mark as taken",
    emptyTodayTitle: "No intakes today",
    emptyTodayDescription:
      "Nothing is scheduled for today. The next intake will appear here.",
    emptyPlansTitle: "No plans yet",
    emptyPlansDescription:
      "Create your first plan to see schedules and reminders.",
    loadingPlansTitle: "Loading plans…",
    loadingPlansDescription: "Fetching upcoming intakes and active plans.",
    loadingErrorTitle: "Could not load plans",
    retryLabel: "Retry",
  };
}

export function buildPillboxPlanCardsFromSummaries(input: {
  summaries: MobilePillboxPlanSummary[];
  locale: MobileLocale;
  now?: Date;
}): PillboxPlanCard[] {
  const now = input.now ?? new Date();

  return input.summaries
    .slice()
    .sort((left, right) => comparePlanSummaries(left, right, now))
    .map((summary) => {
      const normalizedTitle = normalizePlanTitle(summary.title);
      const isOverdue = isOverdueDose(summary, now);
      const isLate = isLateDose(summary, now);
      const status = mapSummaryStatus(summary, isOverdue, isLate);

      return {
        id: summary.id,
        title: normalizedTitle,
        avatarText: resolveAvatarText(normalizedTitle),
        medicineCount: buildPillboxMedicineCountLabel(
          summary.activeMedicationCount,
          input.locale,
        ),
        nextInfo: buildSummaryNextInfo(summary, input.locale, now, isOverdue),
        status,
        statusText: buildSummaryStatusText(status, input.locale),
        nextDoseAt: summary.nextDoseAt,
        nextMedicationId: summary.nextMedicationId,
        canMarkNow: canMarkPlanIntake(summary, now),
      };
    });
}

export function buildPillboxIntakeCardsFromSummaries(input: {
  summaries: MobilePillboxPlanSummary[];
  locale: MobileLocale;
  now?: Date;
}): PillboxIntakeCard[] {
  const now = input.now ?? new Date();

  return input.summaries
    .filter((summary) => summary.status === "active" && isSameDay(summary.nextDoseAt, now))
    .sort((left, right) => compareDateStrings(left.nextDoseAt, right.nextDoseAt))
    .map((summary) => ({
      id: summary.id,
      medicationId: summary.nextMedicationId,
      scheduledFor: summary.nextDoseAt,
      time: formatClock(summary.nextDoseAt, input.locale),
      relativeDate: buildRelativeDate(summary.nextDoseAt, input.locale, now),
      countdown: buildCountdown(summary.nextDoseAt, input.locale, now),
      planTitle: normalizePlanTitle(summary.title),
      medicineSummary: summary.nextMedicationTitle?.trim() || fallbackMedicineLabel(input.locale),
    }));
}

export function buildPillboxSummaryStatsFromSummaries(input: {
  summaries: MobilePillboxPlanSummary[];
  locale: MobileLocale;
  now?: Date;
}): PillboxSummaryStat[] {
  const now = input.now ?? new Date();
  const plansCount = input.summaries.length;
  const todayCount = input.summaries.filter((item) => isSameDay(item.nextDoseAt, now)).length;

  if (input.locale === "ru") {
    return [
      { id: "plans", number: String(plansCount), label: "активных\nплана" },
      { id: "today", number: String(todayCount), label: "приёма\nна сегодня" },
    ];
  }
  if (input.locale === "de") {
    return [
      { id: "plans", number: String(plansCount), label: "aktive\nPläne" },
      { id: "today", number: String(todayCount), label: "Einnahmen\nheute" },
    ];
  }
  if (input.locale === "pl") {
    return [
      { id: "plans", number: String(plansCount), label: "aktywnych\nplanów" },
      { id: "today", number: String(todayCount), label: "przyjęć\ndziś" },
    ];
  }
  return [
    { id: "plans", number: String(plansCount), label: "active\nplans" },
    { id: "today", number: String(todayCount), label: "intakes\nfor today" },
  ];
}

export function buildPillboxPlanDetailFromEntity(input: {
  plan: MobilePillboxPlan;
  locale: MobileLocale;
  familyMembers: Pick<MobileFamilyMember, "id" | "displayName">[];
}): PillboxPlanDetail {
  const { plan, locale, familyMembers } = input;
  const recipientsLabel =
    familyMembers
      .filter((member) => plan.memberAccountIds.includes(member.id))
      .map((member) => member.displayName)
      .join(", ") ||
    localizePillboxFallback("noRecipients", locale);

  const medicines = [...plan.medications]
    .sort((left, right) => left.position - right.position)
    .map((item) => ({
      id: item.id,
      title: item.customMedicineName?.trim() || localizePillboxFallback("untitled", locale),
      summary: [
        item.doseAmount,
        localizePillboxMealRule(item.mealRule, locale),
        localizePillboxCourse(item.courseMode, item.courseEndDate, locale),
      ]
        .filter(Boolean)
        .join(" · "),
      schedule: item.times.join(", ") || localizePillboxFallback("noTime", locale),
    }));

  return {
    id: plan.id,
    title: normalizePlanTitle(plan.title),
    avatarText: resolveAvatarText(plan.title),
    status: plan.status,
    statusText:
      plan.status === "paused"
        ? localizePillboxStatus("paused", locale)
        : localizePillboxStatus("active", locale),
    recipientIds: [...plan.memberAccountIds],
    medicineCountLabel: buildPillboxMedicineCountLabel(plan.medications.length, locale),
    recipientsLabel,
    scheduleNote: buildPillboxNextInfoLabel({
      locale,
      times: plan.medications.flatMap((item) => item.times),
    }),
    medicines,
    isCreatedPlan: true,
  };
}

function normalizePlanTitle(value: string) {
  return value.trim() || "Plan";
}

function resolveAvatarText(label: string) {
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "•";
}

function comparePlanSummaries(
  left: MobilePillboxPlanSummary,
  right: MobilePillboxPlanSummary,
  now: Date,
) {
  const leftRank = getSummarySortRank(left, now);
  const rightRank = getSummarySortRank(right, now);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return compareDateStrings(left.nextDoseAt, right.nextDoseAt);
}

function getSummarySortRank(summary: MobilePillboxPlanSummary, now: Date) {
  if (summary.status === "completed" || summary.status === "archived") {
    return 5;
  }
  if (summary.status === "paused") {
    return 4;
  }
  if (isOverdueDose(summary, now) || isLateDose(summary, now)) {
    return 0;
  }
  if (isSameDay(summary.nextDoseAt, now)) {
    return 1;
  }
  if (isTomorrow(summary.nextDoseAt, now)) {
    return 2;
  }
  return 3;
}

function buildSummaryNextInfo(
  summary: MobilePillboxPlanSummary,
  locale: MobileLocale,
  now: Date,
  isOverdue: boolean,
) {
  if (summary.status === "paused") {
    return locale === "ru"
      ? "план на паузе"
      : locale === "de"
        ? "Plan pausiert"
        : locale === "pl"
          ? "plan wstrzymany"
          : "plan is paused";
  }
  if (summary.status === "completed" || summary.status === "archived") {
    return locale === "ru"
      ? "курс завершён"
      : locale === "de"
        ? "Kurs abgeschlossen"
        : locale === "pl"
          ? "kuracja zakończona"
          : "course completed";
  }
  if (isOverdue) {
    return locale === "ru"
      ? "пропущен приём"
      : locale === "de"
        ? "Einnahme verpasst"
        : locale === "pl"
          ? "pominięto przyjęcie"
          : "missed intake";
  }
  if (isSameDay(summary.nextDoseAt, now)) {
    return locale === "ru"
      ? `сегодня в ${formatClock(summary.nextDoseAt, locale)}`
      : locale === "de"
        ? `heute um ${formatClock(summary.nextDoseAt, locale)}`
        : locale === "pl"
          ? `dzisiaj o ${formatClock(summary.nextDoseAt, locale)}`
          : `today at ${formatClock(summary.nextDoseAt, locale)}`;
  }
  if (isTomorrow(summary.nextDoseAt, now)) {
    return locale === "ru"
      ? `завтра в ${formatClock(summary.nextDoseAt, locale)}`
      : locale === "de"
        ? `morgen um ${formatClock(summary.nextDoseAt, locale)}`
        : locale === "pl"
          ? `jutro o ${formatClock(summary.nextDoseAt, locale)}`
          : `tomorrow at ${formatClock(summary.nextDoseAt, locale)}`;
  }
  return summary.nextDoseLabel?.trim() || buildPillboxNextInfoLabel({ locale, times: [] });
}

function mapSummaryStatus(
  summary: MobilePillboxPlanSummary,
  isOverdue: boolean,
  isLate: boolean,
): PillboxPlanStatus {
  if (summary.status === "completed" || summary.status === "archived" || summary.status === "paused") {
    return "completed";
  }
  if (isOverdue) {
    return "missed";
  }
  if (isLate) {
    return "attention";
  }
  return "active";
}

function buildSummaryStatusText(status: PillboxPlanStatus, locale: MobileLocale) {
  if (status === "attention") {
    return localizePillboxStatus("soon", locale);
  }
  if (status === "missed") {
    return localizePillboxStatus("missed", locale);
  }
  if (status === "completed") {
    return localizePillboxStatus("paused", locale);
  }
  return localizePillboxStatus("active", locale);
}

function canMarkPlanIntake(summary: MobilePillboxPlanSummary, now: Date) {
  if (!summary.nextMedicationId || !summary.nextDoseAt) {
    return false;
  }
  if (summary.status === "paused" || summary.status === "completed" || summary.status === "archived") {
    return false;
  }
  const scheduledAt = new Date(summary.nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return false;
  }
  return scheduledAt.getTime() <= now.getTime();
}

function isSameDay(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isTomorrow(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

function compareDateStrings(left: string | null, right: string | null) {
  const leftMs = left ? new Date(left).getTime() : Number.MAX_SAFE_INTEGER;
  const rightMs = right ? new Date(right).getTime() : Number.MAX_SAFE_INTEGER;
  return leftMs - rightMs;
}

function formatClock(value: string | null, locale: MobileLocale) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const languageTag =
    locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : locale === "pl" ? "pl-PL" : "en-US";
  return new Intl.DateTimeFormat(languageTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildRelativeDate(value: string | null, locale: MobileLocale, now: Date) {
  if (!value) {
    return locale === "ru"
      ? "Без даты"
      : locale === "de"
        ? "Kein Datum"
        : locale === "pl"
          ? "Brak daty"
          : "No date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === "ru"
      ? "Без даты"
      : locale === "de"
        ? "Kein Datum"
        : locale === "pl"
          ? "Brak daty"
          : "No date";
  }
  const dayLabel = isSameDay(value, now)
    ? locale === "ru"
      ? "Сегодня"
      : locale === "de"
        ? "Heute"
        : locale === "pl"
          ? "Dziś"
          : "Today"
    : isTomorrow(value, now)
      ? locale === "ru"
        ? "Завтра"
        : locale === "de"
          ? "Morgen"
          : locale === "pl"
            ? "Jutro"
            : "Tomorrow"
      : new Intl.DateTimeFormat(
          locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : locale === "pl" ? "pl-PL" : "en-US",
          {
          day: "numeric",
          month: "long",
          },
        ).format(date);

  const dateLabel = new Intl.DateTimeFormat(
    locale === "ru" ? "ru-RU" : locale === "de" ? "de-DE" : locale === "pl" ? "pl-PL" : "en-US",
    {
      day: "numeric",
      month: "long",
    },
  ).format(date);

  return isSameDay(value, now) || isTomorrow(value, now) ? `${dayLabel}, ${dateLabel}` : dateLabel;
}

function buildCountdown(value: string | null, locale: MobileLocale, now: Date) {
  if (!value) {
    return locale === "ru"
      ? "без времени"
      : locale === "de"
        ? "ohne Uhrzeit"
        : locale === "pl"
          ? "bez godziny"
          : "no time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === "ru"
      ? "без времени"
      : locale === "de"
        ? "ohne Uhrzeit"
        : locale === "pl"
          ? "bez godziny"
          : "no time";
  }
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) {
    return locale === "ru"
      ? "сейчас"
      : locale === "de"
        ? "jetzt"
        : locale === "pl"
          ? "teraz"
          : "now";
  }
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (locale === "ru") {
    if (hours <= 0) {
      return `через ${minutes} мин`;
    }
    if (minutes === 0) {
      return `через ${hours} ч`;
    }
    return `через ${hours} ч ${minutes} мин`;
  }
  if (locale === "de") {
    if (hours <= 0) {
      return `in ${minutes} Min`;
    }
    if (minutes === 0) {
      return `in ${hours} Std`;
    }
    return `in ${hours} Std ${minutes} Min`;
  }
  if (locale === "pl") {
    if (hours <= 0) {
      return `za ${minutes} min`;
    }
    if (minutes === 0) {
      return `za ${hours} godz.`;
    }
    return `za ${hours} godz. ${minutes} min`;
  }
  if (hours <= 0) {
    return `in ${minutes} min`;
  }
  if (minutes === 0) {
    return `in ${hours} h`;
  }
  return `in ${hours} h ${minutes} min`;
}

function isOverdueDose(summary: MobilePillboxPlanSummary, now: Date) {
  if (summary.status !== "active" || !summary.nextDoseAt) return false;
  const scheduledAt = new Date(summary.nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  return now.getTime() - scheduledAt.getTime() > 4 * 60 * 60 * 1000;
}

function isLateDose(summary: MobilePillboxPlanSummary, now: Date) {
  if (summary.status !== "active" || !summary.nextDoseAt) return false;
  const scheduledAt = new Date(summary.nextDoseAt);
  if (Number.isNaN(scheduledAt.getTime())) return false;
  const diffMs = now.getTime() - scheduledAt.getTime();
  return diffMs > 30 * 60 * 1000 && diffMs <= 4 * 60 * 60 * 1000;
}

function fallbackMedicineLabel(locale: MobileLocale) {
  if (locale === "ru") {
    return "Лекарство по плану";
  }
  if (locale === "de") {
    return "Medikament im Plan";
  }
  if (locale === "pl") {
    return "Lek w planie";
  }
  return "Medication in plan";
}
