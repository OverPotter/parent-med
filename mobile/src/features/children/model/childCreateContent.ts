import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function getChildCreateContent(locale: MobileLocale) {
  if (locale === "ru") {
    return {
      back: "Назад к детям",
      previewName: "Новый ребёнок",
      previewMeta: "Профиль появится в разделе Дети сразу после сохранения.",
      identity: "Профиль",
      nameLabel: "Имя ребёнка",
      namePlaceholder: "Например, Маша",
      birthDateLabel: "Дата рождения",
      birthDatePlaceholder: "Выберите дату",
      weightLabel: "Вес, кг",
      weightPlaceholder: "Например, 12.4",
      heightLabel: "Рост, см",
      heightPlaceholder: "Например, 86",
      genderBoy: "Мальчик",
      genderGirl: "Девочка",
      avatarTitle: "Иконка",
      babyModeTitle: "Режим малыша",
      babyModeDescription: "Добавляет сон, кормление и историю дня.",
      allergiesTitle: "Аллергии",
      allergiesPlaceholder: "Необязательно",
      notesTitle: "Заметки",
      notesPlaceholder: "Необязательно",
      save: "Добавить ребёнка",
    };
  }

  if (locale === "de") {
    return {
      back: "Zurück zu Kindern",
      previewName: "Neues Kind",
      previewMeta: "Das Profil erscheint nach dem Speichern sofort im Bereich Kinder.",
      identity: "Profil",
      nameLabel: "Name des Kindes",
      namePlaceholder: "Zum Beispiel Mia",
      birthDateLabel: "Geburtsdatum",
      birthDatePlaceholder: "Datum auswählen",
      weightLabel: "Gewicht, kg",
      weightPlaceholder: "Zum Beispiel 12.4",
      heightLabel: "Größe, cm",
      heightPlaceholder: "Zum Beispiel 86",
      genderBoy: "Junge",
      genderGirl: "Mädchen",
      avatarTitle: "Icon",
      babyModeTitle: "Baby-Modus",
      babyModeDescription: "Fügt Schlaf, Fütterung und Tagesverlauf hinzu.",
      allergiesTitle: "Allergien",
      allergiesPlaceholder: "Optional",
      notesTitle: "Notizen",
      notesPlaceholder: "Optional",
      save: "Kind hinzufügen",
    };
  }

  if (locale === "pl") {
    return {
      back: "Wróć do dzieci",
      previewName: "Nowe dziecko",
      previewMeta: "Profil pojawi się od razu w sekcji Dzieci po zapisaniu.",
      identity: "Profil",
      nameLabel: "Imię dziecka",
      namePlaceholder: "Na przykład Zosia",
      birthDateLabel: "Data urodzenia",
      birthDatePlaceholder: "Wybierz datę",
      weightLabel: "Waga, kg",
      weightPlaceholder: "Na przykład 12.4",
      heightLabel: "Wzrost, cm",
      heightPlaceholder: "Na przykład 86",
      genderBoy: "Chłopiec",
      genderGirl: "Dziewczynka",
      avatarTitle: "Ikona",
      babyModeTitle: "Tryb niemowlęcia",
      babyModeDescription: "Dodaje sen, karmienie i historię dnia.",
      allergiesTitle: "Alergie",
      allergiesPlaceholder: "Opcjonalnie",
      notesTitle: "Notatki",
      notesPlaceholder: "Opcjonalnie",
      save: "Dodaj dziecko",
    };
  }

  return {
    back: "Back to children",
    previewName: "New child",
    previewMeta: "The profile will appear in Children right after saving.",
    identity: "Profile",
    nameLabel: "Child name",
    namePlaceholder: "For example, Emma",
    birthDateLabel: "Birth date",
    birthDatePlaceholder: "Choose date",
    weightLabel: "Weight, kg",
    weightPlaceholder: "For example, 12.4",
    heightLabel: "Height, cm",
    heightPlaceholder: "For example, 86",
    genderBoy: "Boy",
    genderGirl: "Girl",
    avatarTitle: "Icon",
    babyModeTitle: "Baby mode",
    babyModeDescription: "Adds sleep, feeding, and day history.",
    allergiesTitle: "Allergies",
    allergiesPlaceholder: "Optional",
    notesTitle: "Notes",
    notesPlaceholder: "Optional",
    save: "Add child",
  };
}
