import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

type SettingsChoice = {
  key: MobileLocale;
  label: string;
};

type ReminderChoice = {
  key: number;
  label: string;
};

type CabinetReminderChoice = {
  key: 10 | 7 | 3;
  label: string;
};

export type SettingsScreenContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  loadingLabel: string;
  saveErrorLabel: string;
  appSectionTitle: string;
  appSectionHint: string;
  languageTitle: string;
  languageHint: string;
  medicationPlansTitle: string;
  medicationPlansHint: string;
  medicationIntervalDialogTitle: string;
  medicationIntervalChoices: Array<{ key: "hours" | "minutes"; label: string }>;
  notificationsSectionTitle: string;
  notificationsSectionHint: string;
  notificationsUnavailableHint: string;
  notificationsPermissionDeniedHint: string;
  notificationsPermissionPromptTitle: string;
  notificationsPermissionPromptBody: string;
  notificationsOpenSettingsLabel: string;
  pushMasterTitle: string;
  pushMasterHint: string;
  childrenPushTitle: string;
  childrenPushHint: string;
  pillboxPushTitle: string;
  pillboxPushHint: string;
  cabinetPushTitle: string;
  cabinetPushHint: string;
  leadTimeTitle: string;
  leadTimeHint: string;
  pillboxLeadTimeTitle: string;
  pillboxLeadTimeHint: string;
  cabinetLeadTimeTitle: string;
  cabinetLeadTimeHint: string;
  liveActivitiesSectionTitle: string;
  liveActivitiesSectionHint: string;
  liveActivitiesUnavailableHint: string;
  liveSleepTitle: string;
  liveSleepHint: string;
  liveFeedingTitle: string;
  liveFeedingHint: string;
  liveIllnessTitle: string;
  liveIllnessHint: string;
  subscriptionSectionTitle: string;
  subscriptionSectionHint: string;
  subscriptionOwnerHint: string;
  subscriptionPlanLabel: string;
  subscriptionStatusLabel: string;
  subscriptionMembersLabel: string;
  subscriptionAccessUntilLabel: string;
  subscriptionManageLabel: string;
  securitySectionTitle: string;
  securitySectionHint: string;
  passwordTitle: string;
  passwordHint: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  savePasswordLabel: string;
  passwordUpdatedLabel: string;
  recoveryCodeTitle: string;
  recoveryCodeHint: string;
  recoveryCodeConfiguredHint: string;
  recoveryCodeLabel: string;
  saveRecoveryCodeLabel: string;
  recoveryCodeUpdatedLabel: string;
  dangerSectionTitle: string;
  dangerSectionHint: string;
  deleteAccountLabel: string;
  deleteFamilyLabel: string;
  deleteAccountHint: string;
  deleteFamilyHint: string;
  deleteAccountBlockedHint: string;
  deleteFamilyBlockedHint: string;
  subscriptionPlanFree: string;
  subscriptionPlanPlus: string;
  subscriptionPlanPro: string;
  subscriptionStatusInactive: string;
  subscriptionStatusTrialing: string;
  subscriptionStatusActive: string;
  subscriptionStatusGrace: string;
  subscriptionStatusCanceled: string;
  subscriptionStatusExpired: string;
  languageChoices: SettingsChoice[];
  reminderChoices: ReminderChoice[];
  cabinetReminderChoices: CabinetReminderChoice[];
  cancelActionLabel: string;
  confirmDeleteOwnerTitle: string;
  confirmDeleteOwnerMessage: string;
  confirmDeleteMemberTitle: string;
  confirmDeleteMemberMessage: string;
  confirmDeleteAction: string;
  passwordsMismatch: string;
  passwordTooShort: string;
  passwordRequired: string;
  recoveryCodeTooShort: string;
};

export function buildSettingsScreenContent(
  locale: MobileLocale,
): SettingsScreenContent {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    backLabel: isRu ? "Назад" : isDe ? "Zurück" : isPl ? "Wstecz" : "Back",
    title: isRu ? "Настройки" : isDe ? "Einstellungen" : isPl ? "Ustawienia" : "Settings",
    subtitle: isRu
      ? "Язык, уведомления, подписка и безопасность."
      : isDe
        ? "Sprache, Benachrichtigungen, Abonnement und Sicherheit."
      : isPl
        ? "Język, powiadomienia, subskrypcja i bezpieczeństwo."
      : "Language, notifications, subscription, and security.",
    loadingLabel: isRu ? "Загружаем настройки…" : isDe ? "Einstellungen werden geladen…" : isPl ? "Ładowanie ustawień…" : "Loading settings…",
    saveErrorLabel: isRu
      ? "Не удалось сохранить настройку. Попробуйте ещё раз."
      : isDe
        ? "Die Einstellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
      : isPl
        ? "Nie udało się zapisać ustawienia. Spróbuj ponownie."
      : "Could not save the setting. Please try again.",
    appSectionTitle: isRu ? "Приложение" : isDe ? "App" : isPl ? "Aplikacja" : "App preferences",
    appSectionHint: isRu
      ? "Язык и внешний вид."
      : isDe
        ? "Sprache und Darstellung."
      : isPl
        ? "Język i wygląd."
      : "Language and appearance.",
    languageTitle: isRu ? "Язык интерфейса" : isDe ? "App-Sprache" : isPl ? "Język aplikacji" : "Interface language",
    languageHint: isRu
      ? "Меняет язык приложения."
      : isDe
        ? "Ändert die Sprache der App."
      : isPl
        ? "Zmienia język aplikacji."
      : "Changes the app language.",
    medicationPlansTitle: isRu ? "Планы лекарств" : isDe ? "Medikamentenpläne" : isPl ? "Plany leków" : "Medication plans",
    medicationPlansHint: isRu
      ? "Как показывать интервалы: в часах или в минутах."
      : isDe
        ? "Wie Intervalle angezeigt werden sollen: in Stunden oder Minuten."
      : isPl
        ? "Jak pokazywać odstępy: w godzinach czy w minutach."
      : "How to show intervals: in hours or minutes.",
    medicationIntervalDialogTitle: isRu
      ? "Единица интервала"
      : isDe
        ? "Intervalleinheit"
      : isPl
        ? "Jednostka odstępu"
      : "Interval unit",
    medicationIntervalChoices: [
      { key: "hours", label: isRu ? "Часы" : isDe ? "Stunden" : isPl ? "Godziny" : "Hours" },
      { key: "minutes", label: isRu ? "Минуты" : isDe ? "Minuten" : isPl ? "Minuty" : "Minutes" },
    ],
    notificationsSectionTitle: isRu ? "Уведомления" : isDe ? "Benachrichtigungen" : isPl ? "Powiadomienia" : "Notifications",
    notificationsSectionHint: isRu
      ? "Напоминания и push."
      : isDe
        ? "Erinnerungen und Push."
      : isPl
        ? "Przypomnienia i push."
      : "Reminders and push.",
    notificationsUnavailableHint: isRu
      ? "В этой среде push пока недоступны."
      : isDe
        ? "Push-Benachrichtigungen sind in dieser Umgebung noch nicht verfügbar."
      : isPl
        ? "Powiadomienia push nie są jeszcze dostępne w tym środowisku."
      : "Push is not available in this environment yet.",
    notificationsPermissionDeniedHint: isRu
      ? "Уведомления отключены в системных настройках iPhone."
      : isDe
        ? "Benachrichtigungen sind in den iPhone-Systemeinstellungen deaktiviert."
      : isPl
        ? "Powiadomienia są wyłączone w ustawieniach iPhone'a."
      : "Notifications are disabled in iPhone settings.",
    notificationsPermissionPromptTitle: isRu
      ? "Разрешить уведомления"
      : isDe
        ? "Benachrichtigungen erlauben"
      : isPl
        ? "Włączyć powiadomienia"
      : "Enable notifications",
    notificationsPermissionPromptBody: isRu
      ? "Чтобы push-напоминания работали, включите уведомления для PillPath в настройках iPhone."
      : isDe
        ? "Damit Push-Erinnerungen funktionieren, aktivieren Sie Benachrichtigungen für PillPath in den iPhone-Einstellungen."
      : isPl
        ? "Aby przypomnienia push działały, włącz powiadomienia dla PillPath w ustawieniach iPhone'a."
      : "To receive push reminders, enable notifications for PillPath in iPhone Settings.",
    notificationsOpenSettingsLabel: isRu
      ? "Открыть настройки"
      : isDe
        ? "Einstellungen öffnen"
      : isPl
        ? "Otwórz ustawienia"
      : "Open Settings",
    pushMasterTitle: isRu ? "Все уведомления" : isDe ? "Alle Benachrichtigungen" : isPl ? "Wszystkie powiadomienia" : "All notifications",
    pushMasterHint: isRu
      ? "Главный переключатель."
      : isDe
        ? "Hauptschalter."
      : isPl
        ? "Główny przełącznik."
      : "Master switch.",
    childrenPushTitle: isRu ? "Напоминания по детям" : isDe ? "Erinnerungen zu Kindern" : isPl ? "Przypomnienia o dzieciach" : "Children reminders",
    childrenPushHint: isRu
      ? "Сон, кормление и события."
      : isDe
        ? "Schlaf, Fütterung und Ereignisse."
      : isPl
        ? "Sen, karmienie i wydarzenia."
      : "Sleep, feeding, and events.",
    pillboxPushTitle: isRu ? "Напоминания по таблетнице" : isDe ? "Erinnerungen zur Pillenbox" : isPl ? "Przypomnienia o lekach" : "Pillbox reminders",
    pillboxPushHint: isRu
      ? "Напоминания о приёме."
      : isDe
        ? "Erinnerungen an die Einnahme."
      : isPl
        ? "Przypomnienia o przyjęciu leku."
      : "Medicine reminders.",
    cabinetPushTitle: isRu ? "Аптечка" : isDe ? "Medikamentenschrank" : isPl ? "Apteczka" : "Medicine cabinet",
    cabinetPushHint: isRu
      ? "Сроки и остатки."
      : isDe
        ? "Ablaufdaten und Bestand."
      : isPl
        ? "Terminy i zapasy."
      : "Expiry and stock.",
    leadTimeTitle: isRu ? "Напомнить заранее" : isDe ? "Vorher erinnern" : isPl ? "Przypomnij wcześniej" : "Remind in advance",
    leadTimeHint: isRu
      ? "Когда присылать уведомление."
      : isDe
        ? "Wann die Benachrichtigung gesendet werden soll."
      : isPl
        ? "Kiedy wysłać powiadomienie."
      : "When to send it.",
    pillboxLeadTimeTitle: isRu ? "Заранее" : isDe ? "Vorlaufzeit" : isPl ? "Wyprzedzenie" : "Lead time",
    pillboxLeadTimeHint: isRu
      ? "Когда напомнить о приёме."
      : isDe
        ? "Wann an die Einnahme erinnert werden soll."
      : isPl
        ? "Kiedy przypomnieć o przyjęciu."
      : "When to remind.",
    cabinetLeadTimeTitle: isRu ? "Заранее" : isDe ? "Vorlaufzeit" : isPl ? "Wyprzedzenie" : "Lead time",
    cabinetLeadTimeHint: isRu
      ? "Когда напомнить о сроке."
      : isDe
        ? "Wann an das Ablaufdatum erinnert werden soll."
      : isPl
        ? "Kiedy przypomnieć o terminie."
      : "When to remind.",
    liveActivitiesSectionTitle: isRu ? "Live Activities" : "Live Activities",
    liveActivitiesSectionHint: isRu
      ? "Статусы на экране iPhone."
      : isDe
        ? "Live-Status auf dem iPhone-Bildschirm."
      : isPl
        ? "Statusy na ekranie iPhone'a."
      : "Live status on iPhone.",
    liveActivitiesUnavailableHint: isRu
      ? "На вашем тарифе пока недоступно."
      : isDe
        ? "In Ihrem Tarif noch nicht verfügbar."
      : isPl
        ? "Jeszcze niedostępne w Twoim planie."
      : "Not available on your plan yet.",
    liveSleepTitle: isRu ? "Сон" : isDe ? "Schlaf" : isPl ? "Sen" : "Sleep",
    liveSleepHint: isRu
      ? "Показывать активный сон."
      : isDe
        ? "Aktiven Schlaf anzeigen."
      : isPl
        ? "Pokazuj aktywny sen."
      : "Show active sleep.",
    liveFeedingTitle: isRu ? "Кормление" : isDe ? "Fütterung" : isPl ? "Karmienie" : "Feeding",
    liveFeedingHint: isRu
      ? "Показывать активное кормление."
      : isDe
        ? "Aktive Fütterung anzeigen."
      : isPl
        ? "Pokazuj aktywne karmienie."
      : "Show active feeding.",
    liveIllnessTitle: isRu ? "Болезнь" : isDe ? "Krankheit" : isPl ? "Choroba" : "Illness",
    liveIllnessHint: isRu
      ? "Показывать активную болезнь."
      : isDe
        ? "Aktive Krankheit anzeigen."
      : isPl
        ? "Pokazuj aktywną chorobę."
      : "Show active illness.",
    subscriptionSectionTitle: isRu ? "Подписка и доступ" : isDe ? "Abo und Zugriff" : isPl ? "Subskrypcja i dostęp" : "Subscription and access",
    subscriptionSectionHint: isRu
      ? "Текущий план семьи."
      : isDe
        ? "Aktueller Familienplan."
      : isPl
        ? "Aktualny plan rodzinny."
      : "Current family plan.",
    subscriptionOwnerHint: isRu
      ? "Подпиской семьи управляет только владелец."
      : isDe
        ? "Nur der Familieninhaber verwaltet das Familienabo."
      : isPl
        ? "Tylko właściciel rodziny zarządza subskrypcją."
      : "Only the family owner manages the family subscription.",
    subscriptionPlanLabel: isRu ? "План" : isDe ? "Plan" : isPl ? "Plan" : "Plan",
    subscriptionStatusLabel: isRu ? "Статус" : isDe ? "Status" : isPl ? "Status" : "Status",
    subscriptionMembersLabel: isRu ? "Участников семьи" : isDe ? "Familienmitglieder" : isPl ? "Członkowie rodziny" : "Family members",
    subscriptionAccessUntilLabel: isRu ? "Доступ до" : isDe ? "Zugang bis" : isPl ? "Dostęp do" : "Access until",
    subscriptionManageLabel: isRu ? "Управлять подпиской" : isDe ? "Abo verwalten" : isPl ? "Zarządzaj subskrypcją" : "Manage subscription",
    securitySectionTitle: isRu ? "Безопасность" : isDe ? "Sicherheit" : isPl ? "Bezpieczeństwo" : "Security",
    securitySectionHint: isRu
      ? "Пароль и код восстановления."
      : isDe
        ? "Passwort und Wiederherstellungscode."
      : isPl
        ? "Hasło i kod odzyskiwania."
      : "Password and recovery code.",
    passwordTitle: isRu ? "Сменить пароль" : isDe ? "Passwort ändern" : isPl ? "Zmień hasło" : "Change password",
    passwordHint: isRu
      ? "Пароль для входа."
      : isDe
        ? "Passwort für die Anmeldung."
      : isPl
        ? "Hasło używane do logowania."
      : "Password used to sign in.",
    currentPasswordLabel: isRu ? "Текущий пароль" : isDe ? "Aktuelles Passwort" : isPl ? "Obecne hasło" : "Current password",
    newPasswordLabel: isRu ? "Новый пароль" : isDe ? "Neues Passwort" : isPl ? "Nowe hasło" : "New password",
    confirmPasswordLabel: isRu ? "Повторите пароль" : isDe ? "Passwort wiederholen" : isPl ? "Powtórz hasło" : "Confirm password",
    savePasswordLabel: isRu ? "Обновить пароль" : isDe ? "Passwort aktualisieren" : isPl ? "Zaktualizuj hasło" : "Update password",
    passwordUpdatedLabel: isRu ? "Пароль обновлён." : isDe ? "Passwort aktualisiert." : isPl ? "Hasło zostało zaktualizowane." : "Password updated.",
    recoveryCodeTitle: isRu ? "Recovery code" : "Recovery code",
    recoveryCodeHint: isRu
      ? "Для восстановления доступа."
      : isDe
        ? "Zum Wiederherstellen des Zugangs."
      : isPl
        ? "Do odzyskiwania dostępu."
      : "Used to restore access.",
    recoveryCodeConfiguredHint: isRu
      ? "Код восстановления уже настроен."
      : isDe
        ? "Der Wiederherstellungscode ist bereits eingerichtet."
      : isPl
        ? "Kod odzyskiwania jest już skonfigurowany."
      : "Recovery code is already set.",
    recoveryCodeLabel: isRu ? "Новый recovery code" : isDe ? "Neuer Recovery-Code" : isPl ? "Nowy kod odzyskiwania" : "New recovery code",
    saveRecoveryCodeLabel: isRu ? "Сохранить код" : isDe ? "Code speichern" : isPl ? "Zapisz kod" : "Save code",
    recoveryCodeUpdatedLabel: isRu
      ? "Recovery code обновлён."
      : isDe
        ? "Recovery-Code aktualisiert."
      : isPl
        ? "Kod odzyskiwania został zaktualizowany."
      : "Recovery code updated.",
    dangerSectionTitle: isRu ? "Опасная зона" : isDe ? "Gefahrenbereich" : isPl ? "Strefa ryzyka" : "Danger zone",
    dangerSectionHint: isRu
      ? "Необратимые действия."
      : isDe
        ? "Nicht rückgängig zu machende Aktionen."
      : isPl
        ? "Nieodwracalne działania."
      : "Irreversible actions.",
    deleteAccountLabel: isRu ? "Удалить аккаунт" : isDe ? "Konto löschen" : isPl ? "Usuń konto" : "Delete account",
    deleteFamilyLabel: isRu ? "Удалить семью" : isDe ? "Familie löschen" : isPl ? "Usuń rodzinę" : "Delete family",
    deleteAccountHint: isRu
      ? "Закроет доступ к этому аккаунту. Если на нём держится Plus для семьи, сначала нужно дождаться окончания периода."
      : isDe
        ? "Entzieht den Zugriff auf dieses Konto. Wenn darüber noch Plus für die Familie läuft, muss zuerst der aktuelle Zeitraum enden."
      : "Removes access to this account. If it still holds Plus for the family, the paid period must end first.",
    deleteFamilyHint: isRu
      ? "Удалит семью и отключит доступ для всех участников."
      : isDe
        ? "Löscht die Familie und entzieht allen Mitgliedern den Zugriff."
      : "Deletes the family and removes access for all members.",
    deleteAccountBlockedHint: isRu
      ? "На этом аккаунте ещё держится Plus для семьи. Сначала дождитесь окончания текущего оплаченного периода."
      : isDe
        ? "Auf diesem Konto läuft noch Plus für die Familie. Warten Sie zuerst bis zum Ende des aktuellen bezahlten Zeitraums."
      : "This account still holds Plus for the family. Wait until the current paid period ends first.",
    deleteFamilyBlockedHint: isRu
      ? "Семью нельзя удалить, пока у неё ещё действует Plus. Даже после отмены продления доступ живёт до конца периода."
      : isDe
        ? "Die Familie kann nicht gelöscht werden, solange Plus noch aktiv ist. Auch nach dem Kündigen der Verlängerung bleibt der Zugriff bis zum Periodenende bestehen."
      : "The family cannot be deleted while Plus is still active. Even after canceling renewal, access remains until the period ends.",
    subscriptionPlanFree: isRu ? "Free" : "Free",
    subscriptionPlanPlus: isRu ? "Plus" : "Plus",
    subscriptionPlanPro: isRu ? "Pro" : "Pro",
    subscriptionStatusInactive: isRu ? "Неактивна" : isDe ? "Inaktiv" : isPl ? "Nieaktywna" : "Inactive",
    subscriptionStatusTrialing: isRu ? "Триал" : isDe ? "Testphase" : isPl ? "Okres próbny" : "Trialing",
    subscriptionStatusActive: isRu ? "Активна" : isDe ? "Aktiv" : isPl ? "Aktywna" : "Active",
    subscriptionStatusGrace: isRu
      ? "Льготный период"
      : isDe
        ? "Kulanzzeitraum"
      : isPl
        ? "Okres karencji"
        : "Grace period",
    subscriptionStatusCanceled: isRu ? "Отменена" : isDe ? "Gekündigt" : isPl ? "Anulowana" : "Canceled",
    subscriptionStatusExpired: isRu ? "Истекла" : isDe ? "Abgelaufen" : isPl ? "Wygasła" : "Expired",
    languageChoices: [
      { key: "ru", label: "RU" },
      { key: "en", label: "EN" },
      { key: "de", label: "DE" },
      { key: "pl", label: "PL" },
    ],
    reminderChoices: [
      { key: 5, label: isRu ? "5 мин" : isDe ? "5 Min" : isPl ? "5 min" : "5 min" },
      { key: 10, label: isRu ? "10 мин" : isDe ? "10 Min" : isPl ? "10 min" : "10 min" },
      { key: 15, label: isRu ? "15 мин" : isDe ? "15 Min" : isPl ? "15 min" : "15 min" },
    ],
    cabinetReminderChoices: [
      { key: 10, label: isRu ? "10 дн" : isDe ? "10 T" : isPl ? "10 dni" : "10 d" },
      { key: 7, label: isRu ? "7 дн" : isDe ? "7 T" : isPl ? "7 dni" : "7 d" },
      { key: 3, label: isRu ? "3 дн" : isDe ? "3 T" : isPl ? "3 dni" : "3 d" },
    ],
    cancelActionLabel: isRu ? "Нет" : isDe ? "Nein" : isPl ? "Nie" : "No",
    confirmDeleteOwnerTitle: isRu ? "Точно удалить?" : isDe ? "Wirklich löschen?" : isPl ? "Na pewno usunąć?" : "Are you sure?",
    confirmDeleteOwnerMessage: isRu
      ? "Это удалит всю семью и ваш аккаунт. Действие необратимо."
      : isDe
        ? "Dadurch werden die ganze Familie und Ihr Konto gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
      : "This deletes the entire family and your account. This action cannot be undone.",
    confirmDeleteMemberTitle: isRu ? "Точно удалить?" : isDe ? "Wirklich löschen?" : isPl ? "Na pewno usunąć?" : "Are you sure?",
    confirmDeleteMemberMessage: isRu
      ? "Это удалит только ваш аккаунт. Действие необратимо."
      : isDe
        ? "Dadurch wird nur Ihr Konto gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
      : "This deletes only your account. This action cannot be undone.",
    confirmDeleteAction: isRu ? "Да, удалить" : isDe ? "Ja, löschen" : isPl ? "Tak, usuń" : "Yes, delete",
    passwordsMismatch: isRu ? "Пароли не совпадают." : isDe ? "Die Passwörter stimmen nicht überein." : isPl ? "Hasła nie są takie same." : "Passwords must match.",
    passwordTooShort: isRu
      ? "Пароль должен быть не короче 8 символов."
      : isDe
        ? "Das Passwort muss mindestens 8 Zeichen lang sein."
      : isPl
        ? "Hasło musi mieć co najmniej 8 znaków."
      : "Password must be at least 8 characters.",
    passwordRequired: isRu ? "Заполните все поля." : isDe ? "Füllen Sie alle Felder aus." : isPl ? "Wypełnij wszystkie pola." : "Fill out all fields.",
    recoveryCodeTooShort: isRu
      ? "Код должен быть не короче 8 символов."
      : isDe
        ? "Der Code muss mindestens 8 Zeichen lang sein."
      : isPl
        ? "Kod musi mieć co najmniej 8 znaków."
      : "Recovery code must be at least 8 characters.",
  };
}

export function mapSubscriptionPlanLabel(
  content: SettingsScreenContent,
  value: "free" | "plus" | "pro",
) {
  if (value === "plus") {
    return content.subscriptionPlanPlus;
  }

  if (value === "pro") {
    return content.subscriptionPlanPro;
  }

  return content.subscriptionPlanFree;
}

export function mapSubscriptionStatusLabel(
  content: SettingsScreenContent,
  value: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired",
) {
  switch (value) {
    case "trialing":
      return content.subscriptionStatusTrialing;
    case "active":
      return content.subscriptionStatusActive;
    case "grace":
      return content.subscriptionStatusGrace;
    case "canceled":
      return content.subscriptionStatusCanceled;
    case "expired":
      return content.subscriptionStatusExpired;
    default:
      return content.subscriptionStatusInactive;
  }
}

export function isDeletionBlocked(
  canManageSubscription: boolean,
  subscriptionStatus: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired",
) {
  return (
    canManageSubscription &&
    (subscriptionStatus === "trialing" ||
      subscriptionStatus === "active" ||
      subscriptionStatus === "grace" ||
      subscriptionStatus === "canceled")
  );
}
