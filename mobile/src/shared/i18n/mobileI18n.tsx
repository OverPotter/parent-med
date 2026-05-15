import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type MobileLocale = "ru" | "en" | "pl" | "de";

export type TranslationTree = {
  tabs: {
    children: string;
    pillbox: string;
    cabinet: string;
    more: string;
  };
  children: {
    header: {
      title: string;
      subtitle: string;
      addChild: string;
    };
    actions: {
      sleep: string;
      feeding: string;
      observation: string;
      profile: string;
    };
  };
  childProfile: {
    backToChildren: string;
    journalTitle: string;
    notesTitle: string;
    notesBody: string;
    exportTitle: string;
    exportCaption: string;
    editProfile: string;
    stats: {
      age: string;
      weight: string;
      height: string;
      allergies: string;
    };
  };
  exportSheet: {
    eyebrow: string;
    title: string;
    subtitle: string;
    exportWhat: string;
    period: string;
    saveCsv: string;
    saveXlsx: string;
    options: {
      summary: string;
      illness: string;
      care: string;
      allFiles: string;
    };
    descriptions: {
      summary: string;
      illness: string;
      care: string;
      allFiles: string;
    };
    periods: {
      twoWeeks: string;
      month: string;
      halfYear: string;
      all: string;
    };
  };
  editProfileScreen: {
    backToProfile: string;
    title: string;
    subtitle: string;
    changePhoto: string;
    sections: {
      main: string;
      health: string;
      settings: string;
    };
    rows: {
      childName: string;
      birthDate: string;
      allergies: string;
      notes: string;
      babyMode: string;
    };
    descriptions: {
      allergies: string;
      notes: string;
      babyMode: string;
    };
    values: {
      birthDate: string;
    };
    actions: {
      save: string;
      delete: string;
      confirmDeleteTitle: string;
      confirmDeleteMessage: string;
      confirmDeleteCancel: string;
      confirmDeleteConfirm: string;
    };
  };
};

const ru: TranslationTree = {
  tabs: {
    children: "Дети",
    pillbox: "Таблетница",
    cabinet: "Аптечка",
    more: "Ещё",
  },
  children: {
    header: {
      title: "Дети",
      subtitle: "Профили детей и быстрый доступ к записям.",
      addChild: "Добавить ребёнка",
    },
    actions: {
      sleep: "Сон",
      feeding: "Кормление",
      observation: "Наблюдать",
      profile: "Профиль",
    },
  },
  childProfile: {
    backToChildren: "← К детям",
    journalTitle: "Журнал",
    notesTitle: "Заметки",
    notesBody:
      "Здесь можно оставить важные наблюдения: реакция на лекарства, настроение, сон или вопросы к врачу.",
    exportTitle: "Экспорт истории",
    exportCaption: "CSV / таблица для врача или семьи",
    editProfile: "Редактировать профиль",
    stats: {
      age: "Возраст",
      weight: "Вес",
      height: "Рост",
      allergies: "Аллергии",
    },
  },
  exportSheet: {
    eyebrow: "ЭКСПОРТ",
    title: "Поделиться данными ребёнка",
    subtitle: "Выберите, какие данные нужны и за какой период.",
    exportWhat: "Что экспортировать",
    period: "Период",
    saveCsv: "Сохранить CSV",
    saveXlsx: "Сохранить XLSX",
    options: {
      summary: "Сводка",
      illness: "Болезни",
      care: "Уход",
      allFiles: "Все файлы",
    },
    descriptions: {
      summary: "Рост, вес, сон, кормления и общие показатели за период.",
      illness: "Температура, лекарства, комментарии и эпизоды болезни.",
      care: "Отдельные таблицы со сном, кормлениями, весом и ростом.",
      allFiles: "Сводка, болезни и уход одним архивом.",
    },
    periods: {
      twoWeeks: "2 недели",
      month: "30 дней",
      halfYear: "6 месяцев",
      all: "Всё время",
    },
  },
  editProfileScreen: {
    backToProfile: "К профилю ребёнка",
    title: "Редактировать профиль",
    subtitle: "Основные данные и настройки Эдика.",
    changePhoto: "Сменить иконку",
    sections: {
      main: "Основные данные",
      health: "Здоровье и заметки",
      settings: "Настройки",
    },
    rows: {
      childName: "Имя ребёнка",
      birthDate: "Дата рождения",
      allergies: "Аллергии",
      notes: "Заметки",
      babyMode: "Режим малыша",
    },
    descriptions: {
      allergies: "Орехи, сезонная аллергия",
      notes: "Важные наблюдения и комментарии",
      babyMode: "Добавляет сон, кормление и историю дня.",
    },
    values: {
      birthDate: "4 февраля 2022",
    },
    actions: {
      save: "Сохранить изменения",
      delete: "Удалить ребёнка",
      confirmDeleteTitle: "Точно удалить?",
      confirmDeleteMessage: "Профиль ребёнка будет удалён без возможности восстановления.",
      confirmDeleteCancel: "Отмена",
      confirmDeleteConfirm: "Да, удалить",
    },
  },
};

const en: TranslationTree = {
  tabs: {
    children: "Children",
    pillbox: "Pillbox",
    cabinet: "Cabinet",
    more: "More",
  },
  children: {
    header: {
      title: "Children",
      subtitle: "Children profiles and quick access to records.",
      addChild: "Add child",
    },
    actions: {
      sleep: "Sleep",
      feeding: "Feeding",
      observation: "Observe",
      profile: "Profile",
    },
  },
  childProfile: {
    backToChildren: "← Back to children",
    journalTitle: "Journal",
    notesTitle: "Notes",
    notesBody:
      "Use this space for important observations: reaction to medicines, mood, sleep, or questions for a doctor.",
    exportTitle: "Export history",
    exportCaption: "CSV / spreadsheet for doctor or family",
    editProfile: "Edit profile",
    stats: {
      age: "Age",
      weight: "Weight",
      height: "Height",
      allergies: "Allergies",
    },
  },
  exportSheet: {
    eyebrow: "EXPORT",
    title: "Share child data",
    subtitle: "Choose which data you need and for what period.",
    exportWhat: "What to export",
    period: "Period",
    saveCsv: "Save CSV",
    saveXlsx: "Save XLSX",
    options: {
      summary: "Summary",
      illness: "Illness",
      care: "Care",
      allFiles: "All files",
    },
    descriptions: {
      summary:
        "Growth, weight, sleep, feedings, and key metrics for the period.",
      illness: "Temperature, medicines, comments, and illness episodes.",
      care: "Separate tables for sleep, feedings, weight, and height.",
      allFiles: "Summary, illness, and care in one archive.",
    },
    periods: {
      twoWeeks: "2 weeks",
      month: "30 days",
      halfYear: "6 months",
      all: "All time",
    },
  },
  editProfileScreen: {
    backToProfile: "Back to child profile",
    title: "Edit profile",
    subtitle: "Core details and Edik's settings.",
    changePhoto: "Change icon",
    sections: {
      main: "Core details",
      health: "Health and notes",
      settings: "Settings",
    },
    rows: {
      childName: "Child name",
      birthDate: "Birth date",
      allergies: "Allergies",
      notes: "Notes",
      babyMode: "Baby mode",
    },
    descriptions: {
      allergies: "Nuts, seasonal allergy",
      notes: "Important observations and comments",
      babyMode: "Adds sleep, feeding, and day history.",
    },
    values: {
      birthDate: "4 February 2022",
    },
    actions: {
      save: "Save changes",
      delete: "Delete child",
      confirmDeleteTitle: "Delete child?",
      confirmDeleteMessage: "This child profile will be deleted permanently.",
      confirmDeleteCancel: "Cancel",
      confirmDeleteConfirm: "Yes, delete",
    },
  },
};

const pl: TranslationTree = {
  tabs: {
    children: "Dzieci",
    pillbox: "Pudełko leków",
    cabinet: "Apteczka",
    more: "Więcej",
  },
  children: {
    header: {
      title: "Dzieci",
      subtitle: "Profile dzieci i szybki dostęp do wpisów.",
      addChild: "Dodaj dziecko",
    },
    actions: {
      sleep: "Sen",
      feeding: "Karmienie",
      observation: "Obserwuj",
      profile: "Profil",
    },
  },
  childProfile: {
    backToChildren: "← Do dzieci",
    journalTitle: "Dziennik",
    notesTitle: "Notatki",
    notesBody:
      "Tutaj możesz zapisać ważne obserwacje: reakcję na leki, nastrój, sen lub pytania do lekarza.",
    exportTitle: "Eksport historii",
    exportCaption: "CSV / arkusz dla lekarza lub rodziny",
    editProfile: "Edytuj profil",
    stats: {
      age: "Wiek",
      weight: "Waga",
      height: "Wzrost",
      allergies: "Alergie",
    },
  },
  exportSheet: {
    eyebrow: "EKSPORT",
    title: "Udostępnij dane dziecka",
    subtitle: "Wybierz, jakie dane są potrzebne i za jaki okres.",
    exportWhat: "Co eksportować",
    period: "Okres",
    saveCsv: "Zapisz CSV",
    saveXlsx: "Zapisz XLSX",
    options: {
      summary: "Podsumowanie",
      illness: "Choroby",
      care: "Opieka",
      allFiles: "Wszystkie pliki",
    },
    descriptions: {
      summary: "Wzrost, waga, sen, karmienia i ogólne wskaźniki za wybrany okres.",
      illness: "Temperatura, leki, komentarze i epizody choroby.",
      care: "Osobne tabele ze snem, karmieniami, wagą i wzrostem.",
      allFiles: "Podsumowanie, choroby i opieka w jednym archiwum.",
    },
    periods: {
      twoWeeks: "2 tygodnie",
      month: "30 dni",
      halfYear: "6 miesięcy",
      all: "Cały okres",
    },
  },
  editProfileScreen: {
    backToProfile: "Do profilu dziecka",
    title: "Edytuj profil",
    subtitle: "Podstawowe dane i ustawienia Edika.",
    changePhoto: "Zmień ikonę",
    sections: {
      main: "Dane podstawowe",
      health: "Zdrowie i notatki",
      settings: "Ustawienia",
    },
    rows: {
      childName: "Imię dziecka",
      birthDate: "Data urodzenia",
      allergies: "Alergie",
      notes: "Notatki",
      babyMode: "Tryb malucha",
    },
    descriptions: {
      allergies: "Orzechy, alergia sezonowa",
      notes: "Ważne obserwacje i komentarze",
      babyMode: "Dodaje sen, karmienie i historię dnia.",
    },
    values: {
      birthDate: "4 lutego 2022",
    },
    actions: {
      save: "Zapisz zmiany",
      delete: "Usuń dziecko",
      confirmDeleteTitle: "Usunąć dziecko?",
      confirmDeleteMessage: "Profil dziecka zostanie usunięty bez możliwości przywrócenia.",
      confirmDeleteCancel: "Anuluj",
      confirmDeleteConfirm: "Tak, usuń",
    },
  },
};

const de: TranslationTree = {
  tabs: {
    children: "Kinder",
    pillbox: "Pillenbox",
    cabinet: "Hausapotheke",
    more: "Mehr",
  },
  children: {
    header: {
      title: "Kinder",
      subtitle: "Kinderprofile und schneller Zugriff auf Einträge.",
      addChild: "Kind hinzufügen",
    },
    actions: {
      sleep: "Schlaf",
      feeding: "Fütterung",
      observation: "Beobachten",
      profile: "Profil",
    },
  },
  childProfile: {
    backToChildren: "← Zu den Kindern",
    journalTitle: "Journal",
    notesTitle: "Notizen",
    notesBody:
      "Hier können Sie wichtige Beobachtungen festhalten: Reaktionen auf Medikamente, Stimmung, Schlaf oder Fragen an den Arzt.",
    exportTitle: "Verlauf exportieren",
    exportCaption: "CSV / Tabelle für Arzt oder Familie",
    editProfile: "Profil bearbeiten",
    stats: {
      age: "Alter",
      weight: "Gewicht",
      height: "Größe",
      allergies: "Allergien",
    },
  },
  exportSheet: {
    eyebrow: "EXPORT",
    title: "Kinderdaten teilen",
    subtitle: "Wählen Sie aus, welche Daten und für welchen Zeitraum benötigt werden.",
    exportWhat: "Was exportieren",
    period: "Zeitraum",
    saveCsv: "CSV speichern",
    saveXlsx: "XLSX speichern",
    options: {
      summary: "Übersicht",
      illness: "Krankheiten",
      care: "Pflege",
      allFiles: "Alle Dateien",
    },
    descriptions: {
      summary:
        "Wachstum, Gewicht, Schlaf, Fütterungen und wichtige Kennzahlen für den Zeitraum.",
      illness: "Temperatur, Medikamente, Kommentare und Krankheitsepisoden.",
      care: "Getrennte Tabellen für Schlaf, Fütterungen, Gewicht und Größe.",
      allFiles: "Übersicht, Krankheiten und Pflege in einem Archiv.",
    },
    periods: {
      twoWeeks: "2 Wochen",
      month: "30 Tage",
      halfYear: "6 Monate",
      all: "Gesamter Zeitraum",
    },
  },
  editProfileScreen: {
    backToProfile: "Zum Kinderprofil",
    title: "Profil bearbeiten",
    subtitle: "Wichtige Daten und Einstellungen von Edik.",
    changePhoto: "Icon ändern",
    sections: {
      main: "Grunddaten",
      health: "Gesundheit und Notizen",
      settings: "Einstellungen",
    },
    rows: {
      childName: "Name des Kindes",
      birthDate: "Geburtsdatum",
      allergies: "Allergien",
      notes: "Notizen",
      babyMode: "Babymodus",
    },
    descriptions: {
      allergies: "Nüsse, saisonale Allergie",
      notes: "Wichtige Beobachtungen und Kommentare",
      babyMode: "Fügt Schlaf, Fütterung und Tagesverlauf hinzu.",
    },
    values: {
      birthDate: "4. Februar 2022",
    },
    actions: {
      save: "Änderungen speichern",
      delete: "Kind löschen",
      confirmDeleteTitle: "Kind löschen?",
      confirmDeleteMessage: "Dieses Kinderprofil wird dauerhaft gelöscht.",
      confirmDeleteCancel: "Abbrechen",
      confirmDeleteConfirm: "Ja, löschen",
    },
  },
};

const translations: Record<MobileLocale, TranslationTree> = {
  ru,
  en,
  pl,
  de,
};

type MobileI18nContextValue = {
  locale: MobileLocale;
  setLocale: (locale: MobileLocale) => void;
  copy: TranslationTree;
};

const MobileI18nContext = createContext<MobileI18nContextValue | null>(null);

export function MobileI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<MobileLocale>("ru");

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: translations[locale],
    }),
    [locale],
  );

  return (
    <MobileI18nContext.Provider value={value}>
      {children}
    </MobileI18nContext.Provider>
  );
}

export function useMobileI18n() {
  const context = useContext(MobileI18nContext);

  if (!context) {
    throw new Error("useMobileI18n must be used within MobileI18nProvider");
  }

  return context;
}
