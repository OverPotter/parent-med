import type { MobileFeedingRecord } from "../../api/feedingRecordsApi";
import {
  buildFeedingHistoryScreenContent,
  buildFeedingMetricsFromApi,
  filterFeedingRecordsByPeriod,
  mapFeedingTimelineFromApi,
} from "../feedingHistoryScreen";

function makeRecord(
  overrides: Partial<MobileFeedingRecord> = {},
): MobileFeedingRecord {
  return {
    id: "record-1",
    childId: "child-1",
    feedingType: "breast",
    breastSide: "left",
    isExpressed: false,
    formulaVolumeMl: null,
    recordedAt: "2026-05-10T08:00:00.000Z",
    startedAt: null,
    endedAt: null,
    durationMinutes: 12,
    status: "completed",
    note: null,
    createdByAccountId: "account-1",
    ...overrides,
  };
}

describe("feedingHistoryScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses canonical metric ids so backend metrics can override spec values", () => {
    const content = buildFeedingHistoryScreenContent("ru", "Мила", "7d");

    expect(content.metrics.map((metric) => metric.id)).toEqual([
      "amount",
      "time",
      "drop",
    ]);
  });

  it("filters records by selected period", () => {
    const records = [
      makeRecord({ id: "recent", recordedAt: "2026-05-12T10:00:00.000Z" }),
      makeRecord({ id: "week", recordedAt: "2026-05-08T10:00:00.000Z" }),
      makeRecord({ id: "month", recordedAt: "2026-04-25T10:00:00.000Z" }),
      makeRecord({ id: "old", recordedAt: "2026-03-10T10:00:00.000Z" }),
    ];

    expect(filterFeedingRecordsByPeriod(records, "24h").map((item) => item.id)).toEqual(["recent"]);
    expect(filterFeedingRecordsByPeriod(records, "7d").map((item) => item.id)).toEqual([
      "recent",
      "week",
    ]);
    expect(filterFeedingRecordsByPeriod(records, "30d").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
    ]);
    expect(filterFeedingRecordsByPeriod(records, "all").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
      "old",
    ]);
  });

  it("recomputes backend metrics from the selected period", () => {
    const dailyRecords = [
      makeRecord({
        id: "formula",
        feedingType: "formula",
        formulaVolumeMl: 120,
        recordedAt: "2026-05-12T06:00:00.000Z",
        durationMinutes: 10,
      }),
      makeRecord({
        id: "breast",
        recordedAt: "2026-05-12T18:00:00.000Z",
        durationMinutes: 20,
      }),
    ];

    expect(buildFeedingMetricsFromApi(dailyRecords, "ru", "24h")).toEqual([
      { id: "amount", value: "2 раз" },
      { id: "time", value: "15:00" },
      { id: "drop", value: "15 мин" },
    ]);
  });

  it("maps backend records into timeline rows", () => {
    const timeline = mapFeedingTimelineFromApi(
      [
        makeRecord({
          id: "formula",
          feedingType: "formula",
          formulaVolumeMl: 120,
          recordedAt: "2026-05-12T06:15:00.000Z",
          durationMinutes: 10,
        }),
      ],
      "ru",
    );

    expect(timeline[0]).toMatchObject({
      id: "formula",
      time: "09:15",
      day: "Сегодня",
      type: "Смесь",
      meta: "120 мл · 10 мин",
    });
  });
});
