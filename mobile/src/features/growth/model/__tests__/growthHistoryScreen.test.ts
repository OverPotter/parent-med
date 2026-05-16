import type { MobileHeightEntry } from "../../api/heightEntriesApi";
import {
  buildGrowthHistoryScreenContent,
  buildGrowthMetricsFromApi,
  filterHeightEntriesByPeriod,
  mapHeightTimelineFromApi,
} from "../growthHistoryScreen";

function makeEntry(
  overrides: Partial<MobileHeightEntry> = {},
): MobileHeightEntry {
  return {
    id: "entry-1",
    childId: "child-1",
    valueCm: 88.4,
    measuredAt: "2026-05-10T08:00:00.000Z",
    ...overrides,
  };
}

describe("growthHistoryScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("localizes period and metric labels from canonical ids instead of russian spec labels", () => {
    const content = buildGrowthHistoryScreenContent("de", "Mila", "all");

    expect(content.periods).toEqual([
      { id: "24h", label: "24 Std.", active: false },
      { id: "7d", label: "7 Tage", active: false },
      { id: "30d", label: "30 Tage", active: false },
      { id: "all", label: "Gesamter Zeitraum", active: true },
    ]);
    expect(content.metrics.map((metric) => metric.label)).toEqual([
      "Aktuelle Größe",
      "Seit dem letzten",
      "Letzte Messung",
    ]);
  });

  it("filters entries by selected period", () => {
    const entries = [
      makeEntry({ id: "recent", measuredAt: "2026-05-12T10:00:00.000Z" }),
      makeEntry({ id: "week", measuredAt: "2026-05-08T10:00:00.000Z" }),
      makeEntry({ id: "month", measuredAt: "2026-04-25T10:00:00.000Z" }),
      makeEntry({ id: "old", measuredAt: "2026-03-10T10:00:00.000Z" }),
    ];

    expect(filterHeightEntriesByPeriod(entries, "24h").map((item) => item.id)).toEqual([
      "recent",
    ]);
    expect(filterHeightEntriesByPeriod(entries, "7d").map((item) => item.id)).toEqual([
      "recent",
      "week",
    ]);
    expect(filterHeightEntriesByPeriod(entries, "30d").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
    ]);
    expect(filterHeightEntriesByPeriod(entries, "all").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
      "old",
    ]);
  });

  it("recomputes backend metrics from api entries", () => {
    const metrics = buildGrowthMetricsFromApi(
      [
        makeEntry({ id: "latest", valueCm: 88.4, measuredAt: "2026-05-12T06:00:00.000Z" }),
        makeEntry({ id: "previous", valueCm: 87.8, measuredAt: "2026-05-10T06:00:00.000Z" }),
      ],
      "pl",
    );

    expect(metrics).toEqual([
      { id: "ruler", value: "88.4", suffix: "cm" },
      { id: "minus", value: "+0.6", suffix: "cm" },
      { id: "calendar", value: expect.any(String), suffix: "" },
    ]);
  });

  it("maps backend entries into localized timeline rows", () => {
    const timeline = mapHeightTimelineFromApi(
      [
        makeEntry({
          id: "latest",
          valueCm: 88.4,
          measuredAt: "2026-05-12T06:15:00.000Z",
        }),
      ],
      "pl",
    );

    expect(timeline[0]).toMatchObject({
      id: "latest",
      value: "88.4 cm",
      meta: "Zapisano ręcznie",
    });
  });
});
