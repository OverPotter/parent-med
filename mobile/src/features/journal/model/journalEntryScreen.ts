import { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type JournalEntryKind = "feeding" | "sleep" | "weight" | "height";

export type JournalEntryRow = {
  id: string;
  label: string;
  value: string;
  helper?: string;
};

export type JournalEntryOption = {
  id: string;
  label: string;
};

export type JournalEntryScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  sectionTitle: string;
  rows: JournalEntryRow[];
  feedingOptions?: JournalEntryOption[];
  notesTitle: string;
  notesBody: string;
  primaryActionLabel: string;
};

function formatJournalWeight(locale: MobileLocale, value: string) {
  return locale === "ru" ? `${value} кг` : `${value} kg`;
}

function formatJournalHeight(locale: MobileLocale, value: string) {
  return locale === "ru" ? `${value} см` : `${value} cm`;
}

function formatJournalDelta(
  locale: MobileLocale,
  value: string,
  unit: "kg" | "cm",
) {
  if (locale === "ru") {
    return unit === "kg" ? `+${value} кг` : `+${value} см`;
  }

  return `+${value} ${unit}`;
}

function getJournalEmptyValue() {
  return "—";
}

function getJournalEmptyNote(
  locale: MobileLocale,
  kind: "sleep" | "weight" | "height",
) {
  if (locale === "ru") {
    if (kind === "sleep") {
      return "Добавьте детали сна, если хотите сохранить их в записи.";
    }
    return "Добавьте комментарий к измерению, если это важно.";
  }
  if (locale === "de") {
    if (kind === "sleep") {
      return "Fügen Sie Schlafdetails hinzu, wenn sie im Eintrag gespeichert werden sollen.";
    }
    return "Fügen Sie bei Bedarf einen Kommentar zur Messung hinzu.";
  }
  if (locale === "pl") {
    if (kind === "sleep") {
      return "Dodaj szczegóły snu, jeśli chcesz zapisać je we wpisie.";
    }
    return "W razie potrzeby dodaj komentarz do pomiaru.";
  }
  if (kind === "sleep") {
    return "Add sleep details if you want them saved in the entry.";
  }
  return "Add a measurement note if needed.";
}

export function buildJournalEntryScreenContent(
  kind: JournalEntryKind,
  locale: MobileLocale,
): JournalEntryScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  const common = {
    backLabel: isRu ? "К детям" : isDe ? "Zu den Kindern" : isPl ? "Do dzieci" : "Back to children",
    notesTitle: isRu ? "Заметка" : isDe ? "Notiz" : isPl ? "Notatka" : "Note",
    primaryActionLabel: isRu ? "Сохранить запись" : isDe ? "Eintrag speichern" : isPl ? "Zapisz wpis" : "Save entry",
  };

  if (kind === "feeding") {
    return {
      ...common,
      title: isRu ? "Кормление" : isDe ? "Fütterung" : isPl ? "Karmienie" : "Feeding",
      subtitle: isRu ? "Запись кормления." : isDe ? "Fütterungseintrag." : isPl ? "Wpis karmienia." : "Feeding entry.",
      sectionTitle: isRu ? "Что записать" : isDe ? "Was speichern" : isPl ? "Co zapisać" : "What to record",
      rows: [],
      feedingOptions: [
        {
          id: "breast",
          label: isRu ? "Грудь" : isDe ? "Brust" : isPl ? "Pierś" : "Breast",
        },
        {
          id: "formula",
          label: isRu
            ? "Смесь"
            : isDe
              ? "Formula"
              : isPl
                ? "Mieszanka"
                : "Formula",
        },
      ],
      notesTitle: isRu ? "Заметка к кормлению" : isDe ? "Notiz zur Fütterung" : isPl ? "Notatka do karmienia" : "Feeding note",
      notesBody: isRu
        ? "Можно быстро запустить таймер или сохранить запись задним числом."
        : isDe
          ? "Sie können schnell einen Timer starten oder den Eintrag nachträglich speichern."
        : isPl
          ? "Możesz szybko uruchomić timer albo zapisać wpis z wcześniejszą godziną."
        : "You can quickly start a timer or save the feeding backdated.",
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  if (kind === "sleep") {
    return {
      ...common,
      title: isRu ? "Сон" : isDe ? "Schlaf" : isPl ? "Sen" : "Sleep",
      subtitle: isRu
        ? "Запись сна с теми же карточками и логикой."
        : isDe
          ? "Schlafeintrag mit derselben Kartenlogik und Struktur."
        : isPl
          ? "Wpis snu z tym samym układem kart i logiką."
        : "Sleep entry using the same card and layout logic.",
      sectionTitle: isRu ? "Детали сна" : isDe ? "Schlafdetails" : isPl ? "Szczegóły snu" : "Sleep details",
      rows: [
        {
          id: "start",
          label: isRu ? "Начало" : isDe ? "Beginn" : isPl ? "Początek" : "Start",
          value: getJournalEmptyValue(),
        },
        {
          id: "end",
          label: isRu ? "Окончание" : isDe ? "Ende" : isPl ? "Koniec" : "End",
          value: getJournalEmptyValue(),
        },
        {
          id: "duration",
          label: isRu ? "Длительность" : isDe ? "Dauer" : isPl ? "Czas trwania" : "Duration",
          value: getJournalEmptyValue(),
        },
      ],
      notesTitle: isRu ? "Заметка ко сну" : isDe ? "Notiz zum Schlaf" : isPl ? "Notatka do snu" : "Sleep note",
      notesBody: getJournalEmptyNote(locale, "sleep"),
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  if (kind === "weight") {
    return {
      ...common,
      title: isRu ? "Вес" : isDe ? "Gewicht" : isPl ? "Waga" : "Weight",
      subtitle: isRu
        ? "Тот же экран записи, но для измерений роста и веса."
        : isDe
          ? "Dasselbe Eingabemuster, aber für Größen- und Gewichtsmessungen."
        : isPl
          ? "Ten sam ekran wpisu, ale dla pomiarów wzrostu i wagi."
        : "The same entry screen pattern for growth measurements.",
      sectionTitle: isRu ? "Детали измерения" : isDe ? "Messdetails" : isPl ? "Szczegóły pomiaru" : "Measurement details",
      rows: [
        {
          id: "value",
          label: isRu ? "Вес" : isDe ? "Gewicht" : isPl ? "Waga" : "Weight",
          value: getJournalEmptyValue(),
        },
        {
          id: "date",
          label: isRu ? "Дата" : isDe ? "Datum" : isPl ? "Data" : "Date",
          value: getJournalEmptyValue(),
        },
        {
          id: "delta",
          label: isRu ? "Изменение" : isDe ? "Änderung" : isPl ? "Zmiana" : "Change",
          value: getJournalEmptyValue(),
          helper: isRu ? "с прошлого измерения" : isDe ? "seit der letzten Messung" : isPl ? "od poprzedniego pomiaru" : "since previous measurement",
        },
      ],
      notesTitle: isRu ? "Заметка к весу" : isDe ? "Notiz zum Gewicht" : isPl ? "Notatka do wagi" : "Weight note",
      notesBody: getJournalEmptyNote(locale, "weight"),
      primaryActionLabel: common.primaryActionLabel,
    };
  }

  return {
    ...common,
    title: isRu ? "Рост" : isDe ? "Größe" : isPl ? "Wzrost" : "Height",
    subtitle: isRu
      ? "Тот же экран записи, но для измерений роста и веса."
      : isDe
        ? "Dasselbe Eingabemuster, aber für Größen- und Gewichtsmessungen."
      : isPl
        ? "Ten sam ekran wpisu, ale dla pomiarów wzrostu i wagi."
      : "The same entry screen pattern for growth measurements.",
    sectionTitle: isRu ? "Детали измерения" : isDe ? "Messdetails" : isPl ? "Szczegóły pomiaru" : "Measurement details",
    rows: [
      {
        id: "value",
        label: isRu ? "Рост" : isDe ? "Größe" : isPl ? "Wzrost" : "Height",
        value: getJournalEmptyValue(),
      },
      {
        id: "date",
        label: isRu ? "Дата" : isDe ? "Datum" : isPl ? "Data" : "Date",
        value: getJournalEmptyValue(),
      },
      {
        id: "delta",
        label: isRu ? "Изменение" : isDe ? "Änderung" : isPl ? "Zmiana" : "Change",
        value: getJournalEmptyValue(),
        helper: isRu ? "с прошлого измерения" : isDe ? "seit der letzten Messung" : isPl ? "od poprzedniego pomiaru" : "since previous measurement",
      },
    ],
    notesTitle: isRu ? "Заметка к росту" : isDe ? "Notiz zur Größe" : isPl ? "Notatka do wzrostu" : "Height note",
    notesBody: getJournalEmptyNote(locale, "height"),
    primaryActionLabel: common.primaryActionLabel,
  };
}
