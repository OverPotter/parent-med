import {
  syncIllnessLiveActivity,
  syncSleepLiveActivity,
} from "../liveActivities";

jest.mock("../nativeLiveActivities", () => ({
  isNativeLiveActivitiesSupported: jest.fn(() => true),
  stopAllNativeLiveActivities: jest.fn(() => Promise.resolve()),
  stopNativeLiveActivity: jest.fn(() => Promise.resolve()),
  upsertNativeLiveActivity: jest.fn(() => Promise.resolve({ activeId: "active-1" })),
}));

jest.mock("../illnessLiveActivityPreference", () => ({
  isIllnessLiveActivityEnabled: jest.fn(() => true),
}));

jest.mock("../liveActivityLinking", () => ({
  buildLiveActivityUrl: jest.fn((childId: string, action: string) =>
    `pillpath://children?liveChild=${childId}&liveAction=${action}`,
  ),
}));

const {
  upsertNativeLiveActivity,
  stopNativeLiveActivity,
} = jest.requireMock("../nativeLiveActivities") as {
  upsertNativeLiveActivity: jest.Mock;
  stopNativeLiveActivity: jest.Mock;
};

describe("liveActivities", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15T12:00:00.000Z"));
    upsertNativeLiveActivity.mockClear();
    stopNativeLiveActivity.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("builds german sleep live activity copy from device locale", async () => {
    await syncSleepLiveActivity({
      child: { id: "child-1", name: "Mila" },
      session: {
        startedAt: "2026-05-15T10:30:00.000Z",
        endedAt: null,
        createdByAccountId: "account-1",
      },
      locale: "de",
      preferences: {
        sleepEnabled: true,
        feedingEnabled: true,
        illnessEnabled: true,
      },
      currentAccountId: "account-1",
    });

    expect(upsertNativeLiveActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "sleep",
        language: "de",
        subtitle: "Schlaf läuft",
        primaryValue: "Aktiv",
        primaryCaption: "Status",
        secondaryCaption: "Beginn",
      }),
    );
  });

  it("builds polish illness live activity copy from device locale", async () => {
    await syncIllnessLiveActivity({
      child: { id: "child-1", name: "Mila" },
      observation: {
        episodeId: "episode-1",
        childId: "child-1",
        createdByAccountId: "account-1",
        startedAt: "2026-05-13T08:00:00.000Z",
        reason: "Gorączka",
        notificationRecipientAccountIds: [],
        medicationPlans: [],
        entries: [
          {
            id: "temp-1",
            kind: "temperature",
            title: "38,4 °C",
            subtitle: "Dodano temperaturę",
            createdAt: "2026-05-15T09:00:00.000Z",
          },
        ],
      },
      locale: "pl",
      preferences: {
        sleepEnabled: true,
        feedingEnabled: true,
        illnessEnabled: true,
      },
      currentAccountId: "account-1",
    });

    expect(upsertNativeLiveActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "illness",
        language: "pl",
        subtitle: expect.stringContaining("Obserwacja od"),
        primaryValue: "38.4°",
        primaryCaption: expect.stringContaining("O "),
        statusLabel: "Obserwacja trwa",
      }),
    );
  });
});
