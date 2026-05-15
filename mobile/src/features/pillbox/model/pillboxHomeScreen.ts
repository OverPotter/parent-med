import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type {
  MobilePillboxPlan,
  MobilePillboxPlanSummary,
} from "../api/mobilePillboxPlansApi";

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
        medicineCount: buildMedicineCountLabel(summary.activeMedicationCount, input.locale),
        nextInfo: buildSummaryNextInfo(summary, input.locale, now, isOverdue),
        status,
        statusText: buildSummaryStatusText(status, input.locale),
        nextDoseAt: summary.nextDoseAt,
        nextMedicationId: summary.nextMedicationId,
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

  return input.locale === "ru"
    ? [
        { id: "plans", number: String(plansCount), label: "активных\nплана" },
        { id: "today", number: String(todayCount), label: "приёма\nна сегодня" },
      ]
    : [
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
    (locale === "ru" ? "Без уведомлений" : "No recipients");

  const medicines = [...plan.medications]
    .sort((left, right) => left.position - right.position)
    .map((item) => ({
      id: item.id,
      title: item.customMedicineName?.trim() || (locale === "ru" ? "Без названия" : "Untitled"),
      summary: [
        item.doseAmount,
        formatMealRule(item.mealRule, locale),
        formatCourse(item.courseMode, item.courseEndDate, locale),
      ]
        .filter(Boolean)
        .join(" · "),
      schedule: item.times.join(", ") || (locale === "ru" ? "Без времени" : "No time"),
    }));

  return {
    id: plan.id,
    title: normalizePlanTitle(plan.title),
    avatarText: resolveAvatarText(plan.title),
    status: plan.status,
    statusText:
      plan.status === "paused"
        ? locale === "ru"
          ? "На паузе"
          : "Paused"
        : locale === "ru"
          ? "Активен"
          : "Active",
    recipientIds: [...plan.memberAccountIds],
    medicineCountLabel: buildMedicineCountLabel(plan.medications.length, locale),
    recipientsLabel,
    scheduleNote: buildNextInfoLabel({
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

function buildMedicineCountLabel(count: number, locale: MobileLocale) {
  if (locale === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
      return `${count} лекарство`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} лекарства`;
    }
    return `${count} лекарств`;
  }

  return `${count} ${count === 1 ? "medicine" : "medicines"}`;
}

function buildNextInfoLabel(input: { locale: MobileLocale; times: string[] }) {
  const nextTime = [...input.times].sort()[0];
  if (!nextTime) {
    return input.locale === "ru" ? "Расписание настроено" : "Schedule is set";
  }

  return input.locale === "ru"
    ? `Следующий приём в ${nextTime}`
    : `Next intake at ${nextTime}`;
}

function formatMealRule(
  value: MobilePillboxPlan["medications"][number]["mealRule"],
  locale: MobileLocale,
) {
  if (value === "before_meal") {
    return locale === "ru" ? "До еды" : "Before meal";
  }
  if (value === "with_meal") {
    return locale === "ru" ? "Во время еды" : "With meal";
  }
  if (value === "after_meal") {
    return locale === "ru" ? "После еды" : "After meal";
  }
  return locale === "ru" ? "Независимо от еды" : "Independent of meal";
}

function formatCourse(
  mode: MobilePillboxPlan["medications"][number]["courseMode"],
  courseEndDate: string | null,
  locale: MobileLocale,
) {
  if (mode !== "period") {
    return locale === "ru" ? "Постоянно" : "Continuous";
  }
  if (!courseEndDate) {
    return locale === "ru" ? "Курсом" : "Course";
  }
  return locale === "ru" ? `До ${courseEndDate}` : `Until ${courseEndDate}`;
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
    return locale === "ru" ? "план на паузе" : "plan is paused";
  }
  if (summary.status === "completed" || summary.status === "archived") {
    return locale === "ru" ? "курс завершён" : "course completed";
  }
  if (isOverdue) {
    return locale === "ru" ? "пропущен приём" : "missed intake";
  }
  if (isSameDay(summary.nextDoseAt, now)) {
    return locale === "ru"
      ? `сегодня в ${formatClock(summary.nextDoseAt, locale)}`
      : `today at ${formatClock(summary.nextDoseAt, locale)}`;
  }
  if (isTomorrow(summary.nextDoseAt, now)) {
    return locale === "ru"
      ? `завтра в ${formatClock(summary.nextDoseAt, locale)}`
      : `tomorrow at ${formatClock(summary.nextDoseAt, locale)}`;
  }
  return summary.nextDoseLabel?.trim() || (locale === "ru" ? "расписание настроено" : "schedule is set");
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
    return locale === "ru" ? "Скоро" : "Soon";
  }
  if (status === "missed") {
    return locale === "ru" ? "Пропуск" : "Missed";
  }
  if (status === "completed") {
    return locale === "ru" ? "На паузе" : "Paused";
  }
  return locale === "ru" ? "Активен" : "Active";
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
    return locale === "ru" ? "Без даты" : "No date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === "ru" ? "Без даты" : "No date";
  }
  const dayLabel = isSameDay(value, now)
    ? locale === "ru"
      ? "Сегодня"
      : "Today"
    : isTomorrow(value, now)
      ? locale === "ru"
        ? "Завтра"
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
    return locale === "ru" ? "без времени" : "no time";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return locale === "ru" ? "без времени" : "no time";
  }
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) {
    return locale === "ru" ? "сейчас" : "now";
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
  return locale === "ru" ? "Лекарство по плану" : "Medication in plan";
}
