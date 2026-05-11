import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

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
};

export type MobileIllnessObservation = {
  childId: string;
  startedAt: string;
  reason: string;
  entries: MobileIllnessEntry[];
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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

export function createMobileIllnessObservation({
  childId,
  startedAt,
  reason,
  locale,
}: {
  childId: string;
  startedAt: string;
  reason: string;
  locale: MobileLocale;
}): MobileIllnessObservation {
  const trimmedReason = reason.trim();
  const entries: MobileIllnessEntry[] = trimmedReason
    ? [
        {
          id: makeId("illness-entry"),
          kind: "reason",
          title: trimmedReason,
          subtitle:
            locale === "ru"
              ? "Наблюдение начато"
              : locale === "pl"
                ? "Rozpoczęto obserwację"
                : locale === "de"
                  ? "Beobachtung gestartet"
                  : "Observation started",
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  return {
    childId,
    startedAt,
    reason: trimmedReason,
    entries,
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
