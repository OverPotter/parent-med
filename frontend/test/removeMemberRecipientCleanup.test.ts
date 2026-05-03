import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import type { EpisodeMedicationPlan, Family, FamilyMember, IllnessEpisode } from "../src/shared/types/api.js";
import type {
  PillboxPlan,
  PillboxPlanSummary,
} from "../src/shared/api/pillboxPlans.contract.js";
import {
  applyRemovedMemberRecipientCleanup,
  rollbackRemovedMemberRecipientCleanup,
} from "../src/client/pages/family/removeMemberRecipientCleanup.js";

test("applyRemovedMemberRecipientCleanup removes deleted member from recipient caches and rolls back", () => {
  const queryClient = new QueryClient();
  const currentFamilyId = "family-1";
  const removedMemberId = "member-removed";
  const remainingMemberId = "member-keep";

  const familyMembers: FamilyMember[] = [
    {
      id: removedMemberId,
      email: "removed@example.com",
      familyId: currentFamilyId,
      displayName: "Removed",
      needsProfileCompletion: false,
      hasRecoveryCode: false,
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
    },
    {
      id: remainingMemberId,
      email: "keep@example.com",
      familyId: currentFamilyId,
      displayName: "Keep",
      needsProfileCompletion: false,
      hasRecoveryCode: false,
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
    },
  ];
  const family: Family = {
    id: currentFamilyId,
    name: "Family",
    cabinetMemberAccountIds: [removedMemberId, remainingMemberId],
    ownerAccountId: "owner-1",
    billingAccountId: null,
    freePrimaryChildId: null,
    freePrimaryPillboxPlanId: null,
    planCode: "free",
    subscriptionStatus: "inactive",
    subscriptionProvider: null,
    subscriptionProductId: null,
    subscriptionExpiresAt: null,
    premiumActive: false,
  };
  const pillboxSummaries: PillboxPlanSummary[] = [
    {
      id: "plan-1",
      title: "Plan",
      status: "active",
      memberAccountIds: [removedMemberId, remainingMemberId],
      activeMedicationCount: 1,
      nextDoseAt: null,
      nextDoseLabel: null,
      nextMedicationId: null,
      nextMedicationTitle: null,
      courseSummaryKind: null,
      courseProgressRatio: null,
      courseDayLabel: null,
    },
  ];
  const pillboxPlan: PillboxPlan = {
    id: "plan-1",
    familyId: currentFamilyId,
    title: "Plan",
    status: "active",
    memberAccountIds: [removedMemberId, remainingMemberId],
    medications: [],
    createdAt: "2026-05-03T10:00:00Z",
    updatedAt: "2026-05-03T10:00:00Z",
  };
  const illnessEpisode: IllnessEpisode = {
    id: "episode-1",
    childId: "child-1",
    startedAt: "2026-05-03",
    title: "Illness",
    status: "active",
    medicationMode: "guided",
    note: null,
    notificationRecipientAccountIds: [removedMemberId, remainingMemberId],
    createdByAccountId: null,
    closedAt: null,
  };
  const episodePlan: EpisodeMedicationPlan = {
    id: "episode-plan-1",
    episodeId: "episode-1",
    householdMedicineId: null,
    customMedicineName: "Smecta",
    doseAmount: "1",
    minIntervalMinutes: 60,
    maxDosesPerDay: null,
    weightKg: null,
    doseMgPerKg: null,
    calculatedDoseMg: null,
    calculatedDoseValue: null,
    calculatedDoseUnit: null,
    doseCalcMode: null,
    doseCalcWarning: null,
    manualDoseOverride: false,
    notes: null,
    memberAccountIds: [removedMemberId, remainingMemberId],
    createdAt: "2026-05-03T10:00:00Z",
  };

  queryClient.setQueryData(["family-members", currentFamilyId], familyMembers);
  queryClient.setQueryData(["families", "me", "members", currentFamilyId], familyMembers);
  queryClient.setQueryData(["families", "me", currentFamilyId], family);
  queryClient.setQueryData(["pillbox-plans", currentFamilyId, "ru"], pillboxSummaries);
  queryClient.setQueryData(["pillbox-plan", pillboxPlan.id], pillboxPlan);
  queryClient.setQueryData(["illness-episodes", "child-1"], [illnessEpisode]);
  queryClient.setQueryData(["illness-episode-active", "child-1"], illnessEpisode);
  queryClient.setQueryData(["episode-medication-plans", illnessEpisode.id], [episodePlan]);

  const snapshots = applyRemovedMemberRecipientCleanup(
    queryClient,
    removedMemberId,
    currentFamilyId
  );

  assert.equal(
    queryClient.getQueryData<FamilyMember[]>(["family-members", currentFamilyId])?.length,
    1
  );
  assert.deepEqual(
    queryClient.getQueryData<Family>(["families", "me", currentFamilyId])?.cabinetMemberAccountIds,
    [remainingMemberId]
  );
  assert.deepEqual(
    queryClient.getQueryData<PillboxPlanSummary[]>(["pillbox-plans", currentFamilyId, "ru"])?.[0]
      ?.memberAccountIds,
    [remainingMemberId]
  );
  assert.deepEqual(
    queryClient.getQueryData<PillboxPlan>(["pillbox-plan", pillboxPlan.id])?.memberAccountIds,
    [remainingMemberId]
  );
  assert.deepEqual(
    queryClient.getQueryData<IllnessEpisode[]>(["illness-episodes", "child-1"])?.[0]
      ?.notificationRecipientAccountIds,
    [remainingMemberId]
  );
  assert.deepEqual(
    queryClient.getQueryData<IllnessEpisode>(["illness-episode-active", "child-1"])
      ?.notificationRecipientAccountIds,
    [remainingMemberId]
  );
  assert.deepEqual(
    queryClient.getQueryData<EpisodeMedicationPlan[]>([
      "episode-medication-plans",
      illnessEpisode.id,
    ])?.[0]?.memberAccountIds,
    [remainingMemberId]
  );

  rollbackRemovedMemberRecipientCleanup(queryClient, snapshots);

  assert.equal(
    queryClient.getQueryData<FamilyMember[]>(["family-members", currentFamilyId])?.length,
    2
  );
  assert.deepEqual(
    queryClient.getQueryData<Family>(["families", "me", currentFamilyId])?.cabinetMemberAccountIds,
    [removedMemberId, remainingMemberId]
  );
});
