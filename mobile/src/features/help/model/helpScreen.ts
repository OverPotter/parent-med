import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type HelpSectionId =
  | "children"
  | "journal"
  | "pillbox"
  | "cabinet"
  | "family"
  | "settings";

export type HelpScreenSection = {
  id: HelpSectionId;
  title: string;
  description: string;
  caseExample: string;
  actionLabel: string;
};

export type HelpScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  sections: HelpScreenSection[];
};

const HELP_SECTION_ORDER: HelpSectionId[] = [
  "children",
  "journal",
  "pillbox",
  "cabinet",
  "family",
  "settings",
];

type LocalizedHelpSectionCopy = Omit<HelpScreenSection, "id">;

export function buildHelpScreenContent(locale: MobileLocale): HelpScreenContent {
  return {
    backLabel: getHelpBackLabel(locale),
    title: getHelpTitle(locale),
    subtitle: getHelpSubtitle(locale),
    sections: HELP_SECTION_ORDER.map((id) => ({
      id,
      ...getLocalizedHelpSectionCopy(id, locale),
    })),
  };
}

function getHelpBackLabel(locale: MobileLocale) {
  if (locale === "ru") return "Ещё";
  if (locale === "de") return "Mehr";
  if (locale === "pl") return "Więcej";
  return "More";
}

function getHelpTitle(locale: MobileLocale) {
  if (locale === "ru") return "Помощь";
  if (locale === "de") return "Hilfe";
  if (locale === "pl") return "Pomoc";
  return "Help";
}

function getHelpSubtitle(locale: MobileLocale) {
  if (locale === "ru") {
    return "Коротко: что это за модуль и когда он нужен.";
  }
  if (locale === "de") {
    return "Kurz: wofür das Modul da ist und wann es gebraucht wird.";
  }
  if (locale === "pl") {
    return "Krótko: do czego służy moduł i kiedy go używać.";
  }
  return "In short: what the module is for and when to use it.";
}

function getLocalizedHelpSectionCopy(
  id: HelpSectionId,
  locale: MobileLocale,
): LocalizedHelpSectionCopy {
  switch (id) {
    case "children":
      return getChildrenHelpCopy(locale);
    case "journal":
      return getJournalHelpCopy(locale);
    case "pillbox":
      return getPillboxHelpCopy(locale);
    case "cabinet":
      return getCabinetHelpCopy(locale);
    case "family":
      return getFamilyHelpCopy(locale);
    case "settings":
      return getSettingsHelpCopy(locale);
  }
}

function getChildrenHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Дети",
      description:
        "Главный вход в работу по каждому ребёнку: профиль, история, обзор, сон, кормления, рост и вес.",
      caseExample:
        "«Например: для каждого ребёнка держите отдельный профиль, чтобы болезни, заметки и измерения не смешивались.»",
      actionLabel: "Открыть детей",
    };
  }
  if (locale === "de") {
    return {
      title: "Kinder",
      description:
        "Der Haupteinstieg pro Kind: Profil, Verlauf, Überblick, Schlaf, Füttern, Größe und Gewicht.",
      caseExample:
        "„Zum Beispiel: Jedes Kind hat ein eigenes Profil, damit Krankheiten, Notizen und Messungen nicht vermischt werden.“",
      actionLabel: "Kinder öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Dzieci",
      description:
        "Główne wejście do pracy z każdym dzieckiem: profil, historia, przegląd, sen, karmienia, wzrost i waga.",
      caseExample:
        "„Na przykład: każde dziecko ma osobny profil, żeby choroby, notatki i pomiary się nie mieszały.”",
      actionLabel: "Otwórz dzieci",
    };
  }
  return {
    title: "Children",
    description:
      "The main entry point for each child: profile, history, overview, sleep, feeding, growth, and weight.",
    caseExample:
      '"For example: each child gets a separate profile so illnesses, notes, and measurements do not mix together."',
    actionLabel: "Open children",
  };
}

function getJournalHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Журнал",
      description:
        "Журнал нужен для текущей болезни: сюда попадают температура, приёмы, заметки и напоминания в одной ленте. Раздел доступен, когда у ребёнка активно наблюдение.",
      caseExample:
        "«Например: ночью записали 38.7, дали ибупрофен и утром уже видите всю последовательность событий по времени.»",
      actionLabel: "Открыть журнал",
    };
  }
  if (locale === "de") {
    return {
      title: "Journal",
      description:
        "Das Journal ist für die aktuelle Krankheit: Temperatur, Gaben, Notizen und Erinnerungen laufen hier in einer Zeitleiste zusammen. Der Bereich ist verfügbar, wenn für das Kind eine aktive Beobachtung läuft.",
      caseExample:
        "„Zum Beispiel: Nachts notieren Sie 38,7, geben Ibuprofen und sehen morgens die ganze Abfolge direkt nach Uhrzeit sortiert.“",
      actionLabel: "Journal öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Dziennik",
      description:
        "Dziennik służy do bieżącej choroby: temperatura, podania, notatki i przypomnienia zbierają się tu w jednej osi czasu. Moduł jest dostępny, gdy u dziecka aktywna jest obserwacja.",
      caseExample:
        "„Na przykład: w nocy zapisujesz 38,7, podajesz ibuprofen i rano widzisz już cały przebieg ułożony po godzinach.”",
      actionLabel: "Otwórz dziennik",
    };
  }
  return {
    title: "Journal",
    description:
      "Journal is for the current illness: temperatures, doses, notes, and reminders all stay in one timeline. It appears when the child has an active observation.",
    caseExample:
      '"For example: at night you log 38.7, give ibuprofen, and in the morning the whole sequence is already there in time order."',
    actionLabel: "Open journal",
  };
}

function getPillboxHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Таблетница",
      description:
        "Это отдельные планы лекарств с расписанием, ближайшими приёмами и отметками выполнения для семьи.",
      caseExample:
        "«Например: заводите курс антибиотика на 7 дней и сразу видно, когда следующий приём и кто уже его отметил.»",
      actionLabel: "Открыть таблетницу",
    };
  }
  if (locale === "de") {
    return {
      title: "Medikamentenplan",
      description:
        "Hier liegen eigenständige Medikamentenpläne mit Zeiten, nächsten Einnahmen und Markierungen für die Familie.",
      caseExample:
        "„Zum Beispiel: Sie legen einen Antibiotikakurs für 7 Tage an und sehen sofort, wann die nächste Einnahme fällig ist.“",
      actionLabel: "Medikamentenplan öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Tabletki",
      description:
        "To osobne plany leków z harmonogramem, kolejnymi podaniami i oznaczeniami wykonania dla rodziny.",
      caseExample:
        "„Na przykład: tworzysz 7-dniowy kurs antybiotyku i od razu widać, kiedy wypada kolejne podanie.”",
      actionLabel: "Otwórz tabletki",
    };
  }
  return {
    title: "Pillbox",
    description:
      "This module is for separate medication plans with schedules, next intakes, and completion marks for the family.",
    caseExample:
      '"For example: you create a 7-day antibiotic course and can immediately see when the next intake is due."',
    actionLabel: "Open pillbox",
  };
}

function getCabinetHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Аптечка",
      description:
        "Здесь хранится домашний запас лекарств: что есть дома, что вскрыто, что проверить и что просрочено.",
      caseExample:
        "«Например: перед ночью проверяете, есть ли дома жаропонижающее и не просрочен ли уже открытый сироп.»",
      actionLabel: "Открыть аптечку",
    };
  }
  if (locale === "de") {
    return {
      title: "Hausapotheke",
      description:
        "Hier sehen Sie den Vorrat zu Hause: was da ist, was geöffnet wurde, was geprüft werden sollte und was abgelaufen ist.",
      caseExample:
        "„Zum Beispiel: Vor der Nacht prüfen Sie, ob Fiebermittel da sind und ob ein geöffneter Sirup noch verwendbar ist.“",
      actionLabel: "Hausapotheke öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Apteczka",
      description:
        "Tutaj widać domowy zapas leków: co jest w domu, co zostało otwarte, co trzeba sprawdzić i co jest przeterminowane.",
      caseExample:
        "„Na przykład: przed nocą sprawdzasz, czy w domu jest lek przeciwgorączkowy i czy otwarty syrop nadal nadaje się do użycia.”",
      actionLabel: "Otwórz apteczkę",
    };
  }
  return {
    title: "Cabinet",
    description:
      "Here you see the home medicine stock: what is at home, what is opened, what needs checking, and what is expired.",
    caseExample:
      '"For example: before the night you check whether fever medicine is at home and whether an opened syrup is still okay to use."',
    actionLabel: "Open cabinet",
  };
}

function getFamilyHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Семья",
      description:
        "Модуль для участников, ролей, приглашений и доступа к детям, журналу, аптечке и таблетнице.",
      caseExample:
        "«Например: приглашаете бабушку и открываете ей доступ только к одному ребёнку и просмотру журнала.»",
      actionLabel: "Открыть семью",
    };
  }
  if (locale === "de") {
    return {
      title: "Familie",
      description:
        "Dieses Modul verwaltet Mitglieder, Rollen, Einladungen und Zugriffe auf Kinder, Journal, Hausapotheke und Medikamentenpläne.",
      caseExample:
        "„Zum Beispiel: Sie laden eine Großmutter ein und geben ihr Zugriff nur auf ein Kind und das Journal.“",
      actionLabel: "Familie öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Rodzina",
      description:
        "Ten moduł zarządza członkami, rolami, zaproszeniami i dostępem do dzieci, dziennika, apteczki oraz planów leków.",
      caseExample:
        "„Na przykład: zapraszasz babcię i dajesz jej dostęp tylko do jednego dziecka oraz podglądu dziennika.”",
      actionLabel: "Otwórz rodzinę",
    };
  }
  return {
    title: "Family",
    description:
      "This module manages members, roles, invites, and access to children, journal, cabinet, and medication plans.",
    caseExample:
      '"For example: you invite a grandparent and give access only to one child and journal viewing."',
    actionLabel: "Open family",
  };
}

function getSettingsHelpCopy(locale: MobileLocale): LocalizedHelpSectionCopy {
  if (locale === "ru") {
    return {
      title: "Настройки",
      description:
        "Здесь меняются язык, уведомления, Live Activity, параметры подписки и защита аккаунта.",
      caseExample:
        "«Например: включаете push и Live Activity для болезни, чтобы важные действия были видны на iPhone без открытия приложения.»",
      actionLabel: "Открыть настройки",
    };
  }
  if (locale === "de") {
    return {
      title: "Einstellungen",
      description:
        "Hier ändern Sie Sprache, Benachrichtigungen, Live Activity, Abo-Einstellungen und Kontoschutz.",
      caseExample:
        "„Zum Beispiel: Sie aktivieren Push und Live Activity für Krankheit, damit wichtige Schritte direkt auf dem iPhone sichtbar bleiben.“",
      actionLabel: "Einstellungen öffnen",
    };
  }
  if (locale === "pl") {
    return {
      title: "Ustawienia",
      description:
        "Tutaj zmieniasz język, powiadomienia, Live Activity, subskrypcję i bezpieczeństwo konta.",
      caseExample:
        "„Na przykład: włączasz push i Live Activity dla choroby, żeby ważne działania były widoczne na iPhonie bez otwierania aplikacji.”",
      actionLabel: "Otwórz ustawienia",
    };
  }
  return {
    title: "Settings",
    description:
      "Here you change language, notifications, Live Activity, subscription options, and account security.",
    caseExample:
      '"For example: you turn on push and Live Activity for illness so key actions stay visible on iPhone without opening the app."',
    actionLabel: "Open settings",
  };
}
