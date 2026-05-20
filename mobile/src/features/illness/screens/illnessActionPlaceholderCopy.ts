import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { IllnessQuickActionKind } from "../model/illnessObservation";

export type IllnessActionUiLocale = "ru" | "en" | "de" | "pl";
export type IllnessDeletableEntryKind =
  | "temperature"
  | "note"
  | "medicine"
  | "reminder";

export const placeholderCopyByKind = {
  temperature: {
    ru: {
      title: "Температура",
      subtitle: "Быстро сохраните новый замер в журнал наблюдения.",
      body: "Добавьте значение в градусах Цельсия. Сохранённый замер сразу попадёт в ленту эпизода.",
      fieldLabel: "Температура",
      fieldPlaceholder: "36,6",
      fieldHint: "Допустимый диапазон: 32,0–43,0 °C",
      backdatedTitle: "Задним числом",
      backdatedExpanded: "Выберите дату и время, если хотите записать замер позже.",
      timeLabel: "Время",
      dateLabel: "Другая дата",
      save: "Сохранить замер",
      cancel: "Назад",
      recentTitle: "Последние замеры",
      recentEmpty: "Пока нет ни одного замера температуры.",
      errorRequired: "Введите температуру.",
      errorInvalid: "Введите число в формате 36,6.",
      errorRange: "Температура должна быть в диапазоне 32,0–43,0 °C.",
    },
    en: {
      title: "Temperature",
      subtitle: "Quickly save a new reading to the illness journal.",
      body: "Add the value in Celsius. The saved reading will appear in the episode feed right away.",
      fieldLabel: "Temperature",
      fieldPlaceholder: "37.0",
      fieldHint: "Allowed range: 32.0–43.0 °C",
      backdatedTitle: "Backdated",
      backdatedExpanded: "Pick another date and time if you need an earlier entry.",
      timeLabel: "Time",
      dateLabel: "Other date",
      save: "Save reading",
      cancel: "Back",
      recentTitle: "Recent readings",
      recentEmpty: "No temperature readings yet.",
      errorRequired: "Enter a temperature value.",
      errorInvalid: "Use a number like 37.0.",
      errorRange: "Temperature must be within 32.0–43.0 °C.",
    },
    de: {
      title: "Temperatur",
      subtitle: "Speichere schnell eine neue Messung im Krankheitsjournal.",
      body: "Füge den Wert in Celsius hinzu. Die gespeicherte Messung erscheint sofort in der Episodenliste.",
      fieldLabel: "Temperatur",
      fieldPlaceholder: "37,0",
      fieldHint: "Erlaubter Bereich: 32,0–43,0 °C",
      backdatedTitle: "Rückwirkend",
      backdatedExpanded: "Wähle Datum und Uhrzeit, wenn du die Messung nachträglich eintragen willst.",
      timeLabel: "Uhrzeit",
      dateLabel: "Anderes Datum",
      save: "Messung speichern",
      cancel: "Zurück",
      recentTitle: "Letzte Messungen",
      recentEmpty: "Noch keine Temperaturmessungen.",
      errorRequired: "Gib eine Temperatur ein.",
      errorInvalid: "Verwende eine Zahl wie 37,0.",
      errorRange: "Die Temperatur muss zwischen 32,0 und 43,0 °C liegen.",
    },
    pl: {
      title: "Temperatura",
      subtitle: "Szybko zapisz nowy pomiar w dzienniku choroby.",
      body: "Dodaj wartość w stopniach Celsjusza. Zapisany pomiar od razu pojawi się na osi epizodu.",
      fieldLabel: "Temperatura",
      fieldPlaceholder: "37,0",
      fieldHint: "Dozwolony zakres: 32,0–43,0 °C",
      backdatedTitle: "Wstecznie",
      backdatedExpanded: "Wybierz inną datę i godzinę, jeśli chcesz dodać wcześniejszy wpis.",
      timeLabel: "Godzina",
      dateLabel: "Inna data",
      save: "Zapisz pomiar",
      cancel: "Wstecz",
      recentTitle: "Ostatnie pomiary",
      recentEmpty: "Nie ma jeszcze żadnych pomiarów temperatury.",
      errorRequired: "Wpisz temperaturę.",
      errorInvalid: "Użyj liczby, np. 37,0.",
      errorRange: "Temperatura musi mieścić się w zakresie 32,0–43,0 °C.",
    },
  },
  medicine: {
    ru: {
      title: "Приём",
      subtitle: "Быстро отметьте, что и сколько дали ребёнку.",
      body: "",
      medicineLabel: "Что дали",
      medicinePlaceholder: "Например: Ибупрофен",
      amountLabel: "Сколько дали",
      amountPlaceholder: "Например: 5 мл или 1 таб.",
      fieldHint: "Приём сразу появится в ленте наблюдения.",
      backdatedTitle: "Задним числом",
      backdatedExpanded:
        "Выберите дату и время, если хотите добавить приём задним числом.",
      timeLabel: "Время",
      dateLabel: "Другая дата",
      save: "Сохранить приём",
      cancel: "Назад",
      recentTitle: "Последние приёмы",
      recentEmpty: "Пока нет ни одного приёма.",
      errorMedicineRequired: "Введите название лекарства.",
      errorAmountRequired: "Введите количество.",
    },
    en: {
      title: "Dose",
      subtitle: "Quickly record what and how much you gave the child.",
      body: "",
      medicineLabel: "What did you give",
      medicinePlaceholder: "For example: Ibuprofen",
      amountLabel: "How much",
      amountPlaceholder: "For example: 5 ml or 1 tablet",
      fieldHint: "The dose will appear in the observation feed right away.",
      backdatedTitle: "Backdated",
      backdatedExpanded:
        "Pick another date and time if you need to add the dose later.",
      timeLabel: "Time",
      dateLabel: "Other date",
      save: "Save dose",
      cancel: "Back",
      recentTitle: "Recent doses",
      recentEmpty: "No doses yet.",
      errorMedicineRequired: "Enter the medicine name.",
      errorAmountRequired: "Enter the amount.",
    },
    de: {
      title: "Einnahme",
      subtitle: "Halte schnell fest, was und wie viel du dem Kind gegeben hast.",
      body: "",
      medicineLabel: "Was gegeben",
      medicinePlaceholder: "Zum Beispiel: Ibuprofen",
      amountLabel: "Wie viel",
      amountPlaceholder: "Zum Beispiel: 5 ml oder 1 Tablette",
      fieldHint: "Die Einnahme erscheint sofort in der Beobachtungsliste.",
      backdatedTitle: "Rückwirkend",
      backdatedExpanded:
        "Wähle Datum und Uhrzeit, wenn du die Einnahme nachträglich hinzufügen willst.",
      timeLabel: "Uhrzeit",
      dateLabel: "Anderes Datum",
      save: "Einnahme speichern",
      cancel: "Zurück",
      recentTitle: "Letzte Einnahmen",
      recentEmpty: "Noch keine Einnahmen.",
      errorMedicineRequired: "Gib den Medikamentennamen ein.",
      errorAmountRequired: "Gib die Menge ein.",
    },
    pl: {
      title: "Podanie",
      subtitle: "Szybko zapisz, co i ile podano dziecku.",
      body: "",
      medicineLabel: "Co podano",
      medicinePlaceholder: "Na przykład: Ibuprofen",
      amountLabel: "Ile podano",
      amountPlaceholder: "Na przykład: 5 ml lub 1 tabletka",
      fieldHint: "Podanie od razu pojawi się na osi obserwacji.",
      backdatedTitle: "Wstecznie",
      backdatedExpanded:
        "Wybierz inną datę i godzinę, jeśli chcesz dodać wcześniejsze podanie.",
      timeLabel: "Godzina",
      dateLabel: "Inna data",
      save: "Zapisz podanie",
      cancel: "Wstecz",
      recentTitle: "Ostatnie podania",
      recentEmpty: "Nie ma jeszcze żadnych podań.",
      errorMedicineRequired: "Wpisz nazwę leku.",
      errorAmountRequired: "Wpisz ilość.",
    },
  },
  note: {
    ru: {
      title: "Заметка",
      subtitle: "Сохраните короткое наблюдение прямо в журнал болезни.",
      body: "",
      fieldLabel: "Текст заметки",
      fieldPlaceholder:
        "Например: уснул быстрее, стал активнее, пожаловался на горло…",
      backdatedTitle: "Задним числом",
      backdatedExpanded:
        "Выберите дату и время, если хотите добавить заметку задним числом.",
      timeLabel: "Время",
      dateLabel: "Другая дата",
      save: "Сохранить заметку",
      cancel: "Назад",
      recentTitle: "Последние заметки",
      recentEmpty: "Пока нет ни одной заметки.",
      errorRequired: "Введите текст заметки.",
      errorTooLong: "Заметка не должна быть длиннее 512 символов.",
    },
    en: {
      title: "Note",
      subtitle: "Save a short observation directly to the illness journal.",
      body: "",
      fieldLabel: "Note text",
      fieldPlaceholder:
        "For example: fell asleep faster, more active, complained about throat…",
      backdatedTitle: "Backdated",
      backdatedExpanded:
        "Pick another date and time if you need to add the note later.",
      timeLabel: "Time",
      dateLabel: "Other date",
      save: "Save note",
      cancel: "Back",
      recentTitle: "Recent notes",
      recentEmpty: "No notes yet.",
      errorRequired: "Enter note text.",
      errorTooLong: "Note must be 512 characters or fewer.",
    },
    de: {
      title: "Notiz",
      subtitle: "Speichere eine kurze Beobachtung direkt im Krankheitsjournal.",
      body: "",
      fieldLabel: "Notiztext",
      fieldPlaceholder:
        "Zum Beispiel: schneller eingeschlafen, aktiver, klagte über Halsweh…",
      backdatedTitle: "Rückwirkend",
      backdatedExpanded:
        "Wähle Datum und Uhrzeit, wenn du die Notiz nachträglich hinzufügen willst.",
      timeLabel: "Uhrzeit",
      dateLabel: "Anderes Datum",
      save: "Notiz speichern",
      cancel: "Zurück",
      recentTitle: "Letzte Notizen",
      recentEmpty: "Noch keine Notizen.",
      errorRequired: "Gib einen Notiztext ein.",
      errorTooLong: "Die Notiz darf nicht länger als 512 Zeichen sein.",
    },
    pl: {
      title: "Notatka",
      subtitle: "Zapisz krótką obserwację bezpośrednio w dzienniku choroby.",
      body: "",
      fieldLabel: "Treść notatki",
      fieldPlaceholder:
        "Na przykład: szybciej zasnął, jest bardziej aktywny, skarżył się na gardło…",
      backdatedTitle: "Wstecznie",
      backdatedExpanded:
        "Wybierz inną datę i godzinę, jeśli chcesz dodać wcześniejszą notatkę.",
      timeLabel: "Godzina",
      dateLabel: "Inna data",
      save: "Zapisz notatkę",
      cancel: "Wstecz",
      recentTitle: "Ostatnie notatki",
      recentEmpty: "Nie ma jeszcze żadnych notatek.",
      errorRequired: "Wpisz treść notatki.",
      errorTooLong: "Notatka nie może mieć więcej niż 512 znaków.",
    },
  },
  reminder: {
    ru: {
      title: "Напоминание",
      subtitle: "Укажите лекарство, дозу и момент, от которого считать первое напоминание.",
      body: "",
      medicineLabel: "Лекарство",
      medicinePlaceholder: "Например: Ибуклин",
      doseLabel: "Итоговая доза для напоминания",
      dosePlaceholder: "Например: 10 мл или 1 таб.",
      intervalLabel: "Интервал напоминания",
      intervalHelper: "Укажите интервал в минутах.",
      intervalPlaceholder: "Например: 180",
      dailyLimitLabel: "Лимит приёмов в сутки",
      dailyLimitHelper:
        "Необязательно. Заполняйте только если знаете точный максимум на сутки.",
      dailyLimitPlaceholder: "Если знаете",
      alreadyGivenTitle: "Лекарство уже давали?",
      alreadyGivenYes: "Да, уже давали",
      alreadyGivenNo: "Нет, ещё не давали",
      alreadyGivenExplainYes:
        "Первое напоминание пойдёт от времени последнего приёма.",
      alreadyGivenExplainNo:
        "Первое напоминание пойдёт от момента сохранения.",
      alreadyGivenEmpty:
        "Для этого лекарства ещё нет отмеченных приёмов в текущем наблюдении.",
      lastGivenLabel: "Когда давали последний раз?",
      lastGivenDetected: "Последний приём",
      alreadyGivenToday: "Сегодня отмечено",
      alreadyGivenOfLimit: "из",
      save: "Сохранить напоминание",
      cancel: "Отмена",
      recentTitle: "Последние напоминания",
      recentEmpty: "Пока нет ни одного напоминания.",
      errorMedicineRequired: "Введите название лекарства.",
      errorDoseRequired: "Введите дозу.",
      errorIntervalRequired: "Укажите интервал.",
      errorIntervalInvalid: "Укажите интервал от 30 минут до 24 часов.",
      errorDailyLimitInvalid: "Проверьте лимит приёмов в сутки.",
      errorLastGivenRequired: "Укажите время последнего приёма.",
    },
    en: {
      title: "Reminder",
      subtitle: "Set the medicine, dose, and the moment from which the first reminder should count.",
      body: "",
      medicineLabel: "Medicine",
      medicinePlaceholder: "For example: Ibuprofen",
      doseLabel: "Reminder dose",
      dosePlaceholder: "For example: 5 ml or 1 tablet",
      intervalLabel: "Reminder interval",
      intervalHelper: "Enter the interval in minutes.",
      intervalPlaceholder: "For example: 180",
      dailyLimitLabel: "Daily limit",
      dailyLimitHelper: "Optional. Use it only if you know the exact daily maximum.",
      dailyLimitPlaceholder: "If you know it",
      alreadyGivenTitle: "Has it already been given?",
      alreadyGivenYes: "Yes, already given",
      alreadyGivenNo: "No, not yet",
      alreadyGivenExplainYes: "The first reminder will count from the last dose time.",
      alreadyGivenExplainNo: "The first reminder will count from the moment you save it.",
      alreadyGivenEmpty: "No recorded doses for this medicine in the current observation yet.",
      lastGivenLabel: "When was the last dose?",
      lastGivenDetected: "Last dose",
      alreadyGivenToday: "Logged today",
      alreadyGivenOfLimit: "of",
      save: "Save reminder",
      cancel: "Cancel",
      recentTitle: "Recent reminders",
      recentEmpty: "No reminders yet.",
      errorMedicineRequired: "Enter the medicine name.",
      errorDoseRequired: "Enter the dose.",
      errorIntervalRequired: "Enter the interval.",
      errorIntervalInvalid: "Enter an interval between 30 minutes and 24 hours.",
      errorDailyLimitInvalid: "Check the daily limit.",
      errorLastGivenRequired: "Select the last dose time.",
    },
    de: {
      title: "Erinnerung",
      subtitle: "Lege Medikament, Dosis und den Zeitpunkt fest, ab dem die erste Erinnerung gezählt werden soll.",
      body: "",
      medicineLabel: "Medikament",
      medicinePlaceholder: "Zum Beispiel: Ibuprofen",
      doseLabel: "Dosis für die Erinnerung",
      dosePlaceholder: "Zum Beispiel: 5 ml oder 1 Tablette",
      intervalLabel: "Erinnerungsintervall",
      intervalHelper: "Gib das Intervall in Minuten an.",
      intervalPlaceholder: "Zum Beispiel: 180",
      dailyLimitLabel: "Tageslimit",
      dailyLimitHelper: "Optional. Nur eintragen, wenn du das genaue Tagesmaximum kennst.",
      dailyLimitPlaceholder: "Falls bekannt",
      alreadyGivenTitle: "Schon gegeben?",
      alreadyGivenYes: "Ja, schon gegeben",
      alreadyGivenNo: "Nein, noch nicht",
      alreadyGivenExplainYes:
        "Die erste Erinnerung zählt ab der Uhrzeit der letzten Einnahme.",
      alreadyGivenExplainNo:
        "Die erste Erinnerung zählt ab dem Moment des Speicherns.",
      alreadyGivenEmpty: "Für dieses Medikament gibt es in der aktuellen Beobachtung noch keine erfassten Einnahmen.",
      lastGivenLabel: "Wann war die letzte Einnahme?",
      lastGivenDetected: "Letzte Einnahme",
      alreadyGivenToday: "Heute erfasst",
      alreadyGivenOfLimit: "von",
      save: "Erinnerung speichern",
      cancel: "Abbrechen",
      recentTitle: "Letzte Erinnerungen",
      recentEmpty: "Noch keine Erinnerungen.",
      errorMedicineRequired: "Gib den Medikamentennamen ein.",
      errorDoseRequired: "Gib die Dosis ein.",
      errorIntervalRequired: "Gib das Intervall ein.",
      errorIntervalInvalid: "Gib ein Intervall zwischen 30 Minuten und 24 Stunden an.",
      errorDailyLimitInvalid: "Prüfe das Tageslimit.",
      errorLastGivenRequired: "Wähle die Zeit der letzten Einnahme.",
    },
    pl: {
      title: "Przypomnienie",
      subtitle: "Ustaw lek, dawkę i moment, od którego ma liczyć się pierwsze przypomnienie.",
      body: "",
      medicineLabel: "Lek",
      medicinePlaceholder: "Na przykład: Ibuprofen",
      doseLabel: "Dawka dla przypomnienia",
      dosePlaceholder: "Na przykład: 5 ml lub 1 tabletka",
      intervalLabel: "Interwał przypomnienia",
      intervalHelper: "Podaj interwał w minutach.",
      intervalPlaceholder: "Na przykład: 180",
      dailyLimitLabel: "Limit na dobę",
      dailyLimitHelper: "Opcjonalne. Wpisz tylko wtedy, gdy znasz dokładny limit dobowy.",
      dailyLimitPlaceholder: "Jeśli wiesz",
      alreadyGivenTitle: "Czy lek już podano?",
      alreadyGivenYes: "Tak, już podano",
      alreadyGivenNo: "Nie, jeszcze nie",
      alreadyGivenExplainYes:
        "Pierwsze przypomnienie będzie liczone od czasu ostatniego podania.",
      alreadyGivenExplainNo:
        "Pierwsze przypomnienie będzie liczone od chwili zapisania.",
      alreadyGivenEmpty: "Dla tego leku nie ma jeszcze odnotowanych podań w bieżącej obserwacji.",
      lastGivenLabel: "Kiedy podano ostatnio?",
      lastGivenDetected: "Ostatnie podanie",
      alreadyGivenToday: "Dzisiaj zapisano",
      alreadyGivenOfLimit: "z",
      save: "Zapisz przypomnienie",
      cancel: "Anuluj",
      recentTitle: "Ostatnie przypomnienia",
      recentEmpty: "Nie ma jeszcze żadnych przypomnień.",
      errorMedicineRequired: "Wpisz nazwę leku.",
      errorDoseRequired: "Wpisz dawkę.",
      errorIntervalRequired: "Wpisz interwał.",
      errorIntervalInvalid: "Podaj interwał od 30 minut do 24 godzin.",
      errorDailyLimitInvalid: "Sprawdź limit na dobę.",
      errorLastGivenRequired: "Wybierz czas ostatniego podania.",
    },
  },
} as const;

export function toIllnessActionUiLocale(locale: MobileLocale): IllnessActionUiLocale {
  return locale === "ru" || locale === "de" || locale === "pl" ? locale : "en";
}

export function getIllnessActionPlaceholderBundle(
  uiLocale: IllnessActionUiLocale,
  kind: IllnessQuickActionKind,
) {
  return {
    copy: placeholderCopyByKind[kind][uiLocale],
    temperatureCopy: placeholderCopyByKind.temperature[uiLocale],
    noteCopy: placeholderCopyByKind.note[uiLocale],
    medicineCopy: placeholderCopyByKind.medicine[uiLocale],
    reminderCopy: placeholderCopyByKind.reminder[uiLocale],
  };
}

export function buildIllnessActionDeleteCopy(
  locale: IllnessActionUiLocale,
  kind: IllnessDeletableEntryKind | null,
) {
  if (kind === "reminder") {
    return locale === "ru"
      ? {
          title: "Удалить напоминание?",
          description: "Это напоминание исчезнет из текущего журнала наблюдения.",
          cancel: "Нет",
          confirm: "Удалить",
        }
      : locale === "de"
        ? {
            title: "Erinnerung löschen?",
            description: "Diese Erinnerung wird aus dem aktuellen Beobachtungsjournal entfernt.",
            cancel: "Nein",
            confirm: "Löschen",
          }
        : locale === "pl"
          ? {
              title: "Usunąć przypomnienie?",
              description: "To przypomnienie zostanie usunięte z bieżącego dziennika obserwacji.",
              cancel: "Nie",
              confirm: "Usuń",
            }
          : {
              title: "Delete reminder?",
              description: "This reminder will be removed from the current observation journal.",
              cancel: "No",
              confirm: "Delete",
            };
  }

  if (kind === "medicine") {
    return locale === "ru"
      ? {
          title: "Удалить приём?",
          description: "Эта запись приёма исчезнет из текущего журнала наблюдения.",
          cancel: "Нет",
          confirm: "Удалить",
        }
      : locale === "de"
        ? {
            title: "Einnahme löschen?",
            description: "Dieser Einnahme-Eintrag wird aus dem aktuellen Beobachtungsjournal entfernt.",
            cancel: "Nein",
            confirm: "Löschen",
          }
        : locale === "pl"
          ? {
              title: "Usunąć podanie?",
              description: "Ten wpis podania zostanie usunięty z bieżącego dziennika obserwacji.",
              cancel: "Nie",
              confirm: "Usuń",
            }
          : {
              title: "Delete dose?",
              description: "This dose record will be removed from the current observation journal.",
              cancel: "No",
              confirm: "Delete",
            };
  }

  if (kind === "note") {
    return locale === "ru"
      ? {
          title: "Удалить заметку?",
          description: "Эта заметка исчезнет из текущего журнала наблюдения.",
          cancel: "Нет",
          confirm: "Удалить",
        }
      : locale === "de"
        ? {
            title: "Notiz löschen?",
            description: "Diese Notiz wird aus dem aktuellen Beobachtungsjournal entfernt.",
            cancel: "Nein",
            confirm: "Löschen",
          }
        : locale === "pl"
          ? {
              title: "Usunąć notatkę?",
              description: "Ta notatka zostanie usunięta z bieżącego dziennika obserwacji.",
              cancel: "Nie",
              confirm: "Usuń",
            }
          : {
              title: "Delete note?",
              description: "This note will be removed from the current observation journal.",
              cancel: "No",
              confirm: "Delete",
            };
  }

  return locale === "ru"
    ? {
        title: "Удалить замер?",
        description: "Запись температуры исчезнет из текущего журнала наблюдения.",
        cancel: "Нет",
        confirm: "Удалить",
      }
    : locale === "de"
      ? {
          title: "Messung löschen?",
          description: "Dieser Temperatureintrag wird aus dem aktuellen Beobachtungsjournal entfernt.",
          cancel: "Nein",
          confirm: "Löschen",
        }
      : locale === "pl"
        ? {
            title: "Usunąć pomiar?",
            description: "Ten wpis temperatury zostanie usunięty z bieżącego dziennika obserwacji.",
            cancel: "Nie",
            confirm: "Usuń",
          }
        : {
            title: "Delete reading?",
            description: "This temperature record will be removed from the current observation journal.",
            cancel: "No",
            confirm: "Delete",
          };
}
