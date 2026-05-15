import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type PillboxIntakeCard = {
  id: string;
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
  plansCounter: string;
  todayIntakes: PillboxIntakeCard[];
  summaryStats: PillboxSummaryStat[];
  plans: PillboxPlanCard[];
  emptyTodayTitle: string;
  emptyTodayDescription: string;
  emptyPlansTitle: string;
  emptyPlansDescription: string;
};

export function buildPillboxHomeScreenContent(
  locale: MobileLocale,
): PillboxHomeScreenContent {
  if (locale === "ru") {
    return {
      title: "Таблетница",
      subtitle: "Планы приёма для всей семьи.",
      createPlanLabel: "Создать план",
      analyticsLabel: "Аналитика",
      activePlansTitle: "Активные планы",
      nextIntakeLabel: "Следующий приём",
      nextIntakeAction: "Отметить приём",
      plansCounter: "4",
      todayIntakes: [
        {
          id: "intake_father",
          time: "08:30",
          relativeDate: "Сегодня, 15 мая",
          countdown: "через 45 мин",
          planTitle: "Для папы Артёма",
          medicineSummary: "Нурофен сироп · 2 мл · После еды",
        },
        {
          id: "intake_grandmother",
          time: "09:00",
          relativeDate: "Сегодня, 15 мая",
          countdown: "через 1 ч 15 мин",
          planTitle: "Для бабушки",
          medicineSummary: "Таблетка от давления · 1 табл.",
        },
        {
          id: "intake_nanny",
          time: "10:30",
          relativeDate: "Сегодня, 15 мая",
          countdown: "через 2 ч 45 мин",
          planTitle: "Для няни Ирины",
          medicineSummary: "Витамин D · 1 капсула",
        },
      ],
      summaryStats: [
        { id: "plans", number: "4", label: "плана\nактивно" },
        { id: "medicines", number: "7", label: "лекарств\nв планах" },
        { id: "today", number: "3", label: "приёма\nсегодня" },
      ],
      plans: [
        {
          id: "plan_grandmother",
          title: "Для бабушки",
          avatarText: "Б",
          medicineCount: "5 лекарств",
          nextInfo: "пропущен приём",
          status: "attention",
          statusText: "Требует внимания",
        },
        {
          id: "plan_father",
          title: "Для папы Артёма",
          avatarText: "П",
          medicineCount: "3 лекарства",
          nextInfo: "следующий в 08:30",
          status: "active",
          statusText: "Активен",
        },
        {
          id: "plan_grandfather",
          title: "Для дедушки",
          avatarText: "Д",
          medicineCount: "2 лекарства",
          nextInfo: "следующий в 11:00",
          status: "active",
          statusText: "Активен",
        },
        {
          id: "plan_nanny",
          title: "Для няни Ирины",
          avatarText: "Н",
          medicineCount: "1 лекарство",
          nextInfo: "следующий завтра в 09:00",
          status: "active",
          statusText: "Активен",
        },
      ],
      emptyTodayTitle: "Сегодня приёмов нет",
      emptyTodayDescription:
        "Все активные планы спокойны. Следующий приём появится здесь.",
      emptyPlansTitle: "Планов пока нет",
      emptyPlansDescription:
        "Создайте первый план, чтобы видеть лекарства, напоминания и историю выполнения.",
    };
  }

  return {
    title: "Pillbox",
    subtitle: "Medication plans for the whole family.",
    createPlanLabel: "Create plan",
    analyticsLabel: "Analytics",
    activePlansTitle: "Active plans",
    nextIntakeLabel: "Next intake",
    nextIntakeAction: "Mark as taken",
    plansCounter: "4",
    todayIntakes: [
      {
        id: "intake_father",
        time: "08:30",
        relativeDate: "Today, May 15",
        countdown: "in 45 min",
        planTitle: "For Artem's dad",
        medicineSummary: "Nurofen syrup · 2 ml · After meal",
      },
      {
        id: "intake_grandmother",
        time: "09:00",
        relativeDate: "Today, May 15",
        countdown: "in 1 h 15 min",
        planTitle: "For grandma",
        medicineSummary: "Blood pressure tablet · 1 pill",
      },
      {
        id: "intake_nanny",
        time: "10:30",
        relativeDate: "Today, May 15",
        countdown: "in 2 h 45 min",
        planTitle: "For nanny Irina",
        medicineSummary: "Vitamin D · 1 capsule",
      },
    ],
    summaryStats: [
      { id: "plans", number: "4", label: "plans\nactive" },
      { id: "medicines", number: "7", label: "medicines\nin plans" },
      { id: "today", number: "3", label: "intakes\ntoday" },
    ],
    plans: [
      {
        id: "plan_grandmother",
        title: "For grandma",
        avatarText: "G",
        medicineCount: "5 medicines",
        nextInfo: "missed intake",
        status: "attention",
        statusText: "Needs attention",
      },
      {
        id: "plan_father",
        title: "For Artem's dad",
        avatarText: "D",
        medicineCount: "3 medicines",
        nextInfo: "next at 08:30",
        status: "active",
        statusText: "Active",
      },
      {
        id: "plan_grandfather",
        title: "For grandpa",
        avatarText: "G",
        medicineCount: "2 medicines",
        nextInfo: "next at 11:00",
        status: "active",
        statusText: "Active",
      },
      {
        id: "plan_nanny",
        title: "For nanny Irina",
        avatarText: "N",
        medicineCount: "1 medicine",
        nextInfo: "next tomorrow at 09:00",
        status: "active",
        statusText: "Active",
      },
    ],
    emptyTodayTitle: "No intakes today",
    emptyTodayDescription:
      "All active plans are calm. The next intake will appear here.",
    emptyPlansTitle: "No plans yet",
    emptyPlansDescription:
      "Create your first plan to see medicines, reminders, and completion history.",
  };
}
