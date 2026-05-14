import React, { useState } from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileAuthSession } from "../../features/auth/api/authApi";
import type { MobileIllnessObservation } from "../../features/illness/model/illnessObservation";
import { defaultMobileLiveActivityPreferences } from "../../features/live-activities/liveActivityPreferences";
import {
  ensureIllnessLiveActivityPreferencesHydrated,
  isIllnessLiveActivityEnabled,
  setIllnessLiveActivityEnabled,
  subscribeIllnessLiveActivityPreferences,
} from "../../features/live-activities/illnessLiveActivityPreference";
import {
  stopAllNativeLiveActivities,
  stopNativeLiveActivity,
} from "../../features/live-activities/nativeLiveActivities";
import { useLiveActivitySettingsController } from "../useLiveActivitySettingsController";

jest.mock("../../features/live-activities/illnessLiveActivityPreference", () => ({
  ensureIllnessLiveActivityPreferencesHydrated: jest.fn(() => Promise.resolve()),
  isIllnessLiveActivityEnabled: jest.fn(),
  setIllnessLiveActivityEnabled: jest.fn(() => Promise.resolve()),
  subscribeIllnessLiveActivityPreferences: jest.fn(() => jest.fn()),
}));

jest.mock("../../features/live-activities/nativeLiveActivities", () => ({
  stopAllNativeLiveActivities: jest.fn(() => Promise.resolve()),
  stopNativeLiveActivity: jest.fn(() => Promise.resolve()),
}));

const mockedSetIllnessLiveActivityEnabled = jest.mocked(setIllnessLiveActivityEnabled);
const mockedStopAllNativeLiveActivities = jest.mocked(stopAllNativeLiveActivities);
const mockedStopNativeLiveActivity = jest.mocked(stopNativeLiveActivity);
const mockedEnsureIllnessLiveActivityPreferencesHydrated = jest.mocked(
  ensureIllnessLiveActivityPreferencesHydrated,
);
const mockedIsIllnessLiveActivityEnabled = jest.mocked(
  isIllnessLiveActivityEnabled,
);
const mockedSubscribeIllnessLiveActivityPreferences = jest.mocked(
  subscribeIllnessLiveActivityPreferences,
);

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

function makeObservation(): MobileIllnessObservation {
  return {
    episodeId: "episode-1",
    childId: "child-1",
    createdByAccountId: "acc-1",
    startedAt: "2026-05-14T08:00:00.000Z",
    reason: "Fever",
    notificationRecipientAccountIds: [],
    medicationPlans: [],
    entries: [],
  };
}

let latestController: ReturnType<typeof useLiveActivitySettingsController> | null = null;
let latestCanUseLiveActivities = false;
let latestFamilyRoutinesCount = 0;
let latestPreferences = defaultMobileLiveActivityPreferences;

function Probe() {
  const [canUseLiveActivities, setCanUseLiveActivities] = useState(false);
  const [familyRoutinesCount, setFamilyRoutinesCount] = useState(0);
  const [liveActivityPreferences, setLiveActivityPreferences] = useState(
    defaultMobileLiveActivityPreferences,
  );

  latestController = useLiveActivitySettingsController({
    authSession: makeAuthSession(),
    setCanUseLiveActivities,
    setFamilyRoutinesCount,
    setLiveActivityPreferences,
  });

  latestCanUseLiveActivities = canUseLiveActivities;
  latestFamilyRoutinesCount = familyRoutinesCount;
  latestPreferences = liveActivityPreferences;

  return null;
}

describe("useLiveActivitySettingsController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedEnsureIllnessLiveActivityPreferencesHydrated.mockResolvedValue(undefined);
    mockedSubscribeIllnessLiveActivityPreferences.mockReturnValue(jest.fn());
    latestController = null;
    latestCanUseLiveActivities = false;
    latestFamilyRoutinesCount = 0;
    latestPreferences = defaultMobileLiveActivityPreferences;
  });

  it("stops disabled live activities when push preferences turn them off", async () => {
    await act(async () => {
      TestRenderer.create(React.createElement(Probe));
    });

    await act(async () => {
      latestController?.handlePushPreferencesChanged({
        childrenEnabled: true,
        beforeReminderMinutes: 30,
        pillboxEnabled: true,
        pillboxBeforeReminderMinutes: 60,
        cabinetNotify10Days: false,
        cabinetNotify7Days: false,
        cabinetNotify3Days: true,
        liveActivitySleepEnabled: false,
        liveActivityFeedingEnabled: true,
        liveActivityIllnessEnabled: false,
      });
    });

    expect(latestPreferences).toEqual({
      sleepEnabled: false,
      feedingEnabled: true,
      illnessEnabled: false,
    });
    expect(mockedStopAllNativeLiveActivities).toHaveBeenCalledWith("sleep");
    expect(mockedStopAllNativeLiveActivities).toHaveBeenCalledWith("illness");
    expect(mockedStopAllNativeLiveActivities).not.toHaveBeenCalledWith("feeding");
  });

  it("updates family access flags from settings callbacks", async () => {
    await act(async () => {
      TestRenderer.create(React.createElement(Probe));
    });

    act(() => {
      latestController?.handleFamilyAccessChanged({
        planCode: "plus",
        subscriptionStatus: "active",
        premiumActive: true,
        canManageSubscription: true,
        canUseLiveActivities: true,
        currentChildrenCount: 2,
        currentAdultsCount: 2,
        currentPillboxPlanCount: 7,
      });
    });

    expect(latestCanUseLiveActivities).toBe(true);
    expect(latestFamilyRoutinesCount).toBe(7);
  });

  it("persists illness toggle and stops the native activity when turning it off", async () => {
    mockedIsIllnessLiveActivityEnabled.mockReturnValue(true);

    await act(async () => {
      TestRenderer.create(React.createElement(Probe));
    });

    await act(async () => {
      await latestController?.handleToggleIllnessLiveActivity(makeObservation());
    });

    expect(mockedSetIllnessLiveActivityEnabled).toHaveBeenCalledWith({
      episodeId: "episode-1",
      accountId: "acc-1",
      enabled: false,
    });
    expect(mockedStopNativeLiveActivity).toHaveBeenCalledWith({
      kind: "illness",
      itemId: "child-1",
    });
  });
});
