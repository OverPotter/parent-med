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
      liveActivity: string;
    };
    descriptions: {
      allergies: string;
      notes: string;
      babyMode: string;
      liveActivity: string;
    };
    values: {
      birthDate: string;
    };
    actions: {
      save: string;
      delete: string;
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
    changePhoto: "Сменить фото",
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
      liveActivity: "Live Activity",
    },
    descriptions: {
      allergies: "Орехи, сезонная аллергия",
      notes: "Важные наблюдения и комментарии",
      babyMode: "Добавляет сон, кормление и историю дня.",
      liveActivity: "Показывать события на экране блокировки.",
    },
    values: {
      birthDate: "4 февраля 2022",
    },
    actions: {
      save: "Сохранить изменения",
      delete: "Удалить ребёнка",
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
    changePhoto: "Change photo",
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
      liveActivity: "Live Activity",
    },
    descriptions: {
      allergies: "Nuts, seasonal allergy",
      notes: "Important observations and comments",
      babyMode: "Adds sleep, feeding, and day history.",
      liveActivity: "Show events on the lock screen.",
    },
    values: {
      birthDate: "4 February 2022",
    },
    actions: {
      save: "Save changes",
      delete: "Delete child",
    },
  },
};

const pl: TranslationTree = en;

const de: TranslationTree = en;

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
