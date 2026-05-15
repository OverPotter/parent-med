import type { MobileFamilyMember } from "../../family/api/familyMembersApi";

export type PillboxParticipantOption = {
  id: string;
  title: string;
  subtitle: string | null;
  avatarText: string;
};

export type PillboxDraftMedicine = {
  id: string;
  name: string;
  dose: string;
  dayparts: Array<"morning" | "day" | "evening" | "night">;
  times: string[];
  intakeMode: "continuous" | "course";
  mealRelation: "before_food" | "with_food" | "after_food" | "not_matter";
  weekdays: string[];
};

export type PillboxPlanDraft = {
  participantId: string | null;
  medicines: PillboxDraftMedicine[];
};

export function buildParticipantOptions(
  familyMembers: MobileFamilyMember[],
): PillboxParticipantOption[] {
  if (familyMembers.length > 0) {
    return familyMembers.map((member) => ({
      id: member.id,
      title: member.displayName,
      subtitle: member.relationshipLabel?.trim() || null,
      avatarText: resolveAvatarText(member.displayName),
    }));
  }

  return [
    { id: "father_artem", title: "Папа Артём", subtitle: null, avatarText: "П" },
    { id: "mother", title: "Мама", subtitle: null, avatarText: "М" },
    { id: "grandmother", title: "Бабушка", subtitle: null, avatarText: "Б" },
    { id: "grandfather", title: "Дедушка", subtitle: null, avatarText: "Д" },
    { id: "nanny_irina", title: "Няня Ирина", subtitle: null, avatarText: "Н" },
    { id: "child_dima", title: "Ребёнок Дима", subtitle: null, avatarText: "Р" },
  ];
}

export function createInitialPlanDraft(): PillboxPlanDraft {
  return {
    participantId: null,
    medicines: [
      {
        id: "nurofen_syrup",
        name: "Нурофен сироп",
        dose: "2 мл",
        dayparts: ["morning", "day", "evening"],
        times: ["08:30", "13:00", "20:30"],
        intakeMode: "continuous",
        mealRelation: "after_food",
        weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      },
      {
        id: "vitamin_d",
        name: "Витамин D",
        dose: "1 капсула",
        dayparts: ["morning"],
        times: ["09:00"],
        intakeMode: "continuous",
        mealRelation: "not_matter",
        weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      },
    ],
  };
}

export function createEmptyMedicineDraft(): PillboxDraftMedicine {
  return {
    id: `medicine_${Date.now()}`,
    name: "",
    dose: "",
    dayparts: ["morning"],
    times: ["08:30", "13:00", "20:30"],
    intakeMode: "continuous",
    mealRelation: "after_food",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  };
}

export function formatMedicineSummary(medicine: PillboxDraftMedicine): string {
  const intakeText =
    medicine.dayparts.length >= 3
      ? "3 раза в день"
      : medicine.dayparts.length === 2
        ? "2 раза в день"
        : medicine.dayparts[0] === "morning"
          ? "Утром"
          : medicine.dayparts[0] === "day"
            ? "Днём"
            : medicine.dayparts[0] === "evening"
              ? "Вечером"
              : "Ночью";
  const mealText =
    medicine.mealRelation === "before_food"
      ? "До еды"
      : medicine.mealRelation === "with_food"
        ? "Во время еды"
        : medicine.mealRelation === "after_food"
          ? "После еды"
          : "Независимо от еды";
  return `${medicine.dose} · ${intakeText} · ${mealText}`;
}

export function resolvePlanParticipantTitle(
  participantId: string | null,
  participants: PillboxParticipantOption[],
): string {
  return participants.find((item) => item.id === participantId)?.title ?? "Не выбран";
}

function resolveAvatarText(label: string): string {
  const first = label.trim().charAt(0);
  return first ? first.toUpperCase() : "•";
}
