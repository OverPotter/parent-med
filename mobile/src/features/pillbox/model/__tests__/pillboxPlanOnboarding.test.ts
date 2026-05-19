import {
  buildPillboxCreatePlanPayload,
  createEmptyMedicineDraft,
} from "../pillboxPlanOnboarding";

describe("pillbox plan onboarding model", () => {
  it("uses stable internal weekday ids for a new medicine draft", () => {
    expect(createEmptyMedicineDraft().weekdays).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]);
  });

  it("maps internal weekday ids to ISO repeat days in the create payload", () => {
    const draft = createEmptyMedicineDraft();
    draft.name = "Vitamin D";
    draft.dose = "1";
    draft.times = ["08:00"];
    draft.weekdays = ["mon", "wed", "sun"];

    const payload = buildPillboxCreatePlanPayload({
      draft: {
        participantId: "acc-1",
        notificationRecipientIds: ["acc-1"],
        medicines: [draft],
      },
      participantTitle: "You",
      recipientIds: ["acc-1"],
      locale: "en",
      today: new Date("2026-05-19T08:00:00.000Z"),
    });

    expect(payload.medications[0]?.repeatDays).toEqual([1, 3, 7]);
  });
});
