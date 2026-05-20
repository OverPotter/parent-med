import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type SleepDialogCopy = {
  title: string;
  message: string;
  confirm: string;
  cancel?: string;
};

export function localizeRangeSheetSubtitle(locale: MobileLocale) {
  if (locale === "ru") return "Выберите диапазон, чтобы посмотреть свои даты.";
  if (locale === "de") return "Wähle einen eigenen Zeitraum für die Anzeige.";
  if (locale === "pl") return "Wybierz własny zakres dat do podglądu.";
  return "Choose a custom date range to review data.";
}

export function buildSleepDeleteDialogCopy(
  locale: MobileLocale,
): SleepDialogCopy {
  if (locale === "ru") {
    return {
      title: "Точно удалить?",
      message: "Запись сна будет удалена без возможности восстановления.",
      cancel: "Нет",
      confirm: "Да, удалить",
    };
  }

  if (locale === "de") {
    return {
      title: "Wirklich löschen?",
      message: "Der Schlafeintrag wird ohne Wiederherstellung gelöscht.",
      cancel: "Nein",
      confirm: "Ja, löschen",
    };
  }

  if (locale === "pl") {
    return {
      title: "Na pewno usunąć?",
      message: "Wpis snu zostanie usunięty bez możliwości przywrócenia.",
      cancel: "Nie",
      confirm: "Tak, usuń",
    };
  }

  return {
    title: "Are you sure?",
    message: "This sleep record will be deleted permanently.",
    cancel: "No",
    confirm: "Yes, delete",
  };
}

export function buildSleepDeleteErrorCopy(
  locale: MobileLocale,
): SleepDialogCopy {
  if (locale === "ru") {
    return {
      title: "Не удалось удалить",
      message: "Попробуй ещё раз.",
      confirm: "Понятно",
    };
  }

  if (locale === "de") {
    return {
      title: "Löschen fehlgeschlagen",
      message: "Bitte versuche es erneut.",
      confirm: "Verstanden",
    };
  }

  if (locale === "pl") {
    return {
      title: "Nie udało się usunąć",
      message: "Spróbuj ponownie.",
      confirm: "Rozumiem",
    };
  }

  return {
    title: "Delete failed",
    message: "Please try again.",
    confirm: "OK",
  };
}

export function buildSleepLoadErrorCopy(
  locale: MobileLocale,
): SleepDialogCopy {
  if (locale === "ru") {
    return {
      title: "Не удалось загрузить сон",
      message: "Проверь соединение и попробуй ещё раз.",
      confirm: "Понятно",
    };
  }

  if (locale === "de") {
    return {
      title: "Schlafdaten konnten nicht geladen werden",
      message: "Bitte prüfe die Verbindung und versuche es erneut.",
      confirm: "Verstanden",
    };
  }

  if (locale === "pl") {
    return {
      title: "Nie udało się załadować snu",
      message: "Sprawdź połączenie i spróbuj ponownie.",
      confirm: "Rozumiem",
    };
  }

  return {
    title: "Failed to load sleep history",
    message: "Check your connection and try again.",
    confirm: "OK",
  };
}
