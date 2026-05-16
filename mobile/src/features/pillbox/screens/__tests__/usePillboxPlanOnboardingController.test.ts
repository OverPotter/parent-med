import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import type { MobileFamilyMember } from "../../../family/api/familyMembersApi";
import {
  createMobilePillboxPlan,
  type MobilePillboxPlan,
} from "../../api/mobilePillboxPlansApi";
import { usePillboxPlanOnboardingController } from "../usePillboxPlanOnboardingController";

jest.mock("../../api/mobilePillboxPlansApi", () => ({
  createMobilePillboxPlan: jest.fn(),
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

function makeCreatedPlan(): MobilePillboxPlan {
  return {
    id: "plan-1",
    familyId: "family-1",
    title: "Для Артём",
    status: "active",
    subjectAccountId: null,
    memberAccountIds: ["acc-1"],
    medications: [],
    createdAt: "2026-05-15T08:00:00.000Z",
    updatedAt: "2026-05-15T08:00:00.000Z",
  };
}

const mockedCreatePlan = jest.mocked(createMobilePillboxPlan);

let latestController: ReturnType<typeof usePillboxPlanOnboardingController> | null = null;

function Probe({
  familyMembers,
  onClose,
  onPlanSaved,
}: {
  familyMembers: MobileFamilyMember[];
  onClose: jest.Mock;
  onPlanSaved: jest.Mock;
}) {
  latestController = usePillboxPlanOnboardingController({
    visible: true,
    accessToken: "token",
    currentAccountId: "acc-1",
    familyMembers,
    locale: "ru",
    onClose,
    onPlanSaved,
  });

  return null;
}

describe("usePillboxPlanOnboardingController", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    latestController = null;
    mockedCreatePlan.mockResolvedValue(makeCreatedPlan());
  });

  it("selects participant and preselects notifications for that participant", async () => {
    const onClose = jest.fn();
    const onPlanSaved = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [
            makeFamilyMember("acc-1", "Мила"),
            makeFamilyMember("acc-2", "Артём"),
          ],
          onClose,
          onPlanSaved,
        }),
      );
    });

    act(() => {
      latestController?.handleSelectParticipant("acc-2");
    });

    expect(latestController?.draft.participantId).toBe("acc-2");
    expect(latestController?.resolvedRecipientIds).toEqual(["acc-2"]);
    expect(latestController?.canGoNextFromParticipant).toBe(true);
    expect(latestController?.participantTitle).toBe("Артём");
  });

  it("keeps medicine editor inside step 2 and saves medicine back to the list", async () => {
    const onClose = jest.fn();
    const onPlanSaved = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
          onClose,
          onPlanSaved,
        }),
      );
    });

    act(() => {
      latestController?.handleSelectParticipant("acc-1");
      latestController?.setStep("list");
      latestController?.handleOpenMedicineEditor();
    });

    expect(latestController?.step).toBe("medicine");
    expect(latestController?.currentStepIndex).toBe(2);

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              name: "Витамин D",
              dose: "1 капсула",
              times: ["08:30"],
            }
          : current,
      );
    });

    expect(latestController?.canSaveMedicine).toBe(true);

    act(() => {
      latestController?.handleSaveMedicine();
    });

    expect(latestController?.step).toBe("list");
    expect(latestController?.currentStepIndex).toBe(2);
    expect(latestController?.draft.medicines).toHaveLength(1);
    expect(latestController?.draft.medicines[0]).toMatchObject({
      name: "Витамин D",
      dose: "1 капсула",
      times: ["08:30"],
    });
    expect(latestController?.canGoNextFromList).toBe(true);
  });

  it("requires at least one intake time before medicine can be saved", async () => {
    const onClose = jest.fn();
    const onPlanSaved = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
          onClose,
          onPlanSaved,
        }),
      );
    });

    act(() => {
      latestController?.handleSelectParticipant("acc-1");
      latestController?.setStep("list");
      latestController?.handleOpenMedicineEditor();
    });

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              name: "Витамин D",
              dose: "1 капсула",
            }
          : current,
      );
    });

    expect(latestController?.canSaveMedicine).toBe(false);

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              times: ["08:30"],
            }
          : current,
      );
    });

    expect(latestController?.canSaveMedicine).toBe(true);
  });

  it("removes a medicine from the onboarding list", async () => {
    const onClose = jest.fn();
    const onPlanSaved = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [makeFamilyMember("acc-1", "Мила")],
          onClose,
          onPlanSaved,
        }),
      );
    });

    act(() => {
      latestController?.handleSelectParticipant("acc-1");
      latestController?.setStep("list");
      latestController?.handleOpenMedicineEditor();
    });

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              name: "Витамин D",
              dose: "1 капсула",
              times: ["08:30"],
            }
          : current,
      );
    });

    act(() => {
      latestController?.handleSaveMedicine();
      latestController?.handleOpenMedicineEditor();
    });

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              name: "Магний",
              dose: "2 таблетки",
              times: ["20:00"],
            }
          : current,
      );
    });

    act(() => {
      latestController?.handleSaveMedicine();
    });

    expect(latestController?.draft.medicines).toHaveLength(2);

    const medicineIdToRemove = latestController?.draft.medicines[0]?.id;

    act(() => {
      if (medicineIdToRemove) {
        latestController?.handleRemoveMedicine(medicineIdToRemove);
      }
    });

    expect(latestController?.draft.medicines).toHaveLength(1);
    expect(latestController?.draft.medicines[0]?.name).toBe("Магний");
    expect(latestController?.canGoNextFromList).toBe(true);
  });

  it("normalizes empty notification recipients to the current account on save", async () => {
    const onClose = jest.fn();
    const onPlanSaved = jest.fn();

    await act(async () => {
      TestRenderer.create(
        React.createElement(Probe, {
          familyMembers: [
            makeFamilyMember("acc-1", "Мила"),
            makeFamilyMember("acc-2", "Артём"),
          ],
          onClose,
          onPlanSaved,
        }),
      );
    });

    act(() => {
      latestController?.handleSelectParticipant("acc-2");
      latestController?.setStep("list");
      latestController?.handleOpenMedicineEditor();
    });

    act(() => {
      latestController?.setMedicineDraft((current) =>
        current
          ? {
              ...current,
              name: "Витамин D",
              dose: "1 капсула",
              times: ["08:30"],
            }
          : current,
      );
    });

    act(() => {
      latestController?.handleSaveMedicine();
      latestController?.setDraftRecipientIds([]);
      latestController?.handleSaveRecipients();
      latestController?.setStep("review");
    });

    await act(async () => {
      latestController?.handleCompletePlan();
      await Promise.resolve();
    });

    expect(mockedCreatePlan).toHaveBeenCalledWith({
      accessToken: "token",
      plan: expect.objectContaining({
        memberAccountIds: ["acc-1"],
      }),
    });
    expect(onPlanSaved).toHaveBeenCalledWith({
      plan: makeCreatedPlan(),
      participantId: "acc-2",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
