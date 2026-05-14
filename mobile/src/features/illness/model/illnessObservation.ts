import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileAdministrationEvent } from "../api/administrationEventsApi";
import type { MobileEpisodeMedicationPlan } from "../api/episodeMedicationPlansApi";
import type { MobileIllnessEpisode } from "../api/illnessAnalyticsApi";
import type { MobileIllnessComment } from "../api/illnessCommentsApi";
import type { MobileTemperatureEntry } from "../api/temperatureEntriesApi";
import { normalizeIllnessMedicineName } from "./illnessMedicineNames";

export type IllnessQuickActionKind =
  | "temperature"
  | "medicine"
  | "note"
  | "reminder";

export type MobileIllnessEntry = {
  id: string;
  kind: IllnessQuickActionKind | "reason";
  title: string;
  subtitle: string;
  createdAt: string;
  medicineName?: string | null;
  householdMedicineId?: string | null;
};

export type MobileIllnessObservation = {
  episodeId: string;
  childId: string;
  startedAt: string;
  reason: string;
  notificationRecipientAccountIds: string[];
  medicationPlans: MobileEpisodeMedicationPlan[];
  entries: MobileIllnessEntry[];
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTemperatureValue(valueCelsius: number, locale: MobileLocale) {
  const roundedValue = Math.round(valueCelsius * 10) / 10;
  const normalizedValue = Number.isInteger(roundedValue)
    ? String(roundedValue)
    : roundedValue.toFixed(1);

  return `${locale === "en" ? normalizedValue : normalizedValue.replace(".", ",")} °C`;
}

function getEntryCopy(kind: IllnessQuickActionKind, locale: MobileLocale) {
  const isRu = locale === "ru";
  const isPl = locale === "pl";
  const isDe = locale === "de";

  switch (kind) {
    case "temperature":
      return {
        title: "37.8 °C",
        subtitle: isRu
          ? "Температура добавлена"
          : isPl
            ? "Dodano temperaturę"
            : isDe
              ? "Temperatur hinzugefügt"
              : "Temperature added",
      };
    case "medicine":
      return {
        title: isRu ? "Ибупрофен · 5 мл" : isPl ? "Ibuprofen · 5 ml" : isDe ? "Ibuprofen · 5 ml" : "Ibuprofen · 5 ml",
        subtitle: isRu
          ? "Приём добавлен"
          : isPl
            ? "Dodano podanie"
            : isDe
              ? "Einnahme hinzugefügt"
              : "Dose added",
      };
    case "note":
      return {
        title: isRu
          ? "Стал активнее"
          : isPl
            ? "Jest bardziej aktywny"
            : isDe
              ? "Ist aktiver geworden"
              : "More active now",
        subtitle: isRu
          ? "Заметка добавлена"
          : isPl
            ? "Dodano notatkę"
            : isDe
              ? "Notiz hinzugefügt"
              : "Note added",
      };
    case "reminder":
      return {
        title: isRu
          ? "Измерить температуру через 2 часа"
          : isPl
            ? "Zmierz temperaturę za 2 godziny"
            : isDe
              ? "Temperatur in 2 Stunden messen"
              : "Check temperature in 2 hours",
        subtitle: isRu
          ? "Напоминание добавлено"
          : isPl
            ? "Dodano przypomnienie"
            : isDe
              ? "Erinnerung hinzugefügt"
              : "Reminder added",
      };
  }
}

function getEntrySubtitle(kind: IllnessQuickActionKind, locale: MobileLocale) {
  return getEntryCopy(kind, locale).subtitle;
}

function formatTemperatureTitle(valueCelsius: number, locale: MobileLocale) {
  return formatTemperatureValue(valueCelsius, locale);
}

function buildAdministrationTitle(entry: MobileAdministrationEvent, locale: MobileLocale) {
  const medicineName =
    entry.customMedicineName?.trim() ||
    (locale === "ru"
      ? "Лекарство"
      : locale === "pl"
        ? "Lek"
        : locale === "de"
          ? "Medikament"
          : "Medicine");
  const amount = entry.amount.trim();

  return amount ? `${medicineName} · ${amount}` : medicineName;
}

function buildReminderTitle(
  plan: MobileEpisodeMedicationPlan,
  locale: MobileLocale,
) {
  const medicineName =
    plan.customMedicineName?.trim() ||
    (locale === "ru"
      ? "Лекарство"
      : locale === "pl"
        ? "Lek"
        : locale === "de"
          ? "Medikament"
          : "Medicine");
  const intervalHours = Math.max(1, Math.round(plan.minIntervalMinutes / 60));
  const intervalLabel =
    locale === "ru"
      ? `каждые ${intervalHours} ч`
      : locale === "pl"
        ? `co ${intervalHours} godz.`
        : locale === "de"
          ? `alle ${intervalHours} Std.`
          : `every ${intervalHours} h`;

  return `${medicineName} · ${intervalLabel}`;
}

function buildObservationStartedSubtitle(locale: MobileLocale) {
  return locale === "ru"
    ? "Наблюдение начато"
    : locale === "pl"
      ? "Rozpoczęto obserwację"
      : locale === "de"
        ? "Beobachtung gestartet"
        : "Observation started";
}

export function createMobileIllnessEntryFromComment(
  comment: MobileIllnessComment,
  locale: MobileLocale,
): MobileIllnessEntry {
  return {
    id: comment.id,
    kind: "note",
    title: comment.text.trim(),
    subtitle:
      comment.createdByNameSnapshot?.trim() || getEntrySubtitle("note", locale),
    createdAt: comment.createdAt,
  };
}

export function createMobileIllnessEntryFromAdministration(
  entry: MobileAdministrationEvent,
  locale: MobileLocale,
): MobileIllnessEntry {
  return {
    id: entry.id,
    kind: "medicine",
    title: buildAdministrationTitle(entry, locale),
    subtitle:
      entry.reason?.trim() ||
      entry.administeredByNameSnapshot?.trim() ||
      getEntrySubtitle("medicine", locale),
    createdAt: entry.administeredAt,
    medicineName: normalizeIllnessMedicineName(entry.customMedicineName),
    householdMedicineId: entry.householdMedicineId,
  };
}

export function createMobileIllnessEntryFromMedicationPlan(
  plan: MobileEpisodeMedicationPlan,
  locale: MobileLocale,
): MobileIllnessEntry {
  return {
    id: plan.id,
    kind: "reminder",
    title: buildReminderTitle(plan, locale),
    subtitle: plan.notes?.trim() || plan.doseAmount.trim() || getEntrySubtitle("reminder", locale),
    createdAt: plan.createdAt,
    medicineName: normalizeIllnessMedicineName(plan.customMedicineName),
    householdMedicineId: plan.householdMedicineId,
  };
}

export function createMobileIllnessEntryFromTemperature(
  entry: MobileTemperatureEntry,
  locale: MobileLocale,
): MobileIllnessEntry {
  return {
    id: entry.id,
    kind: "temperature",
    title: formatTemperatureTitle(entry.valueCelsius, locale),
    subtitle: entry.comment?.trim() || getEntrySubtitle("temperature", locale),
    createdAt: entry.measuredAt,
  };
}

export function createMobileIllnessObservation({
  episodeId,
  childId,
  startedAt,
  reason,
  reasonCreatedAt,
  notificationRecipientAccountIds,
  locale,
}: {
  episodeId: string;
  childId: string;
  startedAt: string;
  reason: string;
  reasonCreatedAt?: string;
  notificationRecipientAccountIds?: string[];
  locale: MobileLocale;
}): MobileIllnessObservation {
  const trimmedReason = reason.trim();
  const entries: MobileIllnessEntry[] = trimmedReason
    ? [
        {
          id: makeId("illness-entry"),
          kind: "reason",
          title: trimmedReason,
          subtitle: buildObservationStartedSubtitle(locale),
          createdAt: reasonCreatedAt ?? startedAt,
        },
      ]
    : [];

  return {
    episodeId,
    childId,
    startedAt,
    reason: trimmedReason,
    notificationRecipientAccountIds: notificationRecipientAccountIds ?? [],
    medicationPlans: [],
    entries,
  };
}

export function createMobileIllnessObservationFromEpisode(
  episode: MobileIllnessEpisode,
  locale: MobileLocale,
): MobileIllnessObservation {
  return createMobileIllnessObservation({
    episodeId: episode.id,
    childId: episode.childId,
    startedAt: episode.startedAt,
    reason: episode.note ?? "",
    reasonCreatedAt: episode.startedAt,
    notificationRecipientAccountIds: episode.memberAccountIds,
    locale,
  });
}

export function mergeIllnessObservationTemperatureEntries(
  observation: MobileIllnessObservation,
  entries: MobileTemperatureEntry[],
  locale: MobileLocale,
): MobileIllnessObservation {
  const temperatureEntries = entries
    .slice()
    .sort(
      (left, right) =>
        new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime(),
    )
    .map((entry) => createMobileIllnessEntryFromTemperature(entry, locale));
  const nonTemperatureEntries = observation.entries.filter(
    (entry) => entry.kind !== "temperature",
  );

  return {
    ...observation,
    entries: [...temperatureEntries, ...nonTemperatureEntries].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  };
}

export function mergeIllnessObservationCommentEntries(
  observation: MobileIllnessObservation,
  comments: MobileIllnessComment[],
  locale: MobileLocale,
): MobileIllnessObservation {
  const commentEntries = comments
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .map((comment) => createMobileIllnessEntryFromComment(comment, locale));
  const nonCommentEntries = observation.entries.filter((entry) => entry.kind !== "note");

  return {
    ...observation,
    entries: [...commentEntries, ...nonCommentEntries].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  };
}

export function mergeIllnessObservationAdministrationEntries(
  observation: MobileIllnessObservation,
  entries: MobileAdministrationEvent[],
  locale: MobileLocale,
): MobileIllnessObservation {
  const administrationEntries = entries
    .slice()
    .sort(
      (left, right) =>
        new Date(right.administeredAt).getTime() -
        new Date(left.administeredAt).getTime(),
    )
    .map((entry) => createMobileIllnessEntryFromAdministration(entry, locale));
  const nonAdministrationEntries = observation.entries.filter(
    (entry) => entry.kind !== "medicine",
  );

  return {
    ...observation,
    entries: [...administrationEntries, ...nonAdministrationEntries].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  };
}

export function mergeIllnessObservationMedicationPlanEntries(
  observation: MobileIllnessObservation,
  plans: MobileEpisodeMedicationPlan[],
  locale: MobileLocale,
): MobileIllnessObservation {
  const reminderEntries = plans
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .map((plan) => createMobileIllnessEntryFromMedicationPlan(plan, locale));
  const nonReminderEntries = observation.entries.filter(
    (entry) => entry.kind !== "reminder",
  );

  return {
    ...observation,
    medicationPlans: plans,
    entries: [...reminderEntries, ...nonReminderEntries].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
  };
}

export function appendMockIllnessEntry(
  observation: MobileIllnessObservation,
  kind: IllnessQuickActionKind,
  locale: MobileLocale,
): MobileIllnessObservation {
  const copy = getEntryCopy(kind, locale);

  return {
    ...observation,
    entries: [
      {
        id: makeId("illness-entry"),
        kind,
        title: copy.title,
        subtitle: copy.subtitle,
        createdAt: new Date().toISOString(),
      },
      ...observation.entries,
    ],
  };
}

export function appendTemperatureIllnessEntry(
  observation: MobileIllnessObservation,
  {
    valueCelsius,
    locale,
    createdAt = new Date().toISOString(),
  }: {
    valueCelsius: number;
    locale: MobileLocale;
    createdAt?: string;
  },
): MobileIllnessObservation {
  return {
    ...observation,
    entries: [
      {
        id: makeId("illness-entry"),
        kind: "temperature",
        title: formatTemperatureValue(valueCelsius, locale),
        subtitle: getEntrySubtitle("temperature", locale),
        createdAt,
      },
      ...observation.entries,
    ],
  };
}
