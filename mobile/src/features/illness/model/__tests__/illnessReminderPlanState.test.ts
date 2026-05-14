import type { MobileEpisodeMedicationPlan } from "../../api/episodeMedicationPlansApi";
import type { MobileIllnessObservation } from "../illnessObservation";
import {
  buildReminderPlanObservationState,
  hasMatchingReminderAdministration,
} from "../illnessReminderPlanState";

function makePlan(
  overrides: Partial<MobileEpisodeMedicationPlan> = {},
): MobileEpisodeMedicationPlan {
  return {
    id: "plan-1",
    episodeId: "episode-1",
    householdMedicineId: null,
    customMedicineName: "Ибупрофен",
    doseAmount: "5 мл",
    minIntervalMinutes: 180,
    maxDosesPerDay: 4,
    notes: null,
    memberAccountIds: ["acc-1"],
    createdAt: "2026-05-14T09:00:00.000Z",
    ...overrides,
  };
}

function makeObservation(
  overrides: Partial<MobileIllnessObservation> = {},
): MobileIllnessObservation {
  return {
    episodeId: "episode-1",
    childId: "child-1",
    startedAt: "2026-05-14T08:00:00.000Z",
    reason: "Fever",
    notificationRecipientAccountIds: ["acc-1"],
    medicationPlans: [],
    entries: [],
    ...overrides,
  };
}

describe("hasMatchingReminderAdministration", () => {
  it("matches medicine entries by normalized name and exact timestamp", () => {
    const observation = makeObservation({
      entries: [
        {
          id: "med-1",
          kind: "medicine",
          title: "Ибупрофен · 5 мл",
          subtitle: "Приём добавлен",
          createdAt: "2026-05-14T10:30:00.000Z",
          medicineName: "  ибупрофен ",
        },
      ],
    });

    expect(
      hasMatchingReminderAdministration(
        observation,
        "ИБУПРОФЕН",
        "2026-05-14T10:30:00.000Z",
      ),
    ).toBe(true);
  });

  it("does not match the same medicine at a different time", () => {
    const observation = makeObservation({
      entries: [
        {
          id: "med-1",
          kind: "medicine",
          title: "Ибупрофен · 5 мл",
          subtitle: "Приём добавлен",
          createdAt: "2026-05-14T10:30:00.000Z",
          medicineName: "Ибупрофен",
        },
      ],
    });

    expect(
      hasMatchingReminderAdministration(
        observation,
        "Ибупрофен",
        "2026-05-14T10:31:00.000Z",
      ),
    ).toBe(false);
  });
});

describe("buildReminderPlanObservationState", () => {
  it("replaces plan entry, prepends administration entry and updates recipients", () => {
    const plan = makePlan();
    const observation = makeObservation({
      medicationPlans: [makePlan({ id: "old-plan", customMedicineName: "Нурофен" })],
      entries: [
        {
          id: plan.id,
          kind: "reminder",
          title: "old reminder",
          subtitle: "old",
          createdAt: "2026-05-14T09:00:00.000Z",
        },
        {
          id: "older-entry",
          kind: "note",
          title: "note",
          subtitle: "meta",
          createdAt: "2026-05-14T08:00:00.000Z",
        },
      ],
    });

    const nextState = buildReminderPlanObservationState(observation, plan, "ru", {
      administrationEntryForState: {
        id: "med-1",
        kind: "medicine",
        title: "Ибупрофен · 5 мл",
        subtitle: "Приём добавлен",
        createdAt: "2026-05-14T10:00:00.000Z",
        medicineName: "Ибупрофен",
      },
      notificationRecipientAccountIds: ["acc-2"],
    });

    expect(nextState.notificationRecipientAccountIds).toEqual(["acc-2"]);
    expect(nextState.medicationPlans.map((entry) => entry.id)).toEqual([
      "plan-1",
      "old-plan",
    ]);
    expect(nextState.entries.map((entry) => entry.id)).toEqual([
      "med-1",
      "plan-1",
      "older-entry",
    ]);
  });
});
