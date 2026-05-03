import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { EpisodeMedicationPlan, Family, FamilyMember, IllnessEpisode } from "@shared/types/api";
import type {
  PillboxPlan,
  PillboxPlanSummary,
} from "@shared/api/pillboxPlans.contract";

type QuerySnapshot = {
  queryKey: QueryKey;
  data: unknown;
};

export function getRemovedMemberRecipientCleanupQueryKeys(
  currentFamilyId: string | null
): QueryKey[] {
  return [
    ["family-members", currentFamilyId],
    ["families", "me", "members", currentFamilyId],
    ["families", "me", currentFamilyId],
    ["pillbox-plans"],
    ["pillbox-plan"],
    ["illness-episodes"],
    ["illness-episode-active"],
    ["episode-medication-plans"],
  ];
}

function removeMemberId(ids: string[] | null | undefined, memberAccountId: string): string[] {
  return (ids ?? []).filter((id) => id !== memberAccountId);
}

function cleanupFamilyMemberList(
  current: FamilyMember[] | undefined,
  memberAccountId: string
): FamilyMember[] | undefined {
  if (!current) {
    return current;
  }
  return current.filter((member) => member.id !== memberAccountId);
}

function cleanupFamilyRecipients(
  current: Family | undefined,
  memberAccountId: string
): Family | undefined {
  if (!current) {
    return current;
  }
  return {
    ...current,
    cabinetMemberAccountIds: removeMemberId(current.cabinetMemberAccountIds, memberAccountId),
  };
}

function cleanupIllnessEpisodeRecipients(
  current: IllnessEpisode,
  memberAccountId: string
): IllnessEpisode {
  return {
    ...current,
    notificationRecipientAccountIds: removeMemberId(
      current.notificationRecipientAccountIds,
      memberAccountId
    ),
  };
}

function cleanupIllnessEpisodeData(
  current: IllnessEpisode[] | IllnessEpisode | null | undefined,
  memberAccountId: string
) {
  if (!current) {
    return current;
  }
  if (Array.isArray(current)) {
    return current.map((episode) => cleanupIllnessEpisodeRecipients(episode, memberAccountId));
  }
  return cleanupIllnessEpisodeRecipients(current, memberAccountId);
}

function cleanupActiveIllnessEpisode(
  current: IllnessEpisode | null | undefined,
  memberAccountId: string
): IllnessEpisode | null | undefined {
  if (!current) {
    return current;
  }
  return cleanupIllnessEpisodeRecipients(current, memberAccountId);
}

function cleanupEpisodeMedicationPlans(
  current: EpisodeMedicationPlan[] | undefined,
  memberAccountId: string
): EpisodeMedicationPlan[] | undefined {
  if (!current) {
    return current;
  }
  return current.map((plan) => ({
    ...plan,
    memberAccountIds: removeMemberId(plan.memberAccountIds, memberAccountId),
  }));
}

function cleanupPillboxPlanSummaries(
  current: PillboxPlanSummary[] | undefined,
  memberAccountId: string
): PillboxPlanSummary[] | undefined {
  if (!current) {
    return current;
  }
  return current.map((plan) => ({
    ...plan,
    memberAccountIds: removeMemberId(plan.memberAccountIds, memberAccountId),
  }));
}

function cleanupPillboxPlan(
  current: PillboxPlan | undefined,
  memberAccountId: string
): PillboxPlan | undefined {
  if (!current) {
    return current;
  }
  return {
    ...current,
    memberAccountIds: removeMemberId(current.memberAccountIds, memberAccountId),
  };
}

function snapshotQueries(queryClient: QueryClient, queryKey: QueryKey): QuerySnapshot[] {
  return queryClient.getQueriesData({ queryKey }).map(([matchedKey, data]) => ({
    queryKey: matchedKey,
    data,
  }));
}

function restoreSnapshots(queryClient: QueryClient, snapshots: QuerySnapshot[]) {
  for (const snapshot of snapshots) {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data);
  }
}

export function applyRemovedMemberRecipientCleanup(
  queryClient: QueryClient,
  memberAccountId: string,
  currentFamilyId: string | null
): QuerySnapshot[] {
  const snapshots = getRemovedMemberRecipientCleanupQueryKeys(currentFamilyId).flatMap((queryKey) =>
    snapshotQueries(queryClient, queryKey)
  );

  queryClient.setQueriesData<FamilyMember[]>({ queryKey: ["family-members", currentFamilyId] }, (current) =>
    cleanupFamilyMemberList(current, memberAccountId)
  );
  queryClient.setQueriesData<FamilyMember[]>(
    { queryKey: ["families", "me", "members", currentFamilyId] },
    (current) => cleanupFamilyMemberList(current, memberAccountId)
  );
  queryClient.setQueriesData<Family | undefined>(
    { queryKey: ["families", "me", currentFamilyId] },
    (current) => cleanupFamilyRecipients(current, memberAccountId)
  );
  queryClient.setQueriesData<PillboxPlanSummary[] | undefined>(
    { queryKey: ["pillbox-plans"] },
    (current) => cleanupPillboxPlanSummaries(current, memberAccountId)
  );
  queryClient.setQueriesData<PillboxPlan | undefined>({ queryKey: ["pillbox-plan"] }, (current) =>
    cleanupPillboxPlan(current, memberAccountId)
  );
  queryClient.setQueriesData<IllnessEpisode[] | IllnessEpisode | null | undefined>(
    { queryKey: ["illness-episodes"] },
    (current) => cleanupIllnessEpisodeData(current, memberAccountId)
  );
  queryClient.setQueriesData<IllnessEpisode | null | undefined>(
    { queryKey: ["illness-episode-active"] },
    (current) => cleanupActiveIllnessEpisode(current, memberAccountId)
  );
  queryClient.setQueriesData<EpisodeMedicationPlan[] | undefined>(
    { queryKey: ["episode-medication-plans"] },
    (current) => cleanupEpisodeMedicationPlans(current, memberAccountId)
  );

  return snapshots;
}

export function rollbackRemovedMemberRecipientCleanup(
  queryClient: QueryClient,
  snapshots: QuerySnapshot[]
) {
  restoreSnapshots(queryClient, snapshots);
}
