import { buildChildrenScreenContent } from "../../../children/model/childrenRedesign";
import { buildChildOverviewScreenContent } from "../childOverviewScreen";

describe("buildChildOverviewScreenContent", () => {
  const child = buildChildrenScreenContent("ru").cards[0];

  it("returns polish overview ui copy", () => {
    const content = buildChildOverviewScreenContent(child, "pl");

    expect(content.calendarMonthSummaryTitle).toBe("Podsumowanie miesiąca");
    expect(content.graphicsCategoryTitle).toBe("Według kategorii");
    expect(content.selectedDayToggleHint).toContain("miesięczne podsumowanie");
  });

  it("returns german overview ui copy", () => {
    const content = buildChildOverviewScreenContent(child, "de");

    expect(content.calendarMonthSummaryHint).toContain("Kalender");
    expect(content.selectedDayEmptyLabel).toContain("keine Einträge");
    expect(content.graphicsCategorySubtitle).toContain("gewählten Zeitraum");
  });
});
