import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { ChildCard } from "../../../children/model/childrenRedesign";
import type {
  MobileIllnessEpisode,
  MobileIllnessHistorySummary,
} from "../../../illness/api/illnessAnalyticsApi";
import {
  deleteMobileIllnessEpisode,
  fetchMobileIllnessEpisodes,
  fetchMobileIllnessHistorySummary,
} from "../../../illness/api/illnessAnalyticsApi";
import {
  resetAnalyticsScreenStateCache,
  useAnalyticsScreenState,
} from "../useAnalyticsScreenState";

jest.mock("../../../illness/api/illnessAnalyticsApi", () => ({
  fetchMobileIllnessHistorySummary: jest.fn(),
  fetchMobileIllnessEpisodes: jest.fn(),
  deleteMobileIllnessEpisode: jest.fn(),
}));

function makeChildCard(): ChildCard {
  return {
    nodeId: "child-card-1",
    name: "Мила",
    stats: "2.4",
    child: {
      id: "child-1",
      name: "Мила",
      ageLabel: "2 года",
      weightValue: "12 кг",
      heightValue: "86 см",
      birthDate: "2024-05-01",
      babyModeEnabled: true,
      avatarKey: "girl",
      gender: "girl",
      allergies: null,
      notes: null,
    },
    avatarSource: 1,
    quickActions: [],
    isLocked: false,
  };
}

function makeSummary(
  overrides: Partial<MobileIllnessHistorySummary> = {},
): MobileIllnessHistorySummary {
  return {
    period: "half_year",
    totalClosedEpisodes: 2,
    episodeCount: 2,
    lastEpisodeStartedAt: "2026-05-10T09:00:00.000Z",
    daysSinceLastEpisode: 1,
    mostActivePeriodLabel: "Май",
    averageDurationDays: 2,
    longestDurationDays: 4,
    episodesWithTemperature38Plus: 1,
    episodesWithTemperature39Plus: 0,
    episodesWithAdministrations: 1,
    observationOnlyEpisodes: 1,
    guidedEpisodes: 1,
    totalTemperatureEntries: 3,
    timeline: [],
    durationBuckets: [],
    ...overrides,
  };
}

function makeEpisode(
  id: string,
  overrides: Partial<MobileIllnessEpisode> = {},
): MobileIllnessEpisode {
  return {
    id,
    childId: "child-1",
    startedAt: "2026-05-01T08:00:00.000Z",
    title: "ОРВИ",
    status: "closed",
    medicationMode: "guided",
    note: "Был жар ночью",
    memberAccountIds: [],
    createdByAccountId: "account-1",
    closedAt: "2026-05-02T09:00:00.000Z",
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

const mockedFetchSummary = jest.mocked(fetchMobileIllnessHistorySummary);
const mockedFetchEpisodes = jest.mocked(fetchMobileIllnessEpisodes);
const mockedDeleteEpisode = jest.mocked(deleteMobileIllnessEpisode);

type ProbeProps = {
  locale: string;
  visible: boolean;
};

let latestState: ReturnType<typeof useAnalyticsScreenState> | null = null;

function Probe({ locale, visible }: ProbeProps) {
  latestState = useAnalyticsScreenState({
    authSession: { accessToken: "token" },
    child: makeChildCard(),
    locale,
    visible,
  });

  return null;
}

describe("useAnalyticsScreenState", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetAnalyticsScreenStateCache();
    latestState = null;
  });

  it("loads analytics when screen is visible", async () => {
    const summary = makeSummary();
    const episodes = [makeEpisode("episode-1")];
    const summaryDeferred = createDeferred<MobileIllnessHistorySummary>();
    const episodesDeferred = createDeferred<MobileIllnessEpisode[]>();
    mockedFetchSummary.mockReturnValue(summaryDeferred.promise);
    mockedFetchEpisodes.mockReturnValue(episodesDeferred.promise);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe, { locale: "ru", visible: true }));
    });

    await act(async () => {
      summaryDeferred.resolve(summary);
      episodesDeferred.resolve(episodes);
      await Promise.all([summaryDeferred.promise, episodesDeferred.promise]);
    });

    expect(latestState?.summary).toEqual(summary);
    expect(latestState?.episodes).toEqual(episodes);
    expect(mockedFetchSummary).toHaveBeenCalledWith(
      { accessToken: "token" },
      "child-1",
      "half_year",
    );
    expect(mockedFetchEpisodes).toHaveBeenCalledWith(
      { accessToken: "token" },
      "child-1",
    );
  });

  it("does not load analytics when screen is hidden", async () => {
    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, { locale: "ru", visible: false }),
      );
    });

    expect(mockedFetchSummary).not.toHaveBeenCalled();
    expect(mockedFetchEpisodes).not.toHaveBeenCalled();
  });

  it("resets period on locale change and clears pending delete on close", async () => {
    const summaryDeferred = createDeferred<MobileIllnessHistorySummary>();
    const episodesDeferred = createDeferred<MobileIllnessEpisode[]>();
    mockedFetchSummary.mockReturnValue(summaryDeferred.promise);
    mockedFetchEpisodes.mockReturnValue(episodesDeferred.promise);

    let tree: any;

    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(Probe, { locale: "ru", visible: true }),
      );
    });

    await act(async () => {
      summaryDeferred.resolve(makeSummary());
      episodesDeferred.resolve([makeEpisode("episode-1")]);
      await Promise.all([summaryDeferred.promise, episodesDeferred.promise]);
    });

    act(() => {
      latestState?.setSelectedPeriodId("year");
      latestState?.handleRequestDeleteEpisode({
        id: "episode-1",
        monthLabel: "Май",
        dayLabel: "3",
        meta: "Эпизод 1",
        title: "ОРВИ",
        closedAt: "Закрыт 10:00",
        description: "Температура",
        startedAt: "2026-05-01T08:00:00.000Z",
        closedAtIso: "2026-05-02T09:00:00.000Z",
      });
    });

    expect(latestState?.selectedPeriodId).toBe("year");
    expect(latestState?.openSwipeEpisodeId).toBeNull();
    expect(latestState?.pendingDeleteEpisode).toBeNull();

    await act(async () => {
      tree.update(React.createElement(Probe, { locale: "de", visible: true }));
    });

    expect(latestState?.selectedPeriodId).toBe("halfYear");

    act(() => {
      latestState?.handleCloseDeleteDialog();
    });

    expect(latestState?.pendingDeleteEpisode).toBeNull();
    expect(latestState?.openSwipeEpisodeId).toBeNull();
  });

  it("opens delete state for the chosen episode", async () => {
    const summaryDeferred = createDeferred<MobileIllnessHistorySummary>();
    const episodesDeferred = createDeferred<MobileIllnessEpisode[]>();
    mockedFetchSummary.mockReturnValue(summaryDeferred.promise);
    mockedFetchEpisodes.mockReturnValue(episodesDeferred.promise);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe, { locale: "ru", visible: true }));
    });

    await act(async () => {
      summaryDeferred.resolve(makeSummary({ episodeCount: 2 }));
      episodesDeferred.resolve([
        makeEpisode("episode-1"),
        makeEpisode("episode-2"),
      ]);
      await Promise.all([summaryDeferred.promise, episodesDeferred.promise]);
    });

    act(() => {
      latestState?.handleRequestDeleteEpisode({
        id: "episode-1",
        monthLabel: "Май",
        dayLabel: "3",
        meta: "Эпизод 2",
        title: "ОРВИ",
        closedAt: "Закрыт 10:00",
        description: "Температура",
        startedAt: "2026-05-01T08:00:00.000Z",
        closedAtIso: "2026-05-02T09:00:00.000Z",
      });
    });

    expect(latestState?.openSwipeEpisodeId).toBe("episode-1");
    expect(latestState?.pendingDeleteEpisode?.id).toBe("episode-1");
    expect(mockedDeleteEpisode).not.toHaveBeenCalled();
  });

  it("keeps the previous summary while a new period summary is loading", async () => {
    const halfYearSummary = createDeferred<MobileIllnessHistorySummary>();
    const yearSummary = createDeferred<MobileIllnessHistorySummary>();
    const episodesDeferred = createDeferred<MobileIllnessEpisode[]>();

    mockedFetchSummary
      .mockReturnValueOnce(halfYearSummary.promise)
      .mockReturnValueOnce(yearSummary.promise);
    mockedFetchEpisodes.mockReturnValue(episodesDeferred.promise);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe, { locale: "ru", visible: true }));
    });

    await act(async () => {
      halfYearSummary.resolve(makeSummary({ episodeCount: 2 }));
      episodesDeferred.resolve([makeEpisode("episode-1")]);
      await Promise.all([halfYearSummary.promise, episodesDeferred.promise]);
    });

    expect(latestState?.summary?.episodeCount).toBe(2);

    act(() => {
      latestState?.setSelectedPeriodId("year");
    });

    expect(latestState?.summary?.episodeCount).toBe(2);

    await act(async () => {
      yearSummary.resolve(makeSummary({ period: "year", episodeCount: 5 }));
      await yearSummary.promise;
    });

    expect(latestState?.summary?.episodeCount).toBe(5);
  });

  it("retries loading after a failed request on the next open", async () => {
    mockedFetchSummary
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(makeSummary({ episodeCount: 4 }));
    mockedFetchEpisodes
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeEpisode("episode-2")]);

    let tree: any;

    await act(async () => {
      tree = TestRenderer.create(
        React.createElement(Probe, { locale: "ru", visible: true }),
      );
    });

    expect(latestState?.summary ?? null).toBeNull();
    expect(latestState?.episodes ?? null).toBeNull();
    expect(mockedFetchSummary).toHaveBeenCalledTimes(1);
    expect(mockedFetchEpisodes).toHaveBeenCalledTimes(1);

    await act(async () => {
      tree.update(React.createElement(Probe, { locale: "ru", visible: false }));
    });

    await act(async () => {
      tree.update(React.createElement(Probe, { locale: "ru", visible: true }));
    });

    expect(mockedFetchSummary).toHaveBeenCalledTimes(2);
    expect(mockedFetchEpisodes).toHaveBeenCalledTimes(2);
    expect(latestState?.summary?.episodeCount).toBe(4);
    expect(latestState?.episodes?.[0]?.id).toBe("episode-2");
  });
});
