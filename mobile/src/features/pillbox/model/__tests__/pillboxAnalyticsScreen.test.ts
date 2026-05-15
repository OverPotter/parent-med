import type { MobilePillboxHistorySummary } from "../../api/mobilePillboxPlansApi";
import {
  buildAnalyticsInsight,
  buildPillboxAnalyticsContent,
  resolveAnalyticsPlanLabel,
} from "../pillboxAnalyticsScreen";

function makeSummary(
  overrides: Partial<MobilePillboxHistorySummary> = {},
): MobilePillboxHistorySummary {
  return {
    planId: "plan-1",
    planTitle: "Plan 1",
    planStatus: "active",
    memberCount: 2,
    period: "half_year",
    totalMedications: 3,
    scheduledSlots: 12,
    takenSlots: 10,
    missedSlots: 1,
    lateSlots: 1,
    onTimeSlots: 9,
    adherenceRate: 0.833,
    onTimeRate: 0.9,
    timeline: [],
    topMissedMedications: [],
    ...overrides,
  };
}

describe("pillbox analytics model", () => {
  it("returns explicit polish copy instead of falling back to english", () => {
    const content = buildPillboxAnalyticsContent("pl");

    expect(content.title).toBe("Analityka");
    expect(content.planDescription).toBe(
      "Możesz szybko przełączać się między różnymi planami.",
    );
    expect(content.retryLabel).toBe("Spróbuj ponownie");
    expect(content.periods.map((item) => item.label)).toEqual([
      "Miesiąc",
      "3 mies.",
      "6 mies.",
      "Rok",
      "Wszystko",
    ]);
  });

  it("returns explicit german copy instead of falling back to english", () => {
    const content = buildPillboxAnalyticsContent("de");

    expect(content.title).toBe("Analysen");
    expect(content.loadingDescription).toBe(
      "Einhaltung, pünktliche Einnahmen und Aussetzer werden berechnet.",
    );
    expect(content.summaryErrorTitle).toBe("Analyse konnte nicht geladen werden");
  });

  it("builds localized insight for the top missed medicine", () => {
    const summary = makeSummary({
      adherenceRate: 0.7,
      topMissedMedications: [
        { medicationName: "Vitamin D", missedSlots: 3 },
      ],
    });

    expect(buildAnalyticsInsight(summary, "ru")).toBe(
      "Чаще всего сбивается: Vitamin D.",
    );
    expect(buildAnalyticsInsight(summary, "de")).toBe(
      "Am häufigsten verpasst: Vitamin D.",
    );
    expect(buildAnalyticsInsight(summary, "pl")).toBe(
      "Najczęściej pomijane: Vitamin D.",
    );
  });

  it("uses locale-aware empty plan labels", () => {
    expect(resolveAnalyticsPlanLabel([], null, "de")).toBe("Plan auswählen");
    expect(resolveAnalyticsPlanLabel([], null, "pl")).toBe("Wybierz plan");
    expect(resolveAnalyticsPlanLabel([], null, "en")).toBe("Choose a plan");
  });
});
