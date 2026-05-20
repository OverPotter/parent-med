import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function buildWeightMeasurementSheetCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Добавить измерение",
      subtitle: "Сохраним новый вес ребёнка в историю.",
      weightLabel: "Вес",
      weightPlaceholder: "Например, 12.4",
      invalidWeight: "Введите корректный вес.",
      saveError: "Не удалось сохранить измерение. Попробуй ещё раз.",
      rangeSubtitle: "Выберите диапазон, чтобы посмотреть свои даты.",
      cancel: "Отмена",
      save: "Сохранить",
      saving: "Сохраняем...",
    };
  }

  if (locale === "de") {
    return {
      title: "Messung hinzufügen",
      subtitle: "Wir speichern das neue Gewicht des Kindes im Verlauf.",
      weightLabel: "Gewicht",
      weightPlaceholder: "Zum Beispiel 12.4",
      invalidWeight: "Bitte gib ein korrektes Gewicht ein.",
      saveError:
        "Die Messung konnte nicht gespeichert werden. Bitte versuche es erneut.",
      rangeSubtitle: "Wähle einen eigenen Zeitraum für die Anzeige.",
      cancel: "Abbrechen",
      save: "Speichern",
      saving: "Wird gespeichert...",
    };
  }

  if (locale === "pl") {
    return {
      title: "Dodaj pomiar",
      subtitle: "Zapiszemy nową wagę dziecka w historii.",
      weightLabel: "Waga",
      weightPlaceholder: "Na przykład 12.4",
      invalidWeight: "Wprowadź poprawną wagę.",
      saveError: "Nie udało się zapisać pomiaru. Spróbuj ponownie.",
      rangeSubtitle: "Wybierz własny zakres dat do podglądu.",
      cancel: "Anuluj",
      save: "Zapisz",
      saving: "Zapisywanie...",
    };
  }

  return {
    title: "Add measurement",
    subtitle: "We will save the new child weight in history.",
    weightLabel: "Weight",
    weightPlaceholder: "For example 12.4",
    invalidWeight: "Enter a valid weight.",
    saveError: "Failed to save measurement. Please try again.",
    rangeSubtitle: "Choose a custom date range to review data.",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
  };
}

export function buildWeightDeleteDialogCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Точно удалить?",
      message: "Запись веса будет удалена без возможности восстановления.",
      cancel: "Нет",
      confirm: "Да, удалить",
    };
  }

  if (locale === "de") {
    return {
      title: "Wirklich löschen?",
      message: "Der Gewichtseintrag wird ohne Wiederherstellung gelöscht.",
      cancel: "Nein",
      confirm: "Ja, löschen",
    };
  }

  if (locale === "pl") {
    return {
      title: "Na pewno usunąć?",
      message: "Wpis wagi zostanie usunięty bez możliwości przywrócenia.",
      cancel: "Nie",
      confirm: "Tak, usuń",
    };
  }

  return {
    title: "Are you sure?",
    message: "This weight record will be deleted permanently.",
    cancel: "No",
    confirm: "Yes, delete",
  };
}

export function buildWeightDeleteErrorCopy(locale: MobileLocale) {
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

export function parseWeightValue(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}
