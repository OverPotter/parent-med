import type { MobileFamilyMember } from "../../family/api/familyMembersApi";

export function canReceiveIllnessSignalsForChild(
  member: Pick<MobileFamilyMember, "accessPolicy">,
  childId: string,
) {
  const hasChildAccess =
    member.accessPolicy.allChildren ||
    member.accessPolicy.childIds.includes(childId);
  const canActOnChild =
    member.accessPolicy.childrenAccess === "act" ||
    member.accessPolicy.childrenAccess === "edit";

  return (
    hasChildAccess &&
    canActOnChild &&
    member.accessPolicy.cabinetPushEnabled
  );
}

export function getEligibleIllnessRecipients(
  members: MobileFamilyMember[],
  childId: string,
) {
  return members.filter((member) => canReceiveIllnessSignalsForChild(member, childId));
}

export function resolveIllnessRecipientSelection(
  selectedIds: string[] | null | undefined,
  eligibleAccountIds: string[],
  currentAccountId: string | null | undefined,
) {
  const normalizedSelectedIds = (selectedIds ?? []).filter((id) =>
    eligibleAccountIds.includes(id),
  );

  if (normalizedSelectedIds.length > 0) {
    return normalizedSelectedIds;
  }

  if (currentAccountId && eligibleAccountIds.includes(currentAccountId)) {
    return [currentAccountId];
  }

  const firstEligibleAccountId = eligibleAccountIds[0];
  return firstEligibleAccountId ? [firstEligibleAccountId] : [];
}
