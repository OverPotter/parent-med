import type {
  MobileIllnessEpisode,
  MobileIllnessHistorySummary,
} from "../../../illness/api/illnessAnalyticsApi";
import { buildAnalyticsScreenContent } from "../analyticsScreen";

function makeSummary(
  overrides: Partial<MobileIllnessHistorySummary> = {},
): MobileIllnessHistorySummary {
  return {
    period: "half_year",
    totalClosedEpisodes: 3,
    episodeCount: 3,
    lastEpisodeStartedAt: "2026-05-10T09:00:00.000Z",
    daysSinceLastEpisode: 1,
    mostActivePeriodLabel: "Май",
    averageDurationDays: 2.4,
    longestDurationDays: 5,
    episodesWithTemperature38Plus: 2,
    episodesWithTemperature39Plus: 1,
    episodesWithAdministrations: 2,
    observationOnlyEpisodes: 1,
    guidedEpisodes: 1,
    totalTemperatureEntries: 8,
    timeline: [],
    durationBuckets: [],
    ...overrides,
  };
}

function makeEpisode(overrides: Partial<MobileIllnessEpisode> = {}): MobileIllnessEpisode {
  return {
    id: "episode-1",
    childId: "child-1",
    startedAt: "2026-05-01T08:00:00.000Z",
    title: "ОРВИ",
    status: "closed",
    medicationMode: "guided",
    note: "Был жар ночью",
    createdByAccountId: "account-1",
    closedAt: "2026-05-02T09:00:00.000Z",
    ...overrides,
  };
}

describe("buildAnalyticsScreenContent", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-11T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds russian period analytics and filters only recent closed episodes", () => {
    const content = buildAnalyticsScreenContent("ru", {
      summary: makeSummary(),
      period: "month",
      episodes: [
        makeEpisode({
          id: "recent-1",
          startedAt: "2026-05-03T08:00:00.000Z",
          closedAt: "2026-05-04T09:30:00.000Z",
          title: "Весенний вирус",
          note: "Температура и насморк",
        }),
        makeEpisode({
          id: "recent-2",
          startedAt: "2026-04-20T08:00:00.000Z",
          closedAt: "2026-04-21T21:04:00.000Z",
          title: "",
          note: "",
        }),
        makeEpisode({
          id: "old-closed",
          startedAt: "2026-03-01T08:00:00.000Z",
          closedAt: "2026-03-03T09:00:00.000Z",
        }),
        makeEpisode({
          id: "active",
          status: "active",
          closedAt: null,
        }),
      ],
    });

    expect(content.mainSummaryTitle).toBe("Главное за период");
    expect(content.periodOptions.map((option) => option.id)).toEqual([
      "month",
      "quarter",
      "halfYear",
      "year",
      "allTime",
    ]);
    expect(content.deleteDialog).toEqual({
      title: "Точно удалить эпизод?",
      description: "Эпизод исчезнет из ленты и аналитики за период.",
      cancel: "Отмена",
      confirm: "Да, удалить",
    });
    expect(content.highlights).toMatchObject([
      { label: "Средняя длительность", value: "2 дня" },
      { label: "Самый долгий эпизод", value: "5 дней" },
    ]);
    expect(content.episodes).toHaveLength(2);
    expect(content.episodes[0]).toMatchObject({
      id: "recent-1",
      meta: "Эпизод 2",
      title: "Весенний вирус",
      description: "Температура и насморк",
    });
    expect(content.episodes[1]).toMatchObject({
      id: "recent-2",
      meta: "Эпизод 1",
      title: "Без названия",
      description: "Без описания",
    });
  });

  it("returns empty-state copy when there is no summary yet", () => {
    const content = buildAnalyticsScreenContent("en", {
      summary: null,
      episodes: null,
      period: "all",
    });

    expect(content.mainSummaryInsights[0]).toMatchObject({
      title: "No completed episodes yet",
      subtitle: "Stats will appear after the first completed episode.",
    });
    expect(content.mainSummaryInsights[1].title).toBe(
      "Most active period is not available yet",
    );
    expect(content.mainSummaryInsights[2].title).toBe(
      "No episodes with medicine yet",
    );
    expect(content.highlights.map((item) => item.value)).toEqual(["—", "—"]);
    expect(content.episodes).toEqual([]);
  });
});
