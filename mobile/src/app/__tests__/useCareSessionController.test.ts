import React, { useState } from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileAuthSession } from "../../features/auth/api/authApi";
import type { MobileChildSummary } from "../../features/children/api/childrenApi";
import {
  startMobileFeedingRecord,
  stopMobileFeedingRecord,
  type MobileFeedingRecord,
} from "../../features/feeding/api/feedingRecordsApi";
import { defaultMobileLiveActivityPreferences } from "../../features/live-activities/liveActivityPreferences";
import { syncCareLiveActivity } from "../../features/live-activities/liveActivities";
import {
  startMobileSleepSession,
  stopMobileSleepSession,
  type MobileSleepSession,
} from "../../features/sleep/api/sleepSessionsApi";
import { useCareSessionController } from "../useCareSessionController";

jest.mock("../../features/sleep/api/sleepSessionsApi", () => ({
  startMobileSleepSession: jest.fn(),
  stopMobileSleepSession: jest.fn(),
}));

jest.mock("../../features/feeding/api/feedingRecordsApi", () => ({
  startMobileFeedingRecord: jest.fn(),
  stopMobileFeedingRecord: jest.fn(),
}));

jest.mock("../../features/live-activities/liveActivities", () => ({
  syncCareLiveActivity: jest.fn(() => Promise.resolve()),
}));

const mockedStartMobileSleepSession = jest.mocked(startMobileSleepSession);
const mockedStopMobileSleepSession = jest.mocked(stopMobileSleepSession);
const mockedStartMobileFeedingRecord = jest.mocked(startMobileFeedingRecord);
const mockedStopMobileFeedingRecord = jest.mocked(stopMobileFeedingRecord);
const mockedSyncCareLiveActivity = jest.mocked(syncCareLiveActivity);

function makeAuthSession(): MobileAuthSession {
  return {
    tokenType: "bearer",
    accessToken: "token",
    refreshToken: "refresh",
    account: {
      id: "acc-1",
      email: "parent@example.com",
      familyId: "family-1",
      displayName: "Parent",
      relationshipLabel: "Mom",
      phone: null,
      preferredLanguage: "ru",
      familyRole: "owner",
      hasRecoveryCode: true,
    },
    family: {
      id: "family-1",
      name: "Family",
      ownerAccountId: "acc-1",
    },
  };
}

const child: MobileChildSummary = {
  id: "child-1",
  familyId: "family-1",
  name: "Mila",
  birthDate: "2024-05-01",
  ageLabel: "2 years",
  babyModeEnabled: true,
  avatarKey: null,
  gender: null,
  allergies: null,
  notes: null,
};

function makeSleepSession(
  overrides: Partial<MobileSleepSession> = {},
): MobileSleepSession {
  return {
    id: "sleep-1",
    childId: "child-1",
    startedAt: "2026-05-14T09:00:00.000Z",
    endedAt: null,
    durationMinutes: null,
    status: "active",
    createdByAccountId: "acc-1",
    ...overrides,
  };
}

function makeFeedingRecord(
  overrides: Partial<MobileFeedingRecord> = {},
): MobileFeedingRecord {
  return {
    id: "feed-1",
    childId: "child-1",
    feedingType: "breast",
    breastSide: "left",
    isExpressed: false,
    formulaVolumeMl: null,
    recordedAt: "2026-05-14T09:00:00.000Z",
    startedAt: "2026-05-14T09:00:00.000Z",
    endedAt: null,
    durationMinutes: null,
    status: "active",
    note: null,
    createdByAccountId: "acc-1",
    ...overrides,
  };
}

let latestController: ReturnType<typeof useCareSessionController> | null = null;
let latestSleepMap: Record<string, MobileSleepSession | null> = {};
let latestFeedingMap: Record<string, MobileFeedingRecord | null> = {};

function Probe({
  initialSleep,
  initialFeeding,
}: {
  initialSleep?: Record<string, MobileSleepSession | null>;
  initialFeeding?: Record<string, MobileFeedingRecord | null>;
}) {
  const [sleepMap, setSleepMap] = useState(initialSleep ?? {});
  const [feedingMap, setFeedingMap] = useState(initialFeeding ?? {});

  latestController = useCareSessionController({
    authSession: makeAuthSession(),
    children: [child],
    locale: "ru",
    liveActivityPreferences: defaultMobileLiveActivityPreferences,
    selectedChildId: child.id,
    activeSleepSessionsByCardId: sleepMap,
    activeFeedingRecordsByCardId: feedingMap,
    setActiveSleepSessionsByCardId: setSleepMap,
    setActiveFeedingRecordsByCardId: setFeedingMap,
  });

  latestSleepMap = sleepMap;
  latestFeedingMap = feedingMap;

  return null;
}

describe("useCareSessionController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    latestController = null;
    latestSleepMap = {};
    latestFeedingMap = {};
  });

  it("starts a sleep session and syncs the live activity immediately", async () => {
    const startedSession = makeSleepSession();
    mockedStartMobileSleepSession.mockResolvedValue(startedSession);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe));
    });

    await act(async () => {
      await latestController?.handleSleepPress("child-1");
    });

    expect(mockedStartMobileSleepSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      { childId: "child-1" },
    );
    expect(latestSleepMap["child-1"]).toEqual(startedSession);
    expect(mockedSyncCareLiveActivity).toHaveBeenCalledWith({
      kind: "sleep",
      child,
      session: startedSession,
      locale: "ru",
      preferences: defaultMobileLiveActivityPreferences,
      currentAccountId: "acc-1",
    });
  });

  it("stops an active feeding record and clears local state before syncing", async () => {
    const stoppedRecord = makeFeedingRecord({
      status: "stopped",
      endedAt: "2026-05-14T09:20:00.000Z",
    });
    mockedStopMobileFeedingRecord.mockResolvedValue(stoppedRecord);

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          initialFeeding: { "child-1": makeFeedingRecord() },
        }),
      );
    });

    await act(async () => {
      await latestController?.handleFeedingPress("child-1");
    });

    expect(mockedStopMobileFeedingRecord).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      { recordId: "feed-1" },
    );
    expect(latestFeedingMap["child-1"]).toBeNull();
    expect(mockedSyncCareLiveActivity).toHaveBeenCalledWith({
      kind: "feeding",
      child,
      feeding: null,
      locale: "ru",
      preferences: defaultMobileLiveActivityPreferences,
      currentAccountId: "acc-1",
    });
  });

  it("starts feeding timer for the selected child and syncs it", async () => {
    const startedRecord = makeFeedingRecord();
    mockedStartMobileFeedingRecord.mockResolvedValue(startedRecord);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe));
    });

    await act(async () => {
      await latestController?.handleStartFeedingTimer();
    });

    expect(mockedStartMobileFeedingRecord).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      {
        childId: "child-1",
        feedingType: "breast",
        breastSide: "left",
        isExpressed: false,
      },
    );
    expect(latestFeedingMap["child-1"]).toEqual(startedRecord);
    expect(mockedSyncCareLiveActivity).toHaveBeenCalledWith({
      kind: "feeding",
      child,
      feeding: startedRecord,
      locale: "ru",
      preferences: defaultMobileLiveActivityPreferences,
      currentAccountId: "acc-1",
    });
  });
});
