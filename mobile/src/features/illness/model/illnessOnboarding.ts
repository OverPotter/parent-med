import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

const onboardingSpec = require("../specs/illnesses_onboarding.json");

type IllnessOnboardingContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  hintTitle: string;
  hintBody: string;
  dateLabel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonMaxLength: number;
  suggestionsLabel: string;
  suggestions: Array<{
    id: "fever" | "cough" | "runnyNose" | "soreThroat" | "rash" | "nausea";
    label: string;
  }>;
  submitLabel: string;
  submitLoadingLabel: string;
  leaveTitle: string;
  leaveDescription: string;
  leaveConfirmLabel: string;
  stayLabel: string;
  dateSheetTitle: string;
  dateDoneLabel: string;
  dateCancelLabel: string;
};

export function buildIllnessOnboardingContent(
  childName: string,
  locale: MobileLocale,
): IllnessOnboardingContent {
  const isRu = locale === "ru";
  const isPl = locale === "pl";
  const isDe = locale === "de";
  const content = onboardingSpec.content;
  const leaveSheet = onboardingSpec.states.unsaved_changes_confirm.sheet;
  const dateSheet = onboardingSpec.states.date_picker_open.sheet;

  return {
    backLabel: isRu ? content.back : isPl ? "Wstecz" : isDe ? "Zurück" : "Back",
    title: isRu
      ? `${childName} · Новое наблюдение`
      : isPl
        ? `${childName} · Nowa obserwacja`
        : isDe
          ? `${childName} · Neue Beobachtung`
          : `${childName} · New observation`,
    subtitle: isRu
      ? content.subtitle
      : isPl
        ? "Najpierw po prostu rozpocznij obserwację. Temperaturę, leki i przypomnienia dodasz już wewnątrz wpisu."
        : isDe
          ? "Starten Sie die Beobachtung zuerst ganz einfach. Temperatur, Medikamente und Erinnerungen können später in der Aufzeichnung hinzugefügt werden."
          : "Start with the observation first. Temperature, medicines, and reminders can be added later inside the record.",
    hintTitle: isRu
      ? "Что будет дальше"
      : isPl
        ? "Co dalej"
        : isDe
          ? "Was als Nächstes passiert"
          : "What happens next",
    hintBody: isRu
      ? "Сначала просто начните наблюдение. Температуру, лекарства, заметки и напоминания добавите уже внутри журнала."
      : isPl
        ? "Najpierw po prostu rozpocznij obserwację. Temperaturę, leki, notatki i przypomnienia dodasz już w dzienniku."
        : isDe
          ? "Starten Sie die Beobachtung zuerst ganz einfach. Temperatur, Medikamente, Notizen und Erinnerungen können später im Journal ergänzt werden."
          : "Start with the observation first. Temperature, medicines, notes, and reminders can be added later in the journal.",
    dateLabel: isRu ? content.fields.date.label : isPl ? "Data rozpoczęcia" : isDe ? "Startdatum" : "Start date",
    reasonLabel: isRu ? content.fields.reason.label : isPl ? "Co się stało?" : isDe ? "Was ist passiert?" : "What happened?",
    reasonPlaceholder: isRu
      ? content.fields.reason.placeholder
      : isPl
        ? "Na przykład: gorączka i kaszel"
        : isDe
          ? "Zum Beispiel: Fieber und Husten"
          : "For example: fever and cough",
    reasonMaxLength: content.fields.reason.max_length,
    suggestionsLabel: isRu
      ? "Частые причины"
      : isPl
        ? "Częste powody"
        : isDe
          ? "Häufige Gründe"
          : "Common reasons",
    suggestions: [
      {
        id: "fever",
        label: isRu
          ? content.suggestions.items[0]
          : isPl
            ? "Gorączka"
            : isDe
              ? "Fieber"
              : "Fever",
      },
      {
        id: "cough",
        label: isRu
          ? content.suggestions.items[1]
          : isPl
            ? "Kaszel"
            : isDe
              ? "Husten"
              : "Cough",
      },
      {
        id: "runnyNose",
        label: isRu
          ? content.suggestions.items[2]
          : isPl
            ? "Katar"
            : isDe
              ? "Schnupfen"
              : "Runny nose",
      },
      {
        id: "soreThroat",
        label: isRu
          ? content.suggestions.items[3]
          : isPl
            ? "Ból gardła"
            : isDe
              ? "Halsschmerzen"
              : "Sore throat",
      },
      {
        id: "rash",
        label: isRu
          ? content.suggestions.items[4]
          : isPl
            ? "Wysypka"
            : isDe
              ? "Ausschlag"
              : "Rash",
      },
      {
        id: "nausea",
        label: isRu
          ? "Тошнота"
          : isPl
            ? "Mdłości"
            : isDe
              ? "Übelkeit"
              : "Nausea",
      },
    ],
    submitLabel: isRu ? content.buttons.primary : isPl ? "Rozpocznij obserwację" : isDe ? "Beobachtung starten" : "Start observation",
    submitLoadingLabel: isRu ? "Создаём..." : isPl ? "Tworzymy..." : isDe ? "Wird erstellt..." : "Creating...",
    leaveTitle: isRu ? leaveSheet.title : isPl ? "Wyjść bez zapisywania?" : isDe ? "Ohne Speichern verlassen?" : "Leave without saving?",
    leaveDescription: isRu ? leaveSheet.description : isPl ? "Obserwacja nie została jeszcze rozpoczęta." : isDe ? "Die Beobachtung wurde noch nicht gestartet." : "The observation has not been started yet.",
    leaveConfirmLabel: isRu ? leaveSheet.primary_button : isPl ? "Wyjdź" : isDe ? "Verlassen" : "Leave",
    stayLabel: isRu ? leaveSheet.secondary_button : isPl ? "Zostań" : isDe ? "Bleiben" : "Stay",
    dateSheetTitle: isRu ? dateSheet.title : isPl ? "Data rozpoczęcia" : isDe ? "Startdatum" : "Start date",
    dateDoneLabel: isRu ? dateSheet.primary_button : isPl ? "Gotowe" : isDe ? "Fertig" : "Done",
    dateCancelLabel: isRu ? dateSheet.secondary_button : isPl ? "Anuluj" : isDe ? "Abbrechen" : "Cancel",
  };
}

export function formatIllnessDateLabel(dateIso: string, locale: MobileLocale) {
  return new Intl.DateTimeFormat(
    locale === "ru" ? "ru-RU" : locale === "pl" ? "pl-PL" : locale === "de" ? "de-DE" : "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date(dateIso));
}
