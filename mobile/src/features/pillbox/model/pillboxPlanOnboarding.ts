import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileFamilyMember } from "../../family/api/familyMembersApi";
import type { MobilePillboxPlanWrite } from "../api/mobilePillboxPlansApi";
import {
  buildPillboxMedicineCountLabel,
  buildPillboxNextInfoLabel,
} from "./pillboxLocalization";

export type PillboxParticipantOption = {
  id: string;
  title: string;
  subtitle: string | null;
  avatarText: string;
};

export const PILLBOX_WEEKDAY_IDS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type PillboxWeekdayId = (typeof PILLBOX_WEEKDAY_IDS)[number];

type ParticipantFallback = {
  currentAccountId: string;
  locale: MobileLocale;
  currentAccountDisplayName?: string | null;
  currentAccountRelationshipLabel?: string | null;
  currentAccountFamilyRole?: string | null;
};

export type PillboxDraftMedicine = {
  id: string;
  name: string;
  dose: string;
  times: string[];
  intakeMode: "continuous" | "course";
  courseDurationDays: number | null;
  mealRelation: "before_food" | "with_food" | "after_food" | "not_matter";
  weekdays: PillboxWeekdayId[];
};

export type PillboxPlanDraft = {
  participantId: string | null;
  notificationRecipientIds: string[];
  medicines: PillboxDraftMedicine[];
};

let medicineDraftSequence = 0;

function getCurrentUserTitle(locale: MobileLocale) {
  if (locale === "ru") {
    return "Вы";
  }
  if (locale === "de") {
    return "Du";
  }
  if (locale === "pl") {
    return "Ty";
  }
  return "You";
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getFamilyRoleBadgeLabel(
  role: string | null | undefined,
  locale: MobileLocale,
): string | null {
  if (role === "owner") {
    return locale === "ru"
      ? "Владелец"
      : locale === "de"
        ? "Inhaber"
        : locale === "pl"
          ? "Właściciel"
          : "Owner";
  }

  if (role === "admin") {
    return locale === "ru" ? "Админ" : "Admin";
  }

  if (role === "member") {
    return locale === "ru"
      ? "Участник"
      : locale === "de"
        ? "Mitglied"
        : locale === "pl"
          ? "Członek"
          : "Member";
  }

  return null;
}

function resolveCurrentAccountDisplayName(fallback: ParticipantFallback) {
  return (
    normalizeOptionalText(fallback.currentAccountDisplayName) ??
    normalizeOptionalText(fallback.currentAccountRelationshipLabel) ??
    getCurrentUserTitle(fallback.locale)
  );
}

export function resolveCurrentAccountBadgeLabel(
  fallback: ParticipantFallback,
): string | null {
  return (
    normalizeOptionalText(fallback.currentAccountRelationshipLabel) ??
    getFamilyRoleBadgeLabel(fallback.currentAccountFamilyRole, fallback.locale)
  );
}

function getPlanOnboardingText(
  locale: MobileLocale,
  key:
    | "byTime"
    | "notSelected"
    | "planTitle"
    | "forPrefix"
    | "timesPerDay"
    | "courseShort"
    | "courseLong",
) {
  if (locale === "ru") {
    return {
      byTime: "По времени",
      notSelected: "Не выбран",
      planTitle: "План приёма",
      forPrefix: "Для",
      timesPerDay: "раза в день",
      courseShort: "Курс",
      courseLong: "Курс",
    }[key];
  }
  if (locale === "de") {
    return {
      byTime: "Nach Uhrzeit",
      notSelected: "Nicht ausgewählt",
      planTitle: "Einnahmeplan",
      forPrefix: "Für",
      timesPerDay: "mal täglich",
      courseShort: "Kur",
      courseLong: "Kur",
    }[key];
  }
  if (locale === "pl") {
    return {
      byTime: "Według godziny",
      notSelected: "Nie wybrano",
      planTitle: "Plan przyjmowania",
      forPrefix: "Dla",
      timesPerDay: "razy dziennie",
      courseShort: "Kuracja",
      courseLong: "Kuracja",
    }[key];
  }
  return {
    byTime: "By time",
    notSelected: "Not selected",
    planTitle: "Medication plan",
    forPrefix: "For",
    timesPerDay: "times a day",
    courseShort: "Course",
    courseLong: "Course",
  }[key];
}

function getMealRelationLabel(
  mealRelation: PillboxDraftMedicine["mealRelation"],
  locale: MobileLocale,
) {
  if (locale === "ru") {
    return mealRelation === "before_food"
      ? "До еды"
      : mealRelation === "with_food"
        ? "Во время еды"
        : mealRelation === "after_food"
          ? "После еды"
          : "Независимо от еды";
  }
  if (locale === "de") {
    return mealRelation === "before_food"
      ? "Vor dem Essen"
      : mealRelation === "with_food"
        ? "Mit dem Essen"
        : mealRelation === "after_food"
          ? "Nach dem Essen"
          : "Unabhängig vom Essen";
  }
  if (locale === "pl") {
    return mealRelation === "before_food"
      ? "Przed jedzeniem"
      : mealRelation === "with_food"
        ? "W trakcie jedzenia"
        : mealRelation === "after_food"
          ? "Po jedzeniu"
          : "Niezależnie od jedzenia";
  }
  return mealRelation === "before_food"
    ? "Before food"
    : mealRelation === "with_food"
      ? "With food"
      : mealRelation === "after_food"
        ? "After food"
        : "Any time";
}

export function buildParticipantOptions(
  familyMembers: MobileFamilyMember[],
  fallback?: ParticipantFallback,
): PillboxParticipantOption[] {
  const uniqueMembers = dedupeFamilyMembers(familyMembers);

  if (uniqueMembers.length > 0) {
    return uniqueMembers.map((member) => ({
      id: member.id,
      title: member.displayName,
      subtitle: member.relationshipLabel?.trim() || null,
      avatarText: resolveAvatarText(member.displayName),
    }));
  }

  if (!fallback?.currentAccountId) {
    return [];
  }

  const fallbackTitle = resolveCurrentAccountDisplayName(fallback);
  return [
    {
      id: fallback.currentAccountId,
      title: fallbackTitle,
      subtitle: resolveCurrentAccountBadgeLabel(fallback),
      avatarText: resolveAvatarText(fallbackTitle),
    },
  ];
}

export function createInitialPlanDraft(): PillboxPlanDraft {
  return {
    participantId: null,
    notificationRecipientIds: [],
    medicines: [],
  };
}

export function createEmptyMedicineDraft(): PillboxDraftMedicine {
  return {
    id: createMedicineDraftId(),
    name: "",
    dose: "",
    times: [],
    intakeMode: "continuous",
    courseDurationDays: null,
    mealRelation: "after_food",
    weekdays: [...PILLBOX_WEEKDAY_IDS],
  };
}

function createMedicineDraftId() {
  medicineDraftSequence += 1;
  return `medicine_${Date.now()}_${medicineDraftSequence}`;
}

export function formatMedicineSummary(
  medicine: PillboxDraftMedicine,
  locale: MobileLocale,
): string {
  const intakeText =
    medicine.times.length >= 3
      ? `3 ${getPlanOnboardingText(locale, "timesPerDay")}`
      : medicine.times.length === 2
        ? `2 ${getPlanOnboardingText(locale, "timesPerDay")}`
        : medicine.times.length === 1
          ? medicine.times[0]
          : getPlanOnboardingText(locale, "byTime");
  const mealText = getMealRelationLabel(medicine.mealRelation, locale);
  const modeText =
    medicine.intakeMode === "course" && medicine.courseDurationDays
      ? locale === "de"
        ? `${getPlanOnboardingText(locale, "courseShort")} ${medicine.courseDurationDays} Tg.`
        : locale === "pl"
          ? `${getPlanOnboardingText(locale, "courseShort")} ${medicine.courseDurationDays} dni`
          : locale === "en"
            ? `${getPlanOnboardingText(locale, "courseShort")} ${medicine.courseDurationDays} d`
            : `${getPlanOnboardingText(locale, "courseShort")} ${medicine.courseDurationDays} дн.`
      : null;
  return [medicine.dose, intakeText, mealText, modeText].filter(Boolean).join(" · ");
}

export function resolvePlanParticipantTitle(
  participantId: string | null,
  participants: PillboxParticipantOption[],
  locale: MobileLocale,
): string {
  return (
    participants.find((item) => item.id === participantId)?.title ??
    getPlanOnboardingText(locale, "notSelected")
  );
}

export function buildPillboxRecipientSheetMembers(
  familyMembers: MobileFamilyMember[],
  participants: PillboxParticipantOption[],
  fallback?: ParticipantFallback,
): MobileFamilyMember[] {
  const uniqueMembers = dedupeFamilyMembers(familyMembers);

  if (uniqueMembers.length > 0) {
    return uniqueMembers;
  }

  if (fallback?.currentAccountId) {
    const fallbackTitle = resolveCurrentAccountDisplayName(fallback);
    return [
      {
        id: fallback.currentAccountId,
        email: null,
        familyId: "local-family",
        displayName: fallbackTitle,
        relationshipLabel: resolveCurrentAccountBadgeLabel(fallback),
        phone: null,
        preferredLanguage: fallback.locale,
        familyRole: fallback.currentAccountFamilyRole ?? "member",
        accessPolicy: {
          allChildren: false,
          childIds: [],
          childrenAccess: "view",
          cabinetAccess: "none",
          pillboxAccess: "none",
          cabinetPushEnabled: false,
        },
      },
    ];
  }

  return participants.map((item) => ({
    id: item.id,
    email: null,
    familyId: "local-family",
    displayName: item.title,
    relationshipLabel: item.subtitle,
    phone: null,
    preferredLanguage: fallback?.locale ?? "en",
    familyRole: "member",
    accessPolicy: {
      allChildren: false,
      childIds: [],
      childrenAccess: "view",
      cabinetAccess: "none",
      pillboxAccess: "none",
      cabinetPushEnabled: false,
    },
  }));
}

export function buildReviewMedicineLines(
  medicine: PillboxDraftMedicine,
  locale: MobileLocale,
): string[] {
  const intakeLine =
    medicine.times.length > 1
      ? `${medicine.times.length} ${getPlanOnboardingText(locale, "timesPerDay")}: ${medicine.times.join(", ")}`
      : medicine.times[0];
  const mealLine = getMealRelationLabel(medicine.mealRelation, locale);
  const modeLine =
    medicine.intakeMode === "course" && medicine.courseDurationDays
      ? locale === "de"
        ? `${getPlanOnboardingText(locale, "courseLong")} ${medicine.courseDurationDays} Tage`
        : locale === "pl"
          ? `${getPlanOnboardingText(locale, "courseLong")} ${medicine.courseDurationDays} dni`
          : locale === "en"
            ? `${getPlanOnboardingText(locale, "courseLong")} ${medicine.courseDurationDays} days`
            : `${getPlanOnboardingText(locale, "courseLong")} ${medicine.courseDurationDays} дней`
      : null;

  return [medicine.dose, intakeLine, mealLine, modeLine].filter(
    (line): line is string => Boolean(line),
  );
}

export function buildPillboxPlanTitle(participantTitle: string, locale: MobileLocale) {
  const normalized = participantTitle.trim();
  if (!normalized) {
    return getPlanOnboardingText(locale, "planTitle");
  }
  const localizedPrefix = getPlanOnboardingText(locale, "forPrefix");
  const prefixPattern =
    locale === "de"
      ? /^für\s/i
      : locale === "pl"
        ? /^dla\s/i
        : locale === "en"
          ? /^for\s/i
          : /^для\s/i;
  return prefixPattern.test(normalized) ? normalized : `${localizedPrefix} ${normalized}`;
}

export function buildPillboxCreatePlanPayload(input: {
  draft: PillboxPlanDraft;
  participantTitle: string;
  recipientIds: string[];
  locale: MobileLocale;
  today?: Date;
}): MobilePillboxPlanWrite {
  const startDate = input.today ?? new Date();

  return {
    title: buildPillboxPlanTitle(input.participantTitle, input.locale),
    subjectAccountId: input.draft.participantId,
    memberAccountIds: input.recipientIds,
    medications: input.draft.medicines.map((medicine, index) => {
      const courseDurationDays =
        medicine.intakeMode === "course" ? medicine.courseDurationDays : null;
      const courseStartDate =
        courseDurationDays && courseDurationDays > 0
          ? formatDateOnly(startDate)
          : null;
      const courseEndDate =
        courseDurationDays && courseDurationDays > 0
          ? formatDateOnly(addDays(startDate, courseDurationDays - 1))
          : null;

      return {
        customMedicineName: medicine.name.trim(),
        householdMedicineId: null,
        doseAmount: medicine.dose.trim(),
        mealRule: mapMealRelationToApi(medicine.mealRelation),
        repeatDays: mapWeekdaysToIso(medicine.weekdays),
        times: medicine.times,
        courseMode: medicine.intakeMode === "course" ? "period" : "continuous",
        courseStartDate,
        courseEndDate,
        position: index,
      };
    }),
  };
}

export function buildPlanAvatarText(label: string): string {
  return resolveAvatarText(label);
}

export function buildMedicineCountLabel(count: number, locale: MobileLocale) {
  return buildPillboxMedicineCountLabel(count, locale);
}

export function buildNextInfoLabel(input: {
  locale: MobileLocale;
  times: string[];
}) {
  return buildPillboxNextInfoLabel({ ...input, variant: "compact" });
}

export function buildNotificationRecipientSummary(input: {
  recipientIds: string[];
  members: Pick<MobileFamilyMember, "id" | "displayName">[];
}) {
  return input.members
    .filter((member) => input.recipientIds.includes(member.id))
    .map((member) => member.displayName)
    .join(", ");
}

function resolveAvatarText(label: string): string {
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "•";
}

function dedupeFamilyMembers(familyMembers: MobileFamilyMember[]) {
  const seenIds = new Set<string>();
  return familyMembers.filter((member) => {
    if (seenIds.has(member.id)) {
      return false;
    }
    seenIds.add(member.id);
    return true;
  });
}

function mapMealRelationToApi(
  value: PillboxDraftMedicine["mealRelation"],
): "before_meal" | "with_meal" | "after_meal" | "not_matter" {
  if (value === "before_food") {
    return "before_meal";
  }
  if (value === "with_food") {
    return "with_meal";
  }
  if (value === "after_food") {
    return "after_meal";
  }
  return "not_matter";
}

function mapWeekdaysToIso(weekdays: PillboxWeekdayId[]) {
  const dayOrder = new Map([
    ["mon", 1],
    ["tue", 2],
    ["wed", 3],
    ["thu", 4],
    ["fri", 5],
    ["sat", 6],
    ["sun", 7],
  ]);

  return weekdays
    .map((day) => dayOrder.get(day) ?? null)
    .filter((value): value is number => value !== null);
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}
