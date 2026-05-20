import type {
  MobilePillboxPlan,
  MobilePillboxPlanSummary,
} from "../../api/mobilePillboxPlansApi";
import {
  buildPillboxHomeScreenContent,
  buildPillboxPlanCardsFromSummaries,
  buildPillboxPlanDetailFromEntity,
  buildPillboxSummaryStatsFromSummaries,
} from "../pillboxHomeScreen";

function makeSummary(
  overrides: Partial<MobilePillboxPlanSummary> = {},
): MobilePillboxPlanSummary {
  return {
    id: "plan-1",
    title: "Для мамы",
    status: "active",
    subjectAccountId: null,
    memberAccountIds: ["member-1"],
    activeMedicationCount: 2,
    nextDoseAt: "2026-05-15T09:30:00.000Z",
    nextDoseLabel: null,
    nextMedicationId: "med-1",
    nextMedicationTitle: "Витамин D",
    courseSummaryKind: "continuous",
    courseProgressRatio: null,
    courseDayLabel: null,
    ...overrides,
  };
}

function makePlan(
  overrides: Partial<MobilePillboxPlan> = {},
): MobilePillboxPlan {
  return {
    id: "plan-1",
    familyId: "family-1",
    title: "Для мамы",
    status: "active",
    subjectAccountId: null,
    memberAccountIds: ["member-1"],
    medications: [
      {
        id: "med-1",
        householdMedicineId: null,
        customMedicineName: "Витамин D",
        doseAmount: "1 капсула",
        mealRule: "after_meal",
        repeatDays: [1, 2, 3, 4, 5],
        times: ["09:00"],
        courseMode: "continuous",
        courseStartDate: null,
        courseEndDate: null,
        position: 0,
      },
    ],
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("pillbox home model", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps only two summary stats on the root screen", () => {
    const stats = buildPillboxSummaryStatsFromSummaries({
      summaries: [
        makeSummary(),
        makeSummary({
          id: "plan-2",
          nextDoseAt: "2026-05-16T09:30:00.000Z",
        }),
      ],
      locale: "ru",
    });

    expect(stats).toEqual([
      { id: "plans", number: "2", label: "активных\nплана" },
      { id: "today", number: "1", label: "приёма\nна сегодня" },
    ]);
  });

  it("sorts overdue plans before upcoming ones", () => {
    const cards = buildPillboxPlanCardsFromSummaries({
      summaries: [
        makeSummary({
          id: "upcoming",
          title: "Для папы",
          nextDoseAt: "2026-05-15T11:00:00.000Z",
        }),
        makeSummary({
          id: "overdue",
          title: "Для мамы",
          nextDoseAt: "2026-05-15T05:00:00.000Z",
        }),
      ],
      locale: "ru",
      now: new Date("2026-05-15T10:00:00.000Z"),
    });

    expect(cards.map((item) => [item.id, item.status, item.nextInfo])).toEqual([
      ["overdue", "missed", "пропущен приём"],
      ["upcoming", "active", "сегодня в 14:00"],
    ]);
  });

  it("builds plan detail with recipients and schedule note", () => {
    const detail = buildPillboxPlanDetailFromEntity({
      plan: makePlan(),
      locale: "en",
      familyMembers: [
        { id: "member-1", displayName: "Mila" },
        { id: "member-2", displayName: "Artem" },
      ],
    });

    expect(detail.recipientsLabel).toBe("Mila");
    expect(detail.medicineCountLabel).toBe("1 medicine");
    expect(detail.scheduleNote).toBe("Next intake at 09:00");
    expect(detail.medicines[0]).toMatchObject({
      title: "Витамин D",
      summary: "1 капсула · After meal · Continuous",
      schedule: "09:00",
    });
  });

  it("returns localized copy for german and polish pillbox screens", () => {
    expect(buildPillboxHomeScreenContent("de")).toMatchObject({
      title: "Pillendose",
      createPlanLabel: "Plan erstellen",
    });
    expect(buildPillboxHomeScreenContent("pl")).toMatchObject({
      title: "Organizer leków",
      createPlanLabel: "Utwórz plan",
    });
  });

  it("localizes pillbox detail labels beyond ru and en", () => {
    const detail = buildPillboxPlanDetailFromEntity({
      plan: makePlan(),
      locale: "de",
      familyMembers: [],
    });

    expect(detail.statusText).toBe("Aktiv");
    expect(detail.medicineCountLabel).toBe("1 Medikament");
    expect(detail.scheduleNote).toBe("Nächste Einnahme um 09:00");
    expect(detail.medicines[0]?.summary).toContain("Nach dem Essen");
  });
});
