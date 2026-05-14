import React, { useState } from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileAuthSession } from "../../../auth/api/authApi";
import { createMobileAdministrationEvent } from "../../api/administrationEventsApi";
import {
  createMobileEpisodeMedicationPlan,
  updateMobileEpisodeMedicationPlan,
} from "../../api/episodeMedicationPlansApi";
import { updateMobileIllnessEpisode } from "../../api/illnessAnalyticsApi";
import type { MobileEpisodeMedicationPlan } from "../../api/episodeMedicationPlansApi";
import type {
  IllnessQuickActionKind,
  MobileIllnessObservation,
} from "../illnessObservation";
import { useIllnessFlowController } from "../useIllnessFlowController";

jest.mock("../../api/administrationEventsApi", () => ({
  createMobileAdministrationEvent: jest.fn(),
  deleteMobileAdministrationEvent: jest.fn(),
}));

jest.mock("../../api/episodeMedicationPlansApi", () => ({
  createMobileEpisodeMedicationPlan: jest.fn(),
  updateMobileEpisodeMedicationPlan: jest.fn(),
  deleteMobileEpisodeMedicationPlan: jest.fn(),
}));

jest.mock("../../api/illnessAnalyticsApi", () => ({
  createMobileIllnessEpisode: jest.fn(),
  updateMobileIllnessEpisode: jest.fn(),
}));

jest.mock("../../api/illnessCommentsApi", () => ({
  createMobileIllnessComment: jest.fn(),
  deleteMobileIllnessComment: jest.fn(),
}));

jest.mock("../../api/temperatureEntriesApi", () => ({
  createMobileTemperatureEntry: jest.fn(),
  deleteMobileTemperatureEntry: jest.fn(),
}));

const mockedCreateAdministrationEvent = jest.mocked(createMobileAdministrationEvent);
const mockedCreatePlan = jest.mocked(createMobileEpisodeMedicationPlan);
const mockedUpdatePlan = jest.mocked(updateMobileEpisodeMedicationPlan);
const mockedUpdateEpisode = jest.mocked(updateMobileIllnessEpisode);

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

function makePlan(
  overrides: Partial<MobileEpisodeMedicationPlan> = {},
): MobileEpisodeMedicationPlan {
  return {
    id: "plan-1",
    episodeId: "episode-1",
    householdMedicineId: null,
    customMedicineName: "Ибупрофен",
    doseAmount: "5 мл",
    minIntervalMinutes: 180,
    maxDosesPerDay: 4,
    notes: null,
    memberAccountIds: ["acc-1"],
    createdAt: "2026-05-14T09:00:00.000Z",
    ...overrides,
  };
}

function makeObservation(
  childId: string,
  overrides: Partial<MobileIllnessObservation> = {},
): MobileIllnessObservation {
  return {
    episodeId: `episode-${childId}`,
    childId,
    createdByAccountId: null,
    startedAt: "2026-05-14T08:00:00.000Z",
    reason: "Fever",
    notificationRecipientAccountIds: [],
    medicationPlans: [],
    entries: [],
    ...overrides,
  };
}

type LatestState = {
  controller: ReturnType<typeof useIllnessFlowController>;
  observations: Record<string, MobileIllnessObservation | undefined>;
  selectedChildId: string;
  selectedKind: IllnessQuickActionKind;
  returnScreen: "illnessJournal" | "illnessReminders";
};

let latestState: LatestState | null = null;

function Probe({
  initialObservations,
  initialSelectedChildId,
  navigateToChildrenRoot,
  navigateToIllnessJournalRoot,
  navigateToIllnessReminders,
  navigateToIllnessAction,
}: {
  initialObservations: Record<string, MobileIllnessObservation | undefined>;
  initialSelectedChildId: string;
  navigateToChildrenRoot: jest.Mock;
  navigateToIllnessJournalRoot: jest.Mock;
  navigateToIllnessReminders: jest.Mock;
  navigateToIllnessAction: jest.Mock;
}) {
  const [observations, setObservations] = useState(initialObservations);
  const [selectedChildId, setSelectedChildId] = useState(initialSelectedChildId);
  const [selectedKind, setSelectedKind] =
    useState<IllnessQuickActionKind>("temperature");
  const [returnScreen, setReturnScreen] =
    useState<"illnessJournal" | "illnessReminders">("illnessJournal");

  const controller = useIllnessFlowController({
    authSession: makeAuthSession(),
    activeIllnessObservationsByChildId: observations,
    locale: "ru",
    selectedChildId,
    setSelectedChildId,
    setSelectedIllnessActionKind: setSelectedKind,
    setIllnessActionReturnScreen: setReturnScreen,
    setActiveIllnessObservationsByChildId: setObservations,
    navigateToChildrenRoot,
    navigateToIllnessJournalRoot,
    navigateToIllnessReminders,
    navigateToIllnessAction,
  });

  latestState = {
    controller,
    observations,
    selectedChildId,
    selectedKind,
    returnScreen,
  };

  return null;
}

describe("useIllnessFlowController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    latestState = null;
  });

  it("creates reminder plan, logs already-given administration, and updates observation state", async () => {
    mockedCreatePlan.mockResolvedValue(makePlan());
    mockedCreateAdministrationEvent.mockResolvedValue({
      id: "admin-1",
      episodeId: "episode-child-1",
      householdMedicineId: null,
      customMedicineName: "Ибупрофен",
      administeredAt: "2026-05-14T09:30:00.000Z",
      administeredByAccountId: "acc-1",
      administeredByNameSnapshot: "Parent",
      amount: "5 мл",
      unit: null,
      reason: null,
    });

    const navigateToChildrenRoot = jest.fn();
    const navigateToIllnessJournalRoot = jest.fn();
    const navigateToIllnessReminders = jest.fn();
    const navigateToIllnessAction = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          initialObservations: {
            "child-1": makeObservation("child-1"),
          },
          initialSelectedChildId: "child-1",
          navigateToChildrenRoot,
          navigateToIllnessJournalRoot,
          navigateToIllnessReminders,
          navigateToIllnessAction,
        }),
      );
    });

    await act(async () => {
      await latestState?.controller.handleSaveReminderEntry({
        childId: "child-1",
        customMedicineName: "Ибупрофен",
        doseAmount: "5 мл",
        minIntervalMinutes: 180,
        maxDosesPerDay: 4,
        alreadyGiven: true,
        lastGivenAt: "2026-05-14T09:30:00.000Z",
        notes: null,
      });
    });

    expect(mockedCreatePlan).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      expect.objectContaining({
        episodeId: "episode-child-1",
        customMedicineName: "Ибупрофен",
        doseAmount: "5 мл",
        minIntervalMinutes: 180,
        maxDosesPerDay: 4,
        memberAccountIds: ["acc-1"],
      }),
    );
    expect(mockedCreateAdministrationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      expect.objectContaining({
        episodeId: "episode-child-1",
        customMedicineName: "Ибупрофен",
        amount: "5 мл",
        administeredAt: "2026-05-14T09:30:00.000Z",
      }),
    );
    expect(navigateToIllnessReminders).toHaveBeenCalled();
    expect(latestState?.observations["child-1"]?.medicationPlans.map((entry) => entry.id)).toEqual([
      "plan-1",
    ]);
    expect(latestState?.observations["child-1"]?.entries.map((entry) => entry.id)).toEqual([
      "admin-1",
      "plan-1",
    ]);
  });

  it("closes observation, switches to the next sick child, and keeps journal flow open", async () => {
    mockedUpdateEpisode.mockResolvedValue({
      id: "episode-child-1",
      childId: "child-1",
      startedAt: "2026-05-14T08:00:00.000Z",
      status: "closed",
      note: "Fever",
      memberAccountIds: [],
      createdByAccountId: "acc-1",
      closedAt: "2026-05-14T10:00:00.000Z",
    } as never);

    const navigateToChildrenRoot = jest.fn();
    const navigateToIllnessJournalRoot = jest.fn();
    const navigateToIllnessReminders = jest.fn();
    const navigateToIllnessAction = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          initialObservations: {
            "child-1": makeObservation("child-1"),
            "child-2": makeObservation("child-2"),
          },
          initialSelectedChildId: "child-1",
          navigateToChildrenRoot,
          navigateToIllnessJournalRoot,
          navigateToIllnessReminders,
          navigateToIllnessAction,
        }),
      );
    });

    await act(async () => {
      await latestState?.controller.handleFinishIllnessObservation("child-1");
    });

    expect(mockedUpdateEpisode).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token" }),
      "episode-child-1",
      expect.objectContaining({
        status: "closed",
        closedAt: expect.any(String),
      }),
    );
    expect(latestState?.observations["child-1"]).toBeUndefined();
    expect(latestState?.selectedChildId).toBe("child-2");
    expect(navigateToIllnessJournalRoot).toHaveBeenCalled();
    expect(navigateToChildrenRoot).not.toHaveBeenCalled();
  });
});
