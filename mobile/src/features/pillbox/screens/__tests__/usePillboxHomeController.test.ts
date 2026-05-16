import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileFamilyMember } from "../../../family/api/familyMembersApi";
import {
  deleteMobilePillboxPlan,
  getMobilePillboxPlan,
  listMobilePillboxPlans,
  takeMobilePillboxDose,
  toMobilePillboxPlanWrite,
  updateMobilePillboxPlan,
  type MobilePillboxPlan,
  type MobilePillboxPlanSummary,
} from "../../api/mobilePillboxPlansApi";
import { usePillboxHomeController } from "../usePillboxHomeController";

jest.mock("../../api/mobilePillboxPlansApi", () => ({
  deleteMobilePillboxPlan: jest.fn(),
  getMobilePillboxPlan: jest.fn(),
  listMobilePillboxPlans: jest.fn(),
  takeMobilePillboxDose: jest.fn(),
  toMobilePillboxPlanWrite: jest.fn((plan) => ({
    title: plan.title,
    subjectAccountId: plan.subjectAccountId,
    memberAccountIds: plan.memberAccountIds,
    medications: plan.medications,
    status: plan.status,
  })),
  updateMobilePillboxPlan: jest.fn(),
}));

function makeFamilyMember(
  id: string,
  displayName: string,
): MobileFamilyMember {
  return {
    id,
    email: null,
    familyId: "family-1",
    displayName,
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "ru",
    familyRole: "member",
    accessPolicy: {
      allChildren: true,
      childIds: [],
      childrenAccess: "edit",
      cabinetAccess: "edit",
      pillboxAccess: "edit",
      cabinetPushEnabled: true,
    },
  };
}

function makeSummary(
  overrides: Partial<MobilePillboxPlanSummary> = {},
): MobilePillboxPlanSummary {
  return {
    id: "plan-1",
    title: "Для мамы",
    status: "active",
    subjectAccountId: "acc-2",
    memberAccountIds: ["acc-1"],
    activeMedicationCount: 1,
    nextDoseAt: "2026-05-15T09:30:00.000Z",
    nextDoseLabel: null,
    nextMedicationId: "med-1",
    nextMedicationTitle: "Витамин D",
    courseSummaryKind: "continuous",
    courseProgressRatio: null,
    courseDayLabel: null,
    ...overrides,
  };
}

function makePlan(
  overrides: Partial<MobilePillboxPlan> = {},
): MobilePillboxPlan {
  return {
    id: "plan-1",
    familyId: "family-1",
    title: "Для мамы",
    status: "active",
    subjectAccountId: "acc-2",
    memberAccountIds: ["acc-2"],
    medications: [
      {
        id: "med-1",
        householdMedicineId: null,
        customMedicineName: "Витамин D",
        doseAmount: "1 капсула",
        mealRule: "after_meal",
        repeatDays: [1, 2, 3, 4, 5],
        times: ["09:00"],
        courseMode: "continuous",
        courseStartDate: null,
        courseEndDate: null,
        position: 0,
      },
    ],
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
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

const mockedDeletePlan = jest.mocked(deleteMobilePillboxPlan);
const mockedGetPlan = jest.mocked(getMobilePillboxPlan);
const mockedListPlans = jest.mocked(listMobilePillboxPlans);
const mockedTakeDose = jest.mocked(takeMobilePillboxDose);
const mockedToWrite = jest.mocked(toMobilePillboxPlanWrite);
const mockedUpdatePlan = jest.mocked(updateMobilePillboxPlan);

let latestController: ReturnType<typeof usePillboxHomeController> | null = null;

function Probe({
  familyMembers,
  isOverlayActive = false,
  onTabBarModeChange,
}: {
  familyMembers: MobileFamilyMember[];
  isOverlayActive?: boolean;
  onTabBarModeChange?: jest.Mock;
}) {
  latestController = usePillboxHomeController({
    accessToken: "token",
    currentAccountId: "acc-1",
    familyMembers,
    isOverlayActive,
    locale: "ru",
    onTabBarModeChange,
  });

  return null;
}

describe("usePillboxHomeController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    latestController = null;
    mockedListPlans.mockResolvedValue([]);
    mockedDeletePlan.mockResolvedValue(undefined as never);
    mockedGetPlan.mockResolvedValue(makePlan());
    mockedUpdatePlan.mockResolvedValue(makePlan({ memberAccountIds: ["acc-1"] }));
    mockedTakeDose.mockResolvedValue(makeSummary());
  });

  it("loads plans on mount and builds root state", async () => {
    const listDeferred = createDeferred<MobilePillboxPlanSummary[]>();
    const onTabBarModeChange = jest.fn();
    mockedListPlans.mockReturnValue(listDeferred.promise);

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
          onTabBarModeChange,
        }),
      );
    });

    await act(async () => {
      listDeferred.resolve([
        makeSummary(),
        makeSummary({
          id: "plan-2",
          title: "Для папы",
          nextDoseAt: "2026-05-16T09:30:00.000Z",
        }),
      ]);
      await listDeferred.promise;
    });

    expect(mockedListPlans).toHaveBeenCalledWith({ accessToken: "token" });
    expect(latestController?.displayedPlans.map((item) => item.id)).toEqual([
      "plan-1",
      "plan-2",
    ]);
    expect(latestController?.summaryStats).toEqual([
      { id: "plans", number: "2", label: "активных\nплана" },
      { id: "today", number: "1", label: "приёма\nна сегодня" },
    ]);
    expect(onTabBarModeChange).toHaveBeenCalledWith("foreground");
  });

  it("hides tab bar while local overlay is active", async () => {
    const onTabBarModeChange = jest.fn();
    mockedListPlans.mockResolvedValue([makeSummary()]);

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
          isOverlayActive: true,
          onTabBarModeChange,
        }),
      );
    });

    expect(onTabBarModeChange).toHaveBeenCalledWith("hidden");
  });

  it("confirms plan deletion before calling delete api", async () => {
    mockedListPlans.mockResolvedValue([
      makeSummary(),
      makeSummary({ id: "plan-2", title: "Для папы" }),
    ]);

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
        }),
      );
    });

    act(() => {
      latestController?.handleDeletePlan("plan-1");
    });

    expect(latestController?.pendingDeletePlanId).toBe("plan-1");

    await act(async () => {
      latestController?.handleConfirmDeletePlan();
      await Promise.resolve();
    });

    expect(mockedDeletePlan).toHaveBeenCalledWith({
      accessToken: "token",
      planId: "plan-1",
    });
    expect(latestController?.displayedPlans.map((item) => item.id)).toEqual(["plan-2"]);
    expect(latestController?.pendingDeletePlanId).toBeNull();
  });

  it("normalizes empty recipients back to the current account", async () => {
    mockedListPlans.mockResolvedValue([makeSummary()]);

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [
            makeFamilyMember("acc-1", "Мила"),
            makeFamilyMember("acc-2", "Артём"),
          ],
        }),
      );
    });

    await act(async () => {
      latestController?.handleToggleExpandedPlan("plan-1");
      await Promise.resolve();
    });

    await act(async () => {
      latestController?.handleSavePlanRecipients("plan-1", []);
      await Promise.resolve();
    });

    expect(mockedToWrite).toHaveBeenCalled();
    expect(mockedUpdatePlan).toHaveBeenCalledWith({
      accessToken: "token",
      planId: "plan-1",
      plan: expect.objectContaining({
        memberAccountIds: ["acc-1"],
      }),
    });
  });

  it("reloads summaries and expanded plan after marking intake", async () => {
    mockedListPlans.mockResolvedValue([makeSummary()]);
    mockedGetPlan.mockResolvedValue(makePlan());
    mockedTakeDose.mockResolvedValue(
      makeSummary({
        nextDoseAt: null,
        nextMedicationId: null,
        nextMedicationTitle: null,
      }),
    );

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
        }),
      );
    });

    await act(async () => {
      latestController?.handleToggleExpandedPlan("plan-1");
      await Promise.resolve();
    });

    await act(async () => {
      latestController?.handleMarkIntake("plan-1", "med-1", "2026-05-15T09:30:00.000Z");
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedTakeDose).toHaveBeenCalledWith({
      accessToken: "token",
      planId: "plan-1",
      medicationId: "med-1",
      scheduledFor: "2026-05-15T09:30:00.000Z",
    });
    expect(mockedListPlans).toHaveBeenCalledTimes(2);
    expect(mockedGetPlan).toHaveBeenCalledWith({
      accessToken: "token",
      planId: "plan-1",
    });
  });
});
