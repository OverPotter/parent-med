import { getEligibleRecipientSelection } from "@shared/utils/recipientSelection";

export function resolveIllnessRecipientSelection(
  selectedIds: string[] | null | undefined,
  eligibleAccountIds: string[],
  currentAccountId: string | null | undefined
): string[] {
  const normalizedSelectedIds = getEligibleRecipientSelection(selectedIds, eligibleAccountIds);
  if (normalizedSelectedIds.length > 0) {
    return normalizedSelectedIds;
  }
  if (currentAccountId && eligibleAccountIds.includes(currentAccountId)) {
    return [currentAccountId];
  }
  const firstEligibleAccountId = eligibleAccountIds[0];
  return firstEligibleAccountId ? [firstEligibleAccountId] : [];
}
