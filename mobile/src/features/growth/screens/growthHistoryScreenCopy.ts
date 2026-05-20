import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function buildHeightMeasurementSheetCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Добавить измерение",
      subtitle: "Сохраним новый рост ребёнка в историю.",
      heightLabel: "Рост",
      heightPlaceholder: "Например, 88",
      invalidHeight: "Введите корректный рост.",
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
      subtitle: "Wir speichern die neue Größe des Kindes im Verlauf.",
      heightLabel: "Größe",
      heightPlaceholder: "Zum Beispiel 88",
      invalidHeight: "Bitte gib eine korrekte Größe ein.",
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
      subtitle: "Zapiszemy nowy wzrost dziecka w historii.",
      heightLabel: "Wzrost",
      heightPlaceholder: "Na przykład 88",
      invalidHeight: "Wprowadź poprawny wzrost.",
      saveError: "Nie udało się zapisać pomiaru. Spróbuj ponownie.",
      rangeSubtitle: "Wybierz własny zakres dat do podglądu.",
      cancel: "Anuluj",
      save: "Zapisz",
      saving: "Zapisywanie...",
    };
  }

  return {
    title: "Add measurement",
    subtitle: "We will save the new child height in history.",
    heightLabel: "Height",
    heightPlaceholder: "For example 88",
    invalidHeight: "Enter a valid height.",
    saveError: "Failed to save measurement. Please try again.",
    rangeSubtitle: "Choose a custom date range to review data.",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
  };
}

export function buildHeightDeleteDialogCopy(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      title: "Точно удалить?",
      message: "Запись роста будет удалена без возможности восстановления.",
      cancel: "Нет",
      confirm: "Да, удалить",
    };
  }

  if (locale === "de") {
    return {
      title: "Wirklich löschen?",
      message: "Der Größeneintrag wird ohne Wiederherstellung gelöscht.",
      cancel: "Nein",
      confirm: "Ja, löschen",
    };
  }

  if (locale === "pl") {
    return {
      title: "Na pewno usunąć?",
      message: "Wpis wzrostu zostanie usunięty bez możliwości przywrócenia.",
      cancel: "Nie",
      confirm: "Tak, usuń",
    };
  }

  return {
    title: "Are you sure?",
    message: "This height record will be deleted permanently.",
    cancel: "No",
    confirm: "Yes, delete",
  };
}

export function buildHeightDeleteErrorCopy(locale: MobileLocale) {
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

export function parseHeightValue(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}
