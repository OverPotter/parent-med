import type { MobileChildSummary } from "../children/api/childrenApi";
import type { MobileFeedingRecord } from "../feeding/api/feedingRecordsApi";
import type { MobileIllnessObservation } from "../illness/model/illnessObservation";
import type { MobileLocale } from "../../shared/i18n/mobileI18n";
import type { MobileSleepSession } from "../sleep/api/sleepSessionsApi";
import type { MobileLiveActivityPreferences } from "./liveActivityPreferences";
import { isIllnessLiveActivityEnabled } from "./illnessLiveActivityPreference";
import { buildLiveActivityUrl } from "./liveActivityLinking";
import {
  type NativeLiveActivityLanguage,
  isNativeLiveActivitiesSupported,
  stopAllNativeLiveActivities,
  stopNativeLiveActivity,
  upsertNativeLiveActivity,
} from "./nativeLiveActivities";

function resolveLiveActivityLanguage(locale: MobileLocale): NativeLiveActivityLanguage {
  return locale;
}

function t<T extends string>(
  language: NativeLiveActivityLanguage,
  values: Record<NativeLiveActivityLanguage, T>,
) {
  return values[language];
}

function resolveLiveActivityLocaleTag(language: NativeLiveActivityLanguage) {
  if (language === "ru") return "ru-RU";
  if (language === "de") return "de-DE";
  if (language === "pl") return "pl-PL";
  return "en-US";
}

function isEnabled(
  kind: "sleep" | "feeding" | "illness",
  preferences: MobileLiveActivityPreferences,
) {
  if (kind === "sleep") {
    return preferences.sleepEnabled;
  }
  if (kind === "feeding") {
    return preferences.feedingEnabled;
  }
  return preferences.illnessEnabled;
}

function normalizeStartedAt(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

function formatTimeLabel(
  value: string | null | undefined,
  language: NativeLiveActivityLanguage,
) {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(resolveLiveActivityLocaleTag(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatDateLabel(
  value: string | null | undefined,
  language: NativeLiveActivityLanguage,
) {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(resolveLiveActivityLocaleTag(language), {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function joinParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim() ?? "").filter(Boolean).join(" · ");
}

function parseTemperatureValue(value: string) {
  const matched = value.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseFloat(matched[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTemperatureValue(value: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toFixed(1)}°`;
}

function getIllnessDurationMeta(
  startedAt: string,
  language: NativeLiveActivityLanguage,
  now = new Date(),
) {
  const startedDate = new Date(startedAt);
  if (Number.isNaN(startedDate.getTime())) {
    return {
      value: t(language, {
        ru: "Сегодня",
        en: "Today",
        de: "Heute",
        pl: "Dzisiaj",
      }),
      caption: t(language, {
        ru: "Началось",
        en: "Started",
        de: "Beginn",
        pl: "Początek",
      }),
    };
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startedDayStart = new Date(
    startedDate.getFullYear(),
    startedDate.getMonth(),
    startedDate.getDate(),
  );
  const diffDays = Math.max(
    0,
    Math.floor((todayStart.getTime() - startedDayStart.getTime()) / 86_400_000),
  );

  if (diffDays === 0) {
    return {
      value: t(language, {
        ru: "Сегодня",
        en: "Today",
        de: "Heute",
        pl: "Dzisiaj",
      }),
      caption: t(language, {
        ru: "Началось",
        en: "Started",
        de: "Beginn",
        pl: "Początek",
      }),
    };
  }

  if (language === "ru") {
    const mod10 = diffDays % 10;
    const mod100 = diffDays % 100;
    let suffix = "дней";

    if (mod10 === 1 && mod100 !== 11) {
      suffix = "день";
    } else if (
      mod10 >= 2 &&
      mod10 <= 4 &&
      (mod100 < 12 || mod100 > 14)
    ) {
      suffix = "дня";
    }

    return {
      value: `${diffDays} ${suffix}`,
      caption: "Длится",
    };
  }

  if (language === "de") {
    return {
      value: `${diffDays} ${diffDays === 1 ? "Tag" : "Tage"}`,
      caption: "Dauer",
    };
  }

  if (language === "pl") {
    return {
      value:
        diffDays === 1
          ? "1 dzień"
          : diffDays % 10 >= 2 &&
              diffDays % 10 <= 4 &&
              (diffDays % 100 < 12 || diffDays % 100 > 14)
            ? `${diffDays} dni`
            : `${diffDays} dni`,
      caption: "Czas trwania",
    };
  }

  return {
    value: diffDays === 1 ? "1 day" : `${diffDays} days`,
    caption: "Duration",
  };
}

async function safeStop(args: { kind: "sleep" | "feeding" | "illness"; itemId: string }) {
  try {
    await stopNativeLiveActivity(args);
  } catch {
    // Best-effort sync.
  }
}

async function safeUpsert(args: {
  kind: "sleep" | "feeding" | "illness";
  itemId: string;
  language?: NativeLiveActivityLanguage | null;
  title: string;
  subtitle?: string | null;
  statusLabel?: string | null;
  primaryValue?: string | null;
  primaryCaption?: string | null;
  secondaryValue?: string | null;
  secondaryCaption?: string | null;
  startedAt: string;
  deepLink?: string | null;
}) {
  try {
    await upsertNativeLiveActivity(args);
  } catch {
    // Best-effort sync.
  }
}

export async function syncSleepLiveActivity(params: {
  child: Pick<MobileChildSummary, "id" | "name">;
  session: Pick<
    MobileSleepSession,
    "startedAt" | "endedAt" | "createdByAccountId"
  > | null;
  locale: MobileLocale;
  preferences: MobileLiveActivityPreferences;
  currentAccountId: string;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const language = resolveLiveActivityLanguage(params.locale);
  const session = params.session;

  if (
    !session ||
    session.endedAt ||
    !isEnabled("sleep", params.preferences) ||
    (session.createdByAccountId &&
      session.createdByAccountId !== params.currentAccountId)
  ) {
    await safeStop({ kind: "sleep", itemId: params.child.id });
    return;
  }

  const startedAt = normalizeStartedAt(session.startedAt);
  if (!startedAt) {
    await safeStop({ kind: "sleep", itemId: params.child.id });
    return;
  }

  const startedLabel = formatTimeLabel(startedAt, language);

  await safeUpsert({
    kind: "sleep",
    itemId: params.child.id,
    language,
    title: params.child.name,
    subtitle: t(language, {
      ru: "Идёт сон",
      en: "Sleep in progress",
      de: "Schlaf läuft",
      pl: "Sen trwa",
    }),
    statusLabel: joinParts([
      t(language, {
        ru: "Сейчас спит",
        en: "Sleeping now",
        de: "Schläft gerade",
        pl: "Teraz śpi",
      }),
      startedLabel
        ? t(language, {
            ru: `с ${startedLabel}`,
            en: `since ${startedLabel}`,
            de: `seit ${startedLabel}`,
            pl: `od ${startedLabel}`,
          })
        : null,
    ]),
    primaryValue: t(language, {
      ru: "Идёт",
      en: "Active",
      de: "Aktiv",
      pl: "Aktywne",
    }),
    primaryCaption: t(language, {
      ru: "Статус",
      en: "Status",
      de: "Status",
      pl: "Status",
    }),
    secondaryValue: startedLabel,
    secondaryCaption: t(language, {
      ru: "Началось",
      en: "Started",
      de: "Beginn",
      pl: "Początek",
    }),
    startedAt,
    deepLink: buildLiveActivityUrl(params.child.id, "sleep"),
  });
}

export async function syncFeedingLiveActivity(params: {
  child: Pick<MobileChildSummary, "id" | "name">;
  feeding: Pick<
    MobileFeedingRecord,
    "recordedAt" | "startedAt" | "endedAt" | "createdByAccountId"
  > | null;
  locale: MobileLocale;
  preferences: MobileLiveActivityPreferences;
  currentAccountId: string;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const language = resolveLiveActivityLanguage(params.locale);
  const feeding = params.feeding;

  if (
    !feeding ||
    feeding.endedAt ||
    !isEnabled("feeding", params.preferences) ||
    (feeding.createdByAccountId &&
      feeding.createdByAccountId !== params.currentAccountId)
  ) {
    await safeStop({ kind: "feeding", itemId: params.child.id });
    return;
  }

  const startedAt = normalizeStartedAt(feeding.startedAt ?? feeding.recordedAt);
  if (!startedAt) {
    await safeStop({ kind: "feeding", itemId: params.child.id });
    return;
  }

  const startedLabel = formatTimeLabel(startedAt, language);

  await safeUpsert({
    kind: "feeding",
    itemId: params.child.id,
    language,
    title: params.child.name,
    subtitle: t(language, {
      ru: "Идёт кормление",
      en: "Feeding in progress",
      de: "Füttern läuft",
      pl: "Karmienie trwa",
    }),
    statusLabel: joinParts([
      t(language, {
        ru: "Кормление идёт",
        en: "Feeding now",
        de: "Füttern läuft",
        pl: "Karmienie trwa",
      }),
      startedLabel
        ? t(language, {
            ru: `с ${startedLabel}`,
            en: `since ${startedLabel}`,
            de: `seit ${startedLabel}`,
            pl: `od ${startedLabel}`,
          })
        : null,
    ]),
    primaryValue: t(language, {
      ru: "Идёт",
      en: "Active",
      de: "Aktiv",
      pl: "Aktywne",
    }),
    primaryCaption: t(language, {
      ru: "Статус",
      en: "Status",
      de: "Status",
      pl: "Status",
    }),
    secondaryValue: startedLabel,
    secondaryCaption: t(language, {
      ru: "Началось",
      en: "Started",
      de: "Beginn",
      pl: "Początek",
    }),
    startedAt,
    deepLink: buildLiveActivityUrl(params.child.id, "feeding"),
  });
}

export async function syncCareLiveActivity(params:
  | {
      kind: "sleep";
      child: Pick<MobileChildSummary, "id" | "name">;
      session: Pick<
        MobileSleepSession,
        "startedAt" | "endedAt" | "createdByAccountId"
      > | null;
      locale: MobileLocale;
      preferences: MobileLiveActivityPreferences;
      currentAccountId: string;
    }
  | {
      kind: "feeding";
      child: Pick<MobileChildSummary, "id" | "name">;
      feeding: Pick<
        MobileFeedingRecord,
        "recordedAt" | "startedAt" | "endedAt" | "createdByAccountId"
      > | null;
      locale: MobileLocale;
      preferences: MobileLiveActivityPreferences;
      currentAccountId: string;
    }) {
  if (params.kind === "sleep") {
    await syncSleepLiveActivity(params);
    return;
  }

  await syncFeedingLiveActivity(params);
}

export async function syncIllnessLiveActivity(params: {
  child: Pick<MobileChildSummary, "id" | "name">;
  observation: MobileIllnessObservation | null | undefined;
  locale: MobileLocale;
  preferences: MobileLiveActivityPreferences;
  currentAccountId: string;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const language = resolveLiveActivityLanguage(params.locale);
  const observation = params.observation;

  if (
    !observation ||
    !isEnabled("illness", params.preferences) ||
    !isIllnessLiveActivityEnabled(observation, params.currentAccountId)
  ) {
    await safeStop({ kind: "illness", itemId: params.child.id });
    return;
  }

  const startedAt = normalizeStartedAt(observation.startedAt);
  if (!startedAt) {
    await safeStop({ kind: "illness", itemId: params.child.id });
    return;
  }

  const latestTemperatureEntry = observation.entries
    .filter((entry) => entry.kind === "temperature")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
  const latestAdministrationEntry = observation.entries
    .filter((entry) => entry.kind === "medicine")
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
  const primaryPlan = [...observation.medicationPlans].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  )[0];
  const nextDoseAt =
    primaryPlan && latestAdministrationEntry
      ? new Date(
          new Date(latestAdministrationEntry.createdAt).getTime() +
            primaryPlan.minIntervalMinutes * 60_000,
        )
      : null;
  const nextDoseTimeLabel =
    nextDoseAt && Number.isFinite(nextDoseAt.getTime())
      ? formatTimeLabel(nextDoseAt.toISOString(), language)
      : null;
  const durationMeta = getIllnessDurationMeta(startedAt, language);
  const lastTemperatureLabel = formatTemperatureValue(
    parseTemperatureValue(latestTemperatureEntry?.title ?? ""),
  );
  const lastTemperatureTime = formatTimeLabel(
    latestTemperatureEntry?.createdAt,
    language,
  );
  const lastMedicineTime = formatTimeLabel(
    latestAdministrationEntry?.createdAt,
    language,
  );
  const latestMedicineName = latestAdministrationEntry?.medicineName?.trim() || null;
  const planMedicineName = primaryPlan?.customMedicineName?.trim() || latestMedicineName;
  const isDoseReadyNow =
    nextDoseAt != null && Number.isFinite(nextDoseAt.getTime())
      ? nextDoseAt.getTime() <= Date.now()
      : false;

  const primaryValue =
    lastTemperatureLabel ??
    (isDoseReadyNow
      ? language === "ru"
        ? "Можно дать"
        : language === "de"
          ? "Bereit"
          : language === "pl"
            ? "Można podać"
            : "Ready now"
      : nextDoseTimeLabel) ??
    durationMeta.value;

  const primaryCaption =
    lastTemperatureLabel
      ? lastTemperatureTime
        ? language === "ru"
          ? `Была в ${lastTemperatureTime}`
          : language === "de"
            ? `Um ${lastTemperatureTime}`
            : language === "pl"
              ? `O ${lastTemperatureTime}`
              : `At ${lastTemperatureTime}`
        : language === "ru"
          ? "Температура"
          : language === "de"
            ? "Temperatur"
            : language === "pl"
              ? "Temperatura"
              : "Temperature"
      : nextDoseTimeLabel
        ? planMedicineName ??
          t(language, {
            ru: "Следующая доза",
            en: "Next dose",
            de: "Nächste Dosis",
            pl: "Następna dawka",
          })
        : durationMeta.caption;

  const secondaryValue =
    lastMedicineTime && latestMedicineName
      ? latestMedicineName
      : lastMedicineTime ?? null;

  const secondaryCaption = lastMedicineTime
    ? t(language, {
        ru: `Дали в ${lastMedicineTime}`,
        en: `Given at ${lastMedicineTime}`,
        de: `Gegeben um ${lastMedicineTime}`,
        pl: `Podano o ${lastMedicineTime}`,
      })
    : null;

  await safeUpsert({
    kind: "illness",
    itemId: params.child.id,
    language,
    title: params.child.name,
    subtitle: joinParts([
      t(language, {
        ru: "Наблюдение с",
        en: "Tracking since",
        de: "Beobachtung seit",
        pl: "Obserwacja od",
      }),
      formatDateLabel(startedAt, language),
    ]),
    statusLabel:
      isDoseReadyNow
        ? joinParts([
            planMedicineName,
            t(language, {
              ru: "Можно дать",
              en: "Ready now",
              de: "Bereit",
              pl: "Można podać",
            }),
          ])
        : nextDoseTimeLabel
          ? joinParts([
              planMedicineName,
              t(language, {
                ru: `дать в ${nextDoseTimeLabel}`,
                en: `give at ${nextDoseTimeLabel}`,
                de: `geben um ${nextDoseTimeLabel}`,
                pl: `podać o ${nextDoseTimeLabel}`,
              }),
            ])
          : t(language, {
              ru: "Идёт наблюдение",
              en: "Tracking in progress",
              de: "Beobachtung läuft",
              pl: "Obserwacja trwa",
            }),
    primaryValue,
    primaryCaption,
    secondaryValue,
    secondaryCaption,
    startedAt,
    deepLink: buildLiveActivityUrl(params.child.id, "illness"),
  });
}

export async function stopDisabledLiveActivities(
  preferences: MobileLiveActivityPreferences,
) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  const tasks: Promise<void>[] = [];

  if (!preferences.sleepEnabled) {
    tasks.push(stopAllNativeLiveActivities("sleep"));
  }
  if (!preferences.feedingEnabled) {
    tasks.push(stopAllNativeLiveActivities("feeding"));
  }
  if (!preferences.illnessEnabled) {
    tasks.push(stopAllNativeLiveActivities("illness"));
  }

  await Promise.all(tasks);
}

export async function syncMobileLiveActivitiesSnapshot(params: {
  children: MobileChildSummary[];
  activeSleepByChildId: Record<string, MobileSleepSession | null>;
  activeFeedingByChildId: Record<string, MobileFeedingRecord | null>;
  activeIllnessByChildId: Record<string, MobileIllnessObservation | undefined>;
  locale: MobileLocale;
  preferences: MobileLiveActivityPreferences;
  currentAccountId: string;
}) {
  if (!isNativeLiveActivitiesSupported()) {
    return;
  }

  await Promise.all([
    ...params.children.map((child) =>
      syncSleepLiveActivity({
        child,
        session: child.babyModeEnabled
          ? (params.activeSleepByChildId[child.id] ?? null)
          : null,
        locale: params.locale,
        preferences: params.preferences,
        currentAccountId: params.currentAccountId,
      }),
    ),
    ...params.children.map((child) =>
      syncFeedingLiveActivity({
        child,
        feeding: child.babyModeEnabled
          ? (params.activeFeedingByChildId[child.id] ?? null)
          : null,
        locale: params.locale,
        preferences: params.preferences,
        currentAccountId: params.currentAccountId,
      }),
    ),
    ...params.children.map((child) =>
      syncIllnessLiveActivity({
        child,
        observation: params.activeIllnessByChildId[child.id],
        locale: params.locale,
        preferences: params.preferences,
        currentAccountId: params.currentAccountId,
      }),
    ),
  ]);
}
