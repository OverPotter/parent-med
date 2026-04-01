import type { AppLanguage } from "@shared/i18n";

const introCopy = {
  ru: {
    badge: "Первый вход",
    title: "Сначала покажем, с чего удобнее начать",
    subtitle:
      "Этот экран нужен один раз: он помогает понять ближайший шаг и сразу перейти в нужный раздел без лишнего обзора.",
    familyTitle: "Семья",
    familyDescription: "Семья объединяет взрослых, детей, аптечку и общие записи.",
    childrenTitle: "Дети",
    childrenDescription: "После добавления ребёнка можно вести болезни, температуру и приёмы.",
    workTitle: "Текущая работа",
    workDescription: "Если уже есть активные эпизоды, приложение откроет их в первую очередь.",
    ready: "Готово",
    nextStep: "Следующий шаг",
    needAdd: "Нужно добавить",
    waitingFamily: "Ждёт семью",
    activeIllnesses: "Есть активные болезни",
    openUseful: "Откроем самый полезный раздел",
    nextRoute: "Следующий маршрут",
    resolving: "Подбираем лучший стартовый экран…",
    preparing: "Подготавливаем…",
    continue: "Продолжить",
    neverShowAgain: "Не показывать снова",
    openingWorkspace: "Открываем рабочий раздел…",
    routeFamily: "раздел «Семья»",
    routeTracking: "раздел «Наблюдения»",
    routeChildren: "раздел «Дети»",
    openRoute: "Откроем {{route}}.",
  },
  en: {
    badge: "First sign-in",
    title: "First, we’ll show the best place to start",
    subtitle:
      "This screen appears once. It helps you see the next step and jump straight into the right section without extra overview.",
    familyTitle: "Family",
    familyDescription: "Family connects adults, children, the first aid kit and shared records.",
    childrenTitle: "Children",
    childrenDescription: "After adding a child, you can track illnesses, temperatures and doses.",
    workTitle: "Current work",
    workDescription: "If there are already active episodes, the app will open them first.",
    ready: "Ready",
    nextStep: "Next step",
    needAdd: "Needs to be added",
    waitingFamily: "Waiting for family",
    activeIllnesses: "Active illnesses exist",
    openUseful: "We’ll open the most useful section",
    nextRoute: "Next route",
    resolving: "Choosing the best start screen…",
    preparing: "Preparing…",
    continue: "Continue",
    neverShowAgain: "Do not show again",
    openingWorkspace: "Opening your workspace…",
    routeFamily: "the Family section",
    routeTracking: "the Tracking section",
    routeChildren: "the Children section",
    openRoute: "We’ll open {{route}}.",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export function tWorkspaceIntro(
  language: AppLanguage,
  key: keyof (typeof introCopy)["ru"],
  variables?: Record<string, string>
) {
  const template = introCopy[language][key];
  if (!variables) return template;
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replace(`{{${name}}}`, value),
    template
  );
}

export function labelForRoute(route: string, language: AppLanguage): string {
  switch (route) {
    case "/family":
      return tWorkspaceIntro(language, "routeFamily");
    case "/illnesses/active":
      return tWorkspaceIntro(language, "routeTracking");
    case "/children":
    default:
      return tWorkspaceIntro(language, "routeChildren");
  }
}
