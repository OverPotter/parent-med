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

    expect(englishWeight.rows[0]?.label).toBe("Weight");
    expect(englishWeight.rows[2]?.label).toBe("Change");
    expect(russianHeight.rows[0]?.label).toBe("Рост");
    expect(russianHeight.rows[2]?.helper).toBe("с прошлого измерения");
    expect(englishWeight.rows.every((row) => row.value === "—")).toBe(true);
    expect(russianHeight.rows.every((row) => row.value === "—")).toBe(true);
  });
});
