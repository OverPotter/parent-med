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
