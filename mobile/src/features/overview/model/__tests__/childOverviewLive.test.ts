import { buildLiveOverviewData } from "../childOverviewLive";
import { getOverviewCopy } from "../childOverviewCopy";

describe("childOverviewLive", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("filters summary and feed by selected top period", () => {
    const copy = getOverviewCopy("ru");
    const live = buildLiveOverviewData(
      "ru",
      copy,
      "week",
      "chip-Все",
      {
        feedingRecords: [
          { recordedAt: "2026-05-10T09:00:00.000Z", feedingType: "breast" },
          { recordedAt: "2026-04-01T09:00:00.000Z", feedingType: "breast" },
        ] as any,
        sleepSessions: [],
        weightEntries: [],
        heightEntries: [],
        illnessEpisodes: [],
      },
      null,
      null,
    );

    expect(live).not.toBeNull();
    expect(live?.summaryInsights[1]?.title).toContain("1");
    expect(live?.events).toHaveLength(1);
    expect(live?.events[0]?.rows).toHaveLength(1);
  });

  it("keeps calendar navigation independent from top period filters", () => {
    const copy = getOverviewCopy("ru");
    const live = buildLiveOverviewData(
      "ru",
      copy,
      "week",
      "chip-Все",
      {
        feedingRecords: [
          { recordedAt: "2026-05-10T09:00:00.000Z", feedingType: "breast" },
          { recordedAt: "2026-03-18T07:30:00.000Z", feedingType: "breast" },
        ] as any,
        sleepSessions: [],
        weightEntries: [],
        heightEntries: [],
        illnessEpisodes: [],
      },
      null,
      "2026-03",
    );

    expect(live).not.toBeNull();
    expect(live?.events).toHaveLength(1);
    expect(live?.selectedDayEntriesByDay["2026-03-18"]).toHaveLength(1);
    expect(live?.selectedDayEntriesByDay["2026-05-10"]).toBeUndefined();
  });
});
