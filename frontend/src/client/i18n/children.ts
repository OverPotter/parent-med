import type { AppLanguage } from "@shared/i18n";

export const childrenCopy = {
  ru: {
    common: {
      loading: "Загрузка…",
      familyRequired: "Сначала выбери семью в разделе «Семья».",
      open: "Открыть",
    },
    childrenPage: {
      title: "Дети",
      subtitle: "Профили детей и быстрый вход в текущее наблюдение.",
      hideForm: "Скрыть форму",
      addChild: "Добавить ребёнка",
      loadError: "Ошибка загрузки",
      empty: "Пока нет детей. Добавьте первого ребёнка, чтобы вести записи и наблюдение.",
      addFirstChild: "Добавить первого ребёнка",
      addAnotherPromptTitle: "Нужно добавить ещё ребёнка?",
      addAnotherPromptText: "",
      addButtonShort: "Добавить",
      validationBirthDate: "Укажите корректную дату рождения через календарь.",
      formTitle: "Новый ребёнок",
      formSubtitle: "Профиль можно заполнить минимально, а дополнительные детали добавить позже.",
      nameLabel: "Имя ребёнка",
      namePlaceholder: "Например: Миша",
      birthDateLabel: "Дата рождения",
      institutionNameLabel: "Сад / школа",
      institutionNamePlaceholder: "Название учреждения",
      institutionPhoneLabel: "Телефон организации",
      institutionPhonePlaceholder: "+375 ...",
      doctorNameLabel: "Врач",
      doctorNamePlaceholder: "Имя врача",
      doctorPhoneLabel: "Телефон врача",
      doctorPhonePlaceholder: "+375 ...",
      allergiesLabel: "Аллергии",
      allergiesPlaceholder: "Например: клубника, пенициллин",
      notesLabel: "Заметки",
      notesPlaceholder: "Любые важные детали, которые стоит держать под рукой",
      save: "Сохранить ребёнка",
      saving: "Сохраняем…",
      cancel: "Отмена",
      childCard: {
        activeObservation: "Наблюдение",
        age: "Возраст",
        weight: "Вес",
        noWeight: "Нет записи",
        historyCount: "История: {{count}} эпизодов",
        startObservation: "Начать наблюдение",
        openObservation: "Открыть наблюдение",
        profile: "Профиль",
        activeSince: "Активно с {{date}}",
      },
    },
    childProfile: {
      loading: "Загрузка…",
      deleteTitle: "Удалить ребёнка · {{name}}",
      deleteDescription:
        "Профиль ребёнка будет удалён без возможности восстановления. Это действие нельзя отменить. Точно удалить?",
      deleteConfirm: "Да, удалить ребёнка",
      deleteCancel: "Отмена",
      deleting: "Удаляем…",
      subtitle: "Основные данные ребёнка, вес и семейные заметки в одном месте.",
      eyebrow: "Профиль ребёнка",
      history: "История",
      collapseForm: "Свернуть форму",
      editProfile: "Редактировать профиль",
      basic: "Основное",
      age: "Возраст",
      ageMissing: "Не указан",
      birthDate: "Дата рождения",
      birthDateMissing: "Не указана",
      latestWeight: "Текущий вес",
      latestWeightMissing: "Пока нет записи",
      allergies: "Аллергии",
      notes: "Заметки",
      contactsSummary: "Сад, врач и дополнительные контакты",
      institution: "Сад / школа",
      institutionPhone: "Телефон организации",
      doctor: "Врач",
      doctorPhone: "Телефон врача",
      noExtra: "Дополнительные данные пока не заполнены.",
      form: {
        title: "Редактирование профиля",
        subtitle: "Обновите базовые данные, контакты и вес ребёнка.",
        nameLabel: "Имя ребёнка",
        birthDateLabel: "Дата рождения",
        weightLabel: "Вес, кг",
        weightPlaceholder: "Например: 14.2",
        institutionNameLabel: "Сад / школа",
        institutionPhoneLabel: "Телефон организации",
        doctorNameLabel: "Врач",
        doctorPhoneLabel: "Телефон врача",
        allergiesLabel: "Аллергии",
        notesLabel: "Заметки",
        save: "Сохранить",
        saving: "Сохраняем…",
        delete: "Удалить ребёнка",
        deleteHint:
          "Опасное действие: профиль ребёнка и связанные записи будут удалены без возможности восстановления.",
        validationBirthDate: "Укажите корректную дату рождения через календарь.",
        validationWeight: "Укажите корректный вес в килограммах.",
      },
    },
    activeIllnesses: {
      title: "Активные наблюдения",
      subtitle: "Только текущие наблюдения, где важны ближайшие действия, приёмы и комментарии.",
      empty: "Сейчас нет активных наблюдений.",
      noReminder: "Нет доступного напоминания.",
      reminderReason: "Отмечено по напоминанию",
      closeTitle: "Закрыть наблюдение · {{name}}",
      closeDescription:
        "Наблюдение уйдёт в историю. Новые записи температуры и приёма будут относиться уже к следующему эпизоду.",
      closeConfirm: "Закрыть наблюдение",
      closing: "Закрываем…",
      observationBadge: "Наблюдение",
      observationSince: "Наблюдение с {{date}}",
      scheduled: "По графику",
      availableNow: "Можно дать",
      moreAvailableNow: "Ещё доступно сейчас: {{count}}",
      saving: "Сохраняем…",
      logDose: "Записать приём",
      doseSaved: "Приём сохранён",
      packNeedsReview: "Есть напоминание, но упаковку нужно проверить.",
      logTemperature: "Записать температуру",
      addNote: "Добавить заметку",
      timeline: "Лента",
      reminders: "Напоминания",
      addReminder: "Добавить напоминание",
    },
    illnessHistory: {
      title: "История",
      subtitle: "Завершённые наблюдения по детям без активных эпизодов и текущего шума.",
      empty: "Завершённых наблюдений пока нет.",
      inArchive: "в архиве",
      latestStarted: "Последний начался {{date}}",
      historyEmpty: "История пуста",
      activeOutsideArchive: "Сейчас идёт активное наблюдение, в архив не входит",
      closedAt: "Закрыт: {{date}}",
      historyLink: "История",
    },
  },
  en: {
    common: {
      loading: "Loading…",
      familyRequired: "Choose a family first in the Family section.",
      open: "Open",
    },
    childrenPage: {
      title: "Children",
      subtitle: "Child profiles with quick access to current tracking.",
      hideForm: "Hide form",
      addChild: "Add child",
      loadError: "Failed to load",
      empty: "No children yet. Add the first child to start tracking and keeping records.",
      addFirstChild: "Add first child",
      addAnotherPromptTitle: "Need to add another child?",
      addAnotherPromptText: "",
      addButtonShort: "Add",
      validationBirthDate: "Enter a valid birth date using the calendar.",
      formTitle: "New child",
      formSubtitle: "You can start with the basics and add extra details later.",
      nameLabel: "Child name",
      namePlaceholder: "Example: Misha",
      birthDateLabel: "Birth date",
      institutionNameLabel: "School / daycare",
      institutionNamePlaceholder: "Institution name",
      institutionPhoneLabel: "Institution phone",
      institutionPhonePlaceholder: "+1 ...",
      doctorNameLabel: "Doctor",
      doctorNamePlaceholder: "Doctor name",
      doctorPhoneLabel: "Doctor phone",
      doctorPhonePlaceholder: "+1 ...",
      allergiesLabel: "Allergies",
      allergiesPlaceholder: "Example: strawberries, penicillin",
      notesLabel: "Notes",
      notesPlaceholder: "Anything important that should stay close at hand",
      save: "Save child",
      saving: "Saving…",
      cancel: "Cancel",
      childCard: {
        activeObservation: "Tracking",
        age: "Age",
        weight: "Weight",
        noWeight: "No entry",
        historyCount: "History: {{count}} episodes",
        startObservation: "Start tracking",
        openObservation: "Open tracking",
        profile: "Profile",
        activeSince: "Active since {{date}}",
      },
    },
    childProfile: {
      loading: "Loading…",
      deleteTitle: "Delete child · {{name}}",
      deleteDescription:
        "The child profile will be deleted permanently. This action cannot be undone. Are you sure you want to delete?",
      deleteConfirm: "Yes, delete child",
      deleteCancel: "Cancel",
      deleting: "Deleting…",
      subtitle: "Core child details, weight and family notes in one place.",
      eyebrow: "Child profile",
      history: "History",
      collapseForm: "Collapse form",
      editProfile: "Edit profile",
      basic: "Basics",
      age: "Age",
      ageMissing: "Not set",
      birthDate: "Birth date",
      birthDateMissing: "Not set",
      latestWeight: "Current weight",
      latestWeightMissing: "No entries yet",
      allergies: "Allergies",
      notes: "Notes",
      contactsSummary: "School, doctor and additional contacts",
      institution: "School / daycare",
      institutionPhone: "Institution phone",
      doctor: "Doctor",
      doctorPhone: "Doctor phone",
      noExtra: "Additional details are not filled in yet.",
      form: {
        title: "Edit profile",
        subtitle: "Update the basics, contacts and the child’s weight.",
        nameLabel: "Child name",
        birthDateLabel: "Birth date",
        weightLabel: "Weight, kg",
        weightPlaceholder: "Example: 14.2",
        institutionNameLabel: "School / daycare",
        institutionPhoneLabel: "Institution phone",
        doctorNameLabel: "Doctor",
        doctorPhoneLabel: "Doctor phone",
        allergiesLabel: "Allergies",
        notesLabel: "Notes",
        save: "Save",
        saving: "Saving…",
        delete: "Delete child",
        deleteHint:
          "Dangerous action: the child profile and related records will be removed permanently.",
        validationBirthDate: "Enter a valid birth date using the calendar.",
        validationWeight: "Enter a valid weight in kilograms.",
      },
    },
    activeIllnesses: {
      title: "Active tracking",
      subtitle: "Only current tracking where the next actions, doses and comments matter.",
      empty: "There is no active tracking right now.",
      noReminder: "No available reminder.",
      reminderReason: "Logged from reminder",
      closeTitle: "Close tracking · {{name}}",
      closeDescription:
        "This tracking session will move into history. New temperature and dose logs will belong to the next episode.",
      closeConfirm: "Close tracking",
      closing: "Closing…",
      observationBadge: "Tracking",
      observationSince: "Tracking since {{date}}",
      scheduled: "Scheduled",
      availableNow: "Available now",
      moreAvailableNow: "{{count}} more available now",
      saving: "Saving…",
      logDose: "Log dose",
      doseSaved: "Dose saved",
      packNeedsReview: "There is a reminder, but the pack needs review.",
      logTemperature: "Log temperature",
      addNote: "Add note",
      timeline: "Timeline",
      reminders: "Reminders",
      addReminder: "Add reminder",
    },
    illnessHistory: {
      title: "History",
      subtitle: "Completed tracking sessions without active episodes or current noise.",
      empty: "No completed tracking yet.",
      inArchive: "in archive",
      latestStarted: "Latest started {{date}}",
      historyEmpty: "History is empty",
      activeOutsideArchive: "There is an active tracking session now, it is not in the archive",
      closedAt: "Closed: {{date}}",
      historyLink: "History",
    },
  },
} satisfies Record<AppLanguage, unknown>;

export function getChildrenCopy(language: AppLanguage) {
  return childrenCopy[language];
}

export function formatChildAgeLabel(
  birthDate: string | null,
  fallback: string | null,
  language: AppLanguage
) {
  if (!birthDate) {
    return fallback;
  }

  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return fallback;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (today.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return fallback;
  }

  if (language === "ru") {
    if (years <= 0) {
      const value = Math.max(months, 0);
      return `${value} ${pluralizeRu(value, ["месяц", "месяца", "месяцев"])}`;
    }
    return `${years} ${pluralizeRu(years, ["год", "года", "лет"])}`;
  }

  if (years <= 0) {
    const value = Math.max(months, 0);
    return `${value} ${value === 1 ? "month" : "months"}`;
  }
  return `${years} ${years === 1 ? "year" : "years"}`;
}

function pluralizeRu(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}
