import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileIllnessObservation } from "./illnessObservation";

const journalSpec = require("../specs/illnesses.json");

export type IllnessJournalContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  emptyPrimaryLabel: string;
  finishLabel: string;
  finishTitle: string;
  finishDescription: string;
  finishConfirmLabel: string;
  finishCancelLabel: string;
  feedLabel: (count: number) => string;
  observationSince: (dateLabel: string) => string;
  quickActionLabels: {
    temperature: string;
    medicine: string;
    note: string;
    reminder: string;
  };
  summaryChipLabels: {
    temperature: string;
    medicine: string;
    reminder: string;
  };
};

export function buildIllnessJournalContent(locale: MobileLocale): IllnessJournalContent {
  const isRu = locale === "ru";
  const isPl = locale === "pl";
  const isDe = locale === "de";
  const content = journalSpec;

  return {
    backLabel: isRu ? "Назад" : isPl ? "Wstecz" : isDe ? "Zurück" : "Back",
    title: isRu ? content.layout.title_block.title.text : isPl ? "Dziennik" : isDe ? "Journal" : "Journal",
    subtitle: isRu
      ? content.layout.title_block.subtitle.text
      : isPl
        ? "Bieżące obserwacje i szybkie działania."
        : isDe
          ? "Aktuelle Beobachtungen und schnelle Aktionen."
          : "Current observations and quick actions.",
    emptyTitle: isRu ? content.states.no_active_observations.empty_state.title : isPl ? "Brak aktywnych obserwacji" : isDe ? "Keine aktiven Beobachtungen" : "No active observations",
    emptySubtitle: isRu
      ? content.states.no_active_observations.empty_state.subtitle
      : isPl
        ? "Gdy dziecko zachoruje, włącz obserwację w jego profilu — tutaj pojawią się szybkie działania i wpisy."
        : isDe
          ? "Wenn ein Kind krank ist, aktivieren Sie die Beobachtung im Profil — hier erscheinen schnelle Aktionen und Einträge."
          : "When a child is sick, start observation in the profile — quick actions and entries will appear here.",
    emptyPrimaryLabel: isRu ? content.states.no_active_observations.empty_state.primary_button : isPl ? "Wybierz dziecko" : isDe ? "Kind auswählen" : "Choose child",
    finishLabel: isRu ? "Завершить" : isPl ? "Zakończ" : isDe ? "Beenden" : "Finish",
    finishTitle: isRu
      ? "Завершить наблюдение?"
      : isPl
        ? "Zakończyć obserwację?"
        : isDe
          ? "Beobachtung beenden?"
          : "Finish observation?",
    finishDescription: isRu ? "Наблюдение закроется, но записи останутся в истории." : isPl ? "Obserwacja zostanie zakończona, ale wpisy pozostaną w historii." : isDe ? "Die Beobachtung wird beendet, die Einträge bleiben aber im Verlauf." : "The observation will end, but the entries will stay in history.",
    finishConfirmLabel: isRu ? "Да, завершить" : isPl ? "Tak, zakończ" : isDe ? "Ja, beenden" : "Yes, finish",
    finishCancelLabel: isRu ? "Нет" : isPl ? "Nie" : isDe ? "Nein" : "No",
    feedLabel: (count) =>
      isRu
        ? `Лента · ${count} ${count === 1 ? "запись" : count < 5 ? "записи" : "записей"}`
        : isPl
          ? `Kanał · ${count} wpisów`
          : isDe
            ? `Feed · ${count} Einträge`
            : `Feed · ${count} entries`,
    observationSince: (dateLabel) =>
      isRu
        ? `Наблюдение с ${dateLabel}`
        : isPl
          ? `Obserwacja od ${dateLabel}`
          : isDe
            ? `Beobachtung seit ${dateLabel}`
            : `Observation since ${dateLabel}`,
    quickActionLabels: {
      temperature: isRu ? "+ Температура" : isPl ? "+ Temperatura" : isDe ? "+ Temperatur" : "+ Temperature",
      medicine: isRu ? "+ Приём" : isPl ? "+ Podanie" : isDe ? "+ Einnahme" : "+ Dose",
      note: isRu ? "+ Заметка" : isPl ? "+ Notatka" : isDe ? "+ Notiz" : "+ Note",
      reminder: isRu ? "+ Напоминание" : isPl ? "+ Przypomnienie" : isDe ? "+ Erinnerung" : "+ Reminder",
    },
    summaryChipLabels: {
      temperature: isRu ? "Темп." : isPl ? "Temp." : isDe ? "Temp." : "Temp.",
      medicine: isRu ? "Приём" : isPl ? "Podanie" : isDe ? "Einnahme" : "Dose",
      reminder: isRu ? "Напом." : isPl ? "Przyp." : isDe ? "Erinn." : "Remind.",
    },
  };
}

export function getObservationEntryCount(observation: MobileIllnessObservation) {
  return observation.entries.length;
}

export function getObservationChildStatsLabel(statsText: string) {
  const parts = statsText
    .split("•")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts[0] ?? statsText.trim();
}
