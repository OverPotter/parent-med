import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type ReminderScreenCopy = {
  back: string;
  title: string;
  subtitle: string;
  todaySection: string;
  notifications: string;
  add: string;
  recipientsTitle: string;
  recipientsSubtitle: string;
  recipientsSummaryPrefix: string;
  recipientsEmpty: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
  dose: string;
  interval: string;
  limit: string;
  notes: string;
  loggedToday: string;
  ofLabel: string;
  deletePromptTitle: string;
  deletePromptBody: string;
  cancel: string;
  confirmDelete: string;
  save: string;
  currentUser: string;
  giveAtLabel: string;
  dailyLimitReached: string;
  takeDoseNow: string;
  loggingNow: string;
  confirmDoseTitle: string;
  confirmDoseHintDefault: string;
  confirmDosePastPrefix: string;
  confirmDosePastSuffix: string;
  confirmDoseDate: string;
  confirmDoseTime: string;
  futureDoseError: string;
  lastDose: string;
  active: string;
  nextDosePrefix: string;
};

export function buildReminderScreenCopy(locale: MobileLocale): ReminderScreenCopy {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    back: isRu ? "Назад к журналу" : isDe ? "Zurück zum Journal" : isPl ? "Wróć do dziennika" : "Back to journal",
    title: isRu ? "Планы приёма" : isDe ? "Einnahmepläne" : isPl ? "Plany przyjmowania" : "Medication plans",
    subtitle: isRu
      ? "Следите за лекарствами, витаминами и отметками приёма."
      : isDe
        ? "Behalte Medikamente, Vitamine und Einnahmeprotokolle im Blick."
        : isPl
          ? "Śledź leki, witaminy i oznaczenia przyjęcia."
          : "Track medicines, vitamins, and logged doses.",
    todaySection: isRu ? "Сегодня" : isDe ? "Heute" : isPl ? "Dziś" : "Today",
    notifications: isRu ? "Уведомления" : isDe ? "Benachrichtigungen" : isPl ? "Powiadomienia" : "Notifications",
    add: isRu ? "Добавить новый план" : isDe ? "Neuen Plan hinzufügen" : isPl ? "Dodaj nowy plan" : "Add new plan",
    recipientsTitle: isRu
      ? "Кому приходят уведомления"
      : isDe
        ? "Wer Benachrichtigungen erhält"
        : isPl
          ? "Kto dostaje powiadomienia"
          : "Who gets notifications",
    recipientsSubtitle: isRu
      ? "Этим участникам могут приходить push по текущему наблюдению."
      : isDe
        ? "Diese Mitglieder können Push-Benachrichtigungen für die aktuelle Beobachtung erhalten."
        : isPl
          ? "Te osoby mogą dostawać push dla bieżącej obserwacji."
          : "These members can receive push notifications for the current observation.",
    recipientsSummaryPrefix: isRu ? "Получатели:" : isDe ? "Empfänger:" : isPl ? "Odbiorcy:" : "Recipients:",
    recipientsEmpty: isRu ? "Нет доступных получателей" : isDe ? "Keine verfügbaren Empfänger" : isPl ? "Brak dostępnych odbiorców" : "No available recipients",
    emptyTitle: isRu ? "Пока нет напоминаний" : isDe ? "Noch keine Erinnerungen" : isPl ? "Nie ma jeszcze przypomnień" : "No reminders yet",
    emptyBody: isRu
      ? "Когда добавите первое напоминание, оно появится здесь отдельной карточкой."
      : isDe
        ? "Sobald du die erste Erinnerung hinzufügst, erscheint sie hier als eigene Karte."
        : isPl
          ? "Gdy dodasz pierwsze przypomnienie, pojawi się tutaj jako osobna karta."
          : "Once you add the first reminder, it will appear here as its own card.",
    emptyAction: isRu ? "Добавить новый план" : isDe ? "Neuen Plan hinzufügen" : isPl ? "Dodaj nowy plan" : "Add new plan",
    dose: isRu ? "Доза" : isDe ? "Dosis" : isPl ? "Dawka" : "Dose",
    interval: isRu ? "Интервал" : isDe ? "Intervall" : isPl ? "Interwał" : "Interval",
    limit: isRu ? "Лимит в сутки" : isDe ? "Tageslimit" : isPl ? "Limit na dobę" : "Daily limit",
    notes: isRu ? "Заметка" : isDe ? "Notiz" : isPl ? "Notatka" : "Note",
    loggedToday: isRu ? "Сегодня отмечено" : isDe ? "Heute markiert" : isPl ? "Dziś odnotowano" : "Logged today",
    ofLabel: isRu ? "из" : isDe ? "von" : isPl ? "z" : "of",
    deletePromptTitle: isRu ? "Удалить напоминание?" : isDe ? "Erinnerung löschen?" : isPl ? "Usunąć przypomnienie?" : "Delete reminder?",
    deletePromptBody: isRu
      ? "План приёма удалится, и уведомления по нему больше не будут приходить."
      : isDe
        ? "Der Einnahmeplan wird gelöscht und Benachrichtigungen dafür werden beendet."
        : isPl
          ? "Plan zostanie usunięty, a powiadomienia dla niego przestaną przychodzić."
          : "The plan will be deleted and its notifications will stop.",
    cancel: isRu ? "Отмена" : isDe ? "Abbrechen" : isPl ? "Anuluj" : "Cancel",
    confirmDelete: isRu ? "Удалить" : isDe ? "Löschen" : isPl ? "Usuń" : "Delete",
    save: isRu ? "Сохранить" : isDe ? "Speichern" : isPl ? "Zapisz" : "Save",
    currentUser: isRu ? "Вы" : isDe ? "Du" : isPl ? "Ty" : "You",
    giveAtLabel: isRu ? "Дать в" : isDe ? "Geben um" : isPl ? "Podać o" : "Give at",
    dailyLimitReached: isRu ? "Лимит на сегодня" : isDe ? "Tageslimit erreicht" : isPl ? "Limit na dziś" : "Daily limit reached",
    takeDoseNow: isRu ? "Отметить сейчас" : isDe ? "Jetzt markieren" : isPl ? "Zaznacz teraz" : "Log now",
    loggingNow: isRu ? "Отмечаем…" : isDe ? "Wird erfasst…" : isPl ? "Zapisywanie…" : "Logging…",
    confirmDoseTitle: isRu ? "Уточните время приёма" : isDe ? "Zeit der Gabe bestätigen" : isPl ? "Potwierdź czas podania" : "Confirm dose time",
    confirmDoseHintDefault: isRu
      ? "Поставили текущее время по умолчанию. Если лекарство дали раньше, просто поправьте дату и время."
      : isDe
        ? "Die aktuelle Zeit ist vorausgefüllt. Wenn das Medikament früher gegeben wurde, passe Datum und Uhrzeit an."
        : isPl
          ? "Domyślnie ustawiliśmy bieżący czas. Jeśli lek podano wcześniej, popraw datę i godzinę."
          : "The current time is prefilled. If the medicine was given earlier, just adjust the date and time.",
    confirmDosePastPrefix: isRu ? "С момента напоминания прошло" : isDe ? "Seit der Erinnerung vergingen" : isPl ? "Od przypomnienia minęło" : "Time since reminder:",
    confirmDosePastSuffix: isRu
      ? "Если лекарство дали, но забыли отметить это сразу, просто измените время ниже."
      : isDe
        ? "Wenn das Medikament schon gegeben wurde, passe unten einfach die Zeit an."
        : isPl
          ? "Jeśli lek został podany wcześniej, po prostu popraw czas poniżej."
          : "If the medicine was given earlier, just adjust the time below.",
    confirmDoseDate: isRu ? "Дата" : isDe ? "Datum" : isPl ? "Data" : "Date",
    confirmDoseTime: isRu ? "Время" : isDe ? "Uhrzeit" : isPl ? "Godzina" : "Time",
    futureDoseError: isRu
      ? "Нельзя указать время приёма в будущем."
      : isDe
        ? "Die Gabezeit darf nicht in der Zukunft liegen."
        : isPl
          ? "Nie można ustawić czasu podania w przyszłości."
          : "The administration time cannot be in the future.",
    lastDose: isRu ? "Последний приём" : isDe ? "Letzte Gabe" : isPl ? "Ostatnie podanie" : "Last dose",
    active: isRu ? "Активно" : isDe ? "Aktiv" : isPl ? "Aktywne" : "Active",
    nextDosePrefix: isRu ? "Следующий приём в" : isDe ? "Nächste Gabe um" : isPl ? "Następne podanie o" : "Next dose at",
  };
}

export function formatReminderElapsedSince(date: Date, now: Date, locale: MobileLocale) {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const totalMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (locale === "ru") {
    if (totalMinutes < 60) {
      return `${totalMinutes} мин`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours} ч` : `${hours} ч ${minutes} мин`;
  }

  if (locale === "de") {
    if (totalMinutes < 60) {
      return `${totalMinutes} Min.`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours} Std.` : `${hours} Std. ${minutes} Min.`;
  }

  if (locale === "pl") {
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours} godz.` : `${hours} godz. ${minutes} min`;
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
