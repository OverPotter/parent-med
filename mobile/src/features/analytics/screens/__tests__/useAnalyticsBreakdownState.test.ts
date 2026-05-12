import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileIllnessEpisodeInsights } from "../../../illness/api/illnessAnalyticsApi";
import { fetchMobileIllnessEpisodeInsights } from "../../../illness/api/illnessAnalyticsApi";
import {
  resetAnalyticsBreakdownStateCache,
  useAnalyticsBreakdownState,
} from "../useAnalyticsBreakdownState";

jest.mock("../../../illness/api/illnessAnalyticsApi", () => ({
  fetchMobileIllnessEpisodeInsights: jest.fn(),
}));

function makeInsights(
  overrides: Partial<MobileIllnessEpisodeInsights> = {},
): MobileIllnessEpisodeInsights {
  return {
    episodeId: "episode-1",
    durationDays: 3,
    peakTemperatureCelsius: 39.1,
    peakTemperatureAt: "2026-05-03T19:00:00.000Z",
    lastTemperatureCelsius: 37.2,
    lastEventAt: "2026-05-04T20:00:00.000Z",
    temperatureCount: 4,
    administrationCount: 2,
    commentCount: 1,
    medicationMode: "guided",
    medicineNames: ["Ibuprofen"],
    totalEvents: 7,
    firstTemperatureAt: "2026-05-03T09:00:00.000Z",
    lastAdministrationAt: "2026-05-04T18:00:00.000Z",
    temperaturePoints: [],
    ...overrides,
  };
}

const mockedFetchInsights = jest.mocked(fetchMobileIllnessEpisodeInsights);

type ProbeProps = {
  episodeId: string;
};

let latestState: ReturnType<typeof useAnalyticsBreakdownState> | null = null;

function Probe({ episodeId }: ProbeProps) {
  latestState = useAnalyticsBreakdownState({
    authSession: { accessToken: "token" },
    episodeId,
  });

  return null;
}

describe("useAnalyticsBreakdownState", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetAnalyticsBreakdownStateCache();
    latestState = null;
  });

  it("loads breakdown insights for the selected episode", async () => {
    const insights = makeInsights();
    mockedFetchInsights.mockResolvedValue(insights);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe, { episodeId: "episode-1" }));
      await Promise.resolve();
    });

    expect(latestState?.insights).toEqual(insights);
    expect(mockedFetchInsights).toHaveBeenCalledWith(
      { accessToken: "token" },
      "episode-1",
    );
  });

});
