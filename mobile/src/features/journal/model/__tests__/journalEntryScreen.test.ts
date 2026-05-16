import { buildJournalEntryScreenContent } from "../journalEntryScreen";

describe("buildJournalEntryScreenContent", () => {
  it("returns localized feeding option labels for german and polish", () => {
    const germanContent = buildJournalEntryScreenContent("feeding", "de");
    const polishContent = buildJournalEntryScreenContent("feeding", "pl");

    expect(germanContent.feedingOptions).toEqual([
      { id: "breast", label: "Brust" },
      { id: "formula", label: "Formula" },
    ]);
    expect(polishContent.feedingOptions).toEqual([
      { id: "breast", label: "Pierś" },
      { id: "formula", label: "Mieszanka" },
    ]);
  });

  it("uses locale-aware measurement units in journal previews", () => {
    const englishWeight = buildJournalEntryScreenContent("weight", "en");
    const russianHeight = buildJournalEntryScreenContent("height", "ru");

    expect(englishWeight.rows[0]?.value).toBe("13.4 kg");
    expect(englishWeight.rows[2]?.value).toBe("+0.2 kg");
    expect(russianHeight.rows[0]?.value).toBe("92 см");
    expect(russianHeight.rows[2]?.value).toBe("+1 см");
  });
});
