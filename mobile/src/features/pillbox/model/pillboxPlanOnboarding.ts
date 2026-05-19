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

type ParticipantFallback = {
  currentAccountId: string;
  locale: MobileLocale;
};

export type PillboxDraftMedicine = {
  id: string;
  name: string;
  dose: string;
  times: string[];
  intakeMode: "continuous" | "course";
  courseDurationDays: number | null;
  mealRelation: "before_food" | "with_food" | "after_food" | "not_matter";
  weekdays: string[];
};

export type PillboxPlanDraft = {
  participantId: string | null;
  notificationRecipientIds: string[];
  medicines: PillboxDraftMedicine[];
};

let medicineDraftSequence = 0;

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

  const fallbackTitle = fallback.locale === "ru" ? "Вы" : "You";
  return [
    {
      id: fallback.currentAccountId,
      title: fallbackTitle,
      subtitle: null,
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
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  };
}

function createMedicineDraftId() {
  medicineDraftSequence += 1;
  return `medicine_${Date.now()}_${medicineDraftSequence}`;
}

export function formatMedicineSummary(medicine: PillboxDraftMedicine): string {
  const intakeText =
    medicine.times.length >= 3
      ? "3 раза в день"
      : medicine.times.length === 2
        ? "2 раза в день"
        : medicine.times.length === 1
          ? medicine.times[0]
          : "По времени";
  const mealText =
    medicine.mealRelation === "before_food"
      ? "До еды"
      : medicine.mealRelation === "with_food"
        ? "Во время еды"
        : medicine.mealRelation === "after_food"
          ? "После еды"
          : "Независимо от еды";
  const modeText =
    medicine.intakeMode === "course" && medicine.courseDurationDays
      ? `Курс ${medicine.courseDurationDays} дн.`
      : null;
  return [medicine.dose, intakeText, mealText, modeText].filter(Boolean).join(" · ");
}

export function resolvePlanParticipantTitle(
  participantId: string | null,
  participants: PillboxParticipantOption[],
): string {
  return participants.find((item) => item.id === participantId)?.title ?? "Не выбран";
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
    const fallbackTitle = fallback.locale === "ru" ? "Вы" : "You";
    return [
      {
        id: fallback.currentAccountId,
        email: null,
        familyId: "local-family",
        displayName: fallbackTitle,
        relationshipLabel: null,
        phone: null,
        preferredLanguage: fallback.locale,
        familyRole: "member",
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
    preferredLanguage: "ru",
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

export function buildReviewMedicineLines(medicine: PillboxDraftMedicine): string[] {
  const intakeLine =
    medicine.times.length > 1
      ? `${medicine.times.length} раза в день: ${medicine.times.join(", ")}`
      : medicine.times[0];
  const mealLine =
    medicine.mealRelation === "after_food"
      ? "После еды"
      : medicine.mealRelation === "before_food"
        ? "До еды"
        : medicine.mealRelation === "with_food"
          ? "Во время еды"
          : "Независимо от еды";
  const modeLine =
    medicine.intakeMode === "course" && medicine.courseDurationDays
      ? `Курс ${medicine.courseDurationDays} дней`
      : null;

  return [medicine.dose, intakeLine, mealLine, modeLine].filter(
    (line): line is string => Boolean(line),
  );
}

export function buildPillboxPlanTitle(participantTitle: string) {
  const normalized = participantTitle.trim();
  if (!normalized) {
    return "План приёма";
  }
  return /^для\s/i.test(normalized) ? normalized : `Для ${normalized}`;
}

export function buildPillboxCreatePlanPayload(input: {
  draft: PillboxPlanDraft;
  participantTitle: string;
  recipientIds: string[];
  today?: Date;
}): MobilePillboxPlanWrite {
  const startDate = input.today ?? new Date();

  return {
    title: buildPillboxPlanTitle(input.participantTitle),
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

function mapWeekdaysToIso(weekdays: string[]) {
  const dayOrder = new Map([
    ["Пн", 1],
    ["Вт", 2],
    ["Ср", 3],
    ["Чт", 4],
    ["Пт", 5],
    ["Сб", 6],
    ["Вс", 7],
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
