import { buildIllnessJournalContent } from "../illnessJournal";

describe("buildIllnessJournalContent", () => {
  it("returns russian journal copy from a single TS source", () => {
    const content = buildIllnessJournalContent("ru");

    expect(content.title).toBe("Журнал");
    expect(content.subtitle).toBe("Текущие наблюдения и быстрые действия.");
    expect(content.emptyTitle).toBe("Нет активных наблюдений");
    expect(content.emptyPrimaryLabel).toBe("Выбрать ребёнка");
  });

  it("keeps german and polish copy explicit instead of falling back to english", () => {
    expect(buildIllnessJournalContent("de").emptyTitle).toBe(
      "Keine aktiven Beobachtungen",
    );
    expect(buildIllnessJournalContent("pl").emptyTitle).toBe(
      "Brak aktywnych obserwacji",
    );
  });
});
