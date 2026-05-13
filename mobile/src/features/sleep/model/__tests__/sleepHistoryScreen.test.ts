import type { MobileSleepSession } from "../../api/sleepSessionsApi";
import {
  buildSleepHistoryScreenContent,
  buildSleepMetricsFromApi,
  filterSleepSessionsByPeriod,
  mapSleepTimelineFromApi,
} from "../sleepHistoryScreen";

function makeSession(
  overrides: Partial<MobileSleepSession> = {},
): MobileSleepSession {
  return {
    id: "session-1",
    childId: "child-1",
    startedAt: "2026-05-10T20:00:00.000Z",
    endedAt: "2026-05-11T06:00:00.000Z",
    durationMinutes: 600,
    status: "completed",
    createdByAccountId: "account-1",
    ...overrides,
  };
}

describe("sleepHistoryScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses canonical metric ids so backend metrics can override spec values", () => {
    const content = buildSleepHistoryScreenContent("ru", "Мила", "7d");

    expect(content.metrics.map((metric) => metric.id)).toEqual([
      "night_sleep",
      "clock",
      "zzz",
    ]);
  });

  it("filters sessions by selected period", () => {
    const sessions = [
      makeSession({ id: "recent", startedAt: "2026-05-12T10:00:00.000Z" }),
      makeSession({ id: "week", startedAt: "2026-05-08T22:00:00.000Z" }),
      makeSession({ id: "month", startedAt: "2026-04-25T22:00:00.000Z" }),
      makeSession({ id: "old", startedAt: "2026-03-10T22:00:00.000Z" }),
    ];

    expect(filterSleepSessionsByPeriod(sessions, "24h").map((item) => item.id)).toEqual(["recent"]);
    expect(filterSleepSessionsByPeriod(sessions, "7d").map((item) => item.id)).toEqual([
      "recent",
      "week",
    ]);
    expect(filterSleepSessionsByPeriod(sessions, "30d").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
    ]);
    expect(filterSleepSessionsByPeriod(sessions, "all").map((item) => item.id)).toEqual([
      "recent",
      "week",
      "month",
      "old",
    ]);
  });

  it("recomputes backend metrics from the selected period", () => {
    const dailySessions = [
      makeSession({
        id: "night",
        startedAt: "2026-05-12T00:00:00.000Z",
        durationMinutes: 480,
      }),
      makeSession({
        id: "nap",
        startedAt: "2026-05-12T12:00:00.000Z",
        endedAt: "2026-05-12T13:30:00.000Z",
        durationMinutes: 90,
      }),
    ];

    expect(buildSleepMetricsFromApi(dailySessions, "ru", "24h")).toEqual([
      { id: "night_sleep", value: "9.5", suffix: "ч" },
      { id: "clock", value: "09:00", suffix: "" },
      { id: "zzz", value: "4.8", suffix: "ч" },
    ]);
  });

  it("maps backend sessions into timeline rows", () => {
    const timeline = mapSleepTimelineFromApi(
      [
        makeSession({
          id: "night",
          startedAt: "2026-05-12T00:15:00.000Z",
          endedAt: "2026-05-12T08:15:00.000Z",
          durationMinutes: 480,
        }),
      ],
      "ru",
    );

    expect(timeline[0]).toMatchObject({
      id: "night",
      time: "03:15",
      day: "Сегодня",
      type: "Сон",
      meta: "Конец 11:15 · 8 ч",
    });
  });
});
