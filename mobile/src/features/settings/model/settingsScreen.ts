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
  notificationsSectionTitle: string;
  notificationsSectionHint: string;
  notificationsUnavailableHint: string;
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

  return {
    backLabel: isRu ? "Назад" : "Back",
    title: isRu ? "Настройки" : "Settings",
    subtitle: isRu
      ? "Язык, уведомления, подписка и безопасность."
      : "Language, notifications, subscription, and security.",
    loadingLabel: isRu ? "Загружаем настройки…" : "Loading settings…",
    saveErrorLabel: isRu
      ? "Не удалось сохранить настройку. Попробуйте ещё раз."
      : "Could not save the setting. Please try again.",
    appSectionTitle: isRu ? "Приложение" : "App preferences",
    appSectionHint: isRu
      ? "Язык и внешний вид."
      : "Language and appearance.",
    languageTitle: isRu ? "Язык интерфейса" : "Interface language",
    languageHint: isRu
      ? "Меняет язык приложения."
      : "Changes the app language.",
    notificationsSectionTitle: isRu ? "Уведомления" : "Notifications",
    notificationsSectionHint: isRu
      ? "Напоминания и push."
      : "Reminders and push.",
    notificationsUnavailableHint: isRu
      ? "В этой среде push пока недоступны."
      : "Push is not available in this environment yet.",
    pushMasterTitle: isRu ? "Все уведомления" : "All notifications",
    pushMasterHint: isRu
      ? "Главный переключатель."
      : "Master switch.",
    childrenPushTitle: isRu ? "Напоминания по детям" : "Children reminders",
    childrenPushHint: isRu
      ? "Сон, кормление и события."
      : "Sleep, feeding, and events.",
    pillboxPushTitle: isRu ? "Напоминания по таблетнице" : "Pillbox reminders",
    pillboxPushHint: isRu
      ? "Напоминания о приёме."
      : "Medicine reminders.",
    cabinetPushTitle: isRu ? "Аптечка" : "Medicine cabinet",
    cabinetPushHint: isRu
      ? "Сроки и остатки."
      : "Expiry and stock.",
    leadTimeTitle: isRu ? "Напомнить заранее" : "Remind in advance",
    leadTimeHint: isRu
      ? "Когда присылать уведомление."
      : "When to send it.",
    pillboxLeadTimeTitle: isRu ? "Заранее" : "Lead time",
    pillboxLeadTimeHint: isRu
      ? "Когда напомнить о приёме."
      : "When to remind.",
    cabinetLeadTimeTitle: isRu ? "Заранее" : "Lead time",
    cabinetLeadTimeHint: isRu
      ? "Когда напомнить о сроке."
      : "When to remind.",
    liveActivitiesSectionTitle: isRu ? "Live Activities" : "Live Activities",
    liveActivitiesSectionHint: isRu
      ? "Статусы на экране iPhone."
      : "Live status on iPhone.",
    liveActivitiesUnavailableHint: isRu
      ? "На вашем тарифе пока недоступно."
      : "Not available on your plan yet.",
    liveSleepTitle: isRu ? "Сон" : "Sleep",
    liveSleepHint: isRu
      ? "Показывать активный сон."
      : "Show active sleep.",
    liveFeedingTitle: isRu ? "Кормление" : "Feeding",
    liveFeedingHint: isRu
      ? "Показывать активное кормление."
      : "Show active feeding.",
    liveIllnessTitle: isRu ? "Болезнь" : "Illness",
    liveIllnessHint: isRu
      ? "Показывать активную болезнь."
      : "Show active illness.",
    subscriptionSectionTitle: isRu ? "Подписка и доступ" : "Subscription and access",
    subscriptionSectionHint: isRu
      ? "Текущий план семьи."
      : "Current family plan.",
    subscriptionOwnerHint: isRu
      ? "Подпиской семьи управляет только владелец."
      : "Only the family owner manages the family subscription.",
    subscriptionPlanLabel: isRu ? "План" : "Plan",
    subscriptionStatusLabel: isRu ? "Статус" : "Status",
    subscriptionMembersLabel: isRu ? "Участников семьи" : "Family members",
    subscriptionAccessUntilLabel: isRu ? "Доступ до" : "Access until",
    subscriptionManageLabel: isRu ? "Управлять подпиской" : "Manage subscription",
    securitySectionTitle: isRu ? "Безопасность" : "Security",
    securitySectionHint: isRu
      ? "Пароль и код восстановления."
      : "Password and recovery code.",
    passwordTitle: isRu ? "Сменить пароль" : "Change password",
    passwordHint: isRu
      ? "Пароль для входа."
      : "Password used to sign in.",
    currentPasswordLabel: isRu ? "Текущий пароль" : "Current password",
    newPasswordLabel: isRu ? "Новый пароль" : "New password",
    confirmPasswordLabel: isRu ? "Повторите пароль" : "Confirm password",
    savePasswordLabel: isRu ? "Обновить пароль" : "Update password",
    passwordUpdatedLabel: isRu ? "Пароль обновлён." : "Password updated.",
    recoveryCodeTitle: isRu ? "Recovery code" : "Recovery code",
    recoveryCodeHint: isRu
      ? "Для восстановления доступа."
      : "Used to restore access.",
    recoveryCodeConfiguredHint: isRu
      ? "Код восстановления уже настроен."
      : "Recovery code is already set.",
    recoveryCodeLabel: isRu ? "Новый recovery code" : "New recovery code",
    saveRecoveryCodeLabel: isRu ? "Сохранить код" : "Save code",
    recoveryCodeUpdatedLabel: isRu
      ? "Recovery code обновлён."
      : "Recovery code updated.",
    dangerSectionTitle: isRu ? "Опасная зона" : "Danger zone",
    dangerSectionHint: isRu
      ? "Необратимые действия."
      : "Irreversible actions.",
    deleteAccountLabel: isRu ? "Удалить аккаунт" : "Delete account",
    deleteFamilyLabel: isRu ? "Удалить семью" : "Delete family",
    deleteAccountHint: isRu
      ? "Закроет доступ к этому аккаунту. Если на нём держится Plus для семьи, сначала нужно дождаться окончания периода."
      : "Removes access to this account. If it still holds Plus for the family, the paid period must end first.",
    deleteFamilyHint: isRu
      ? "Удалит семью и отключит доступ для всех участников."
      : "Deletes the family and removes access for all members.",
    deleteAccountBlockedHint: isRu
      ? "На этом аккаунте ещё держится Plus для семьи. Сначала дождитесь окончания текущего оплаченного периода."
      : "This account still holds Plus for the family. Wait until the current paid period ends first.",
    deleteFamilyBlockedHint: isRu
      ? "Семью нельзя удалить, пока у неё ещё действует Plus. Даже после отмены продления доступ живёт до конца периода."
      : "The family cannot be deleted while Plus is still active. Even after canceling renewal, access remains until the period ends.",
    subscriptionPlanFree: isRu ? "Free" : "Free",
    subscriptionPlanPlus: isRu ? "Plus" : "Plus",
    subscriptionPlanPro: isRu ? "Pro" : "Pro",
    subscriptionStatusInactive: isRu ? "Неактивна" : "Inactive",
    subscriptionStatusTrialing: isRu ? "Триал" : "Trialing",
    subscriptionStatusActive: isRu ? "Активна" : "Active",
    subscriptionStatusGrace: isRu ? "Grace period" : "Grace period",
    subscriptionStatusCanceled: isRu ? "Отменена" : "Canceled",
    subscriptionStatusExpired: isRu ? "Истекла" : "Expired",
    languageChoices: [
      { key: "ru", label: "RU" },
      { key: "en", label: "EN" },
      { key: "de", label: "DE" },
      { key: "pl", label: "PL" },
    ],
    reminderChoices: [
      { key: 5, label: isRu ? "5 мин" : "5 min" },
      { key: 10, label: isRu ? "10 мин" : "10 min" },
      { key: 15, label: isRu ? "15 мин" : "15 min" },
    ],
    cabinetReminderChoices: [
      { key: 10, label: isRu ? "10 дн" : "10 d" },
      { key: 7, label: isRu ? "7 дн" : "7 d" },
      { key: 3, label: isRu ? "3 дн" : "3 d" },
    ],
    cancelActionLabel: isRu ? "Нет" : "No",
    confirmDeleteOwnerTitle: isRu ? "Точно удалить?" : "Are you sure?",
    confirmDeleteOwnerMessage: isRu
      ? "Это удалит всю семью и ваш аккаунт. Действие необратимо."
      : "This deletes the entire family and your account. This action cannot be undone.",
    confirmDeleteMemberTitle: isRu ? "Точно удалить?" : "Are you sure?",
    confirmDeleteMemberMessage: isRu
      ? "Это удалит только ваш аккаунт. Действие необратимо."
      : "This deletes only your account. This action cannot be undone.",
    confirmDeleteAction: isRu ? "Да, удалить" : "Yes, delete",
    passwordsMismatch: isRu ? "Пароли не совпадают." : "Passwords must match.",
    passwordTooShort: isRu
      ? "Пароль должен быть не короче 8 символов."
      : "Password must be at least 8 characters.",
    passwordRequired: isRu ? "Заполните все поля." : "Fill out all fields.",
    recoveryCodeTooShort: isRu
      ? "Код должен быть не короче 8 символов."
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
