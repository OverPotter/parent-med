import type { FamilySubscriptionAccess } from "@shared/types/api";

export function hasReachedChildLimit(access: FamilySubscriptionAccess | null | undefined): boolean {
  if (!access) {
    return false;
  }
  if (access.maxChildren === null || access.maxChildren === undefined) {
    return false;
  }
  return access.currentChildrenCount >= access.maxChildren;
}

export function isDowngradedChildrenState(
  access: FamilySubscriptionAccess | null | undefined
): boolean {
  if (!access) {
    return false;
  }
  if (access.hasPlusAccess) {
    return false;
  }
  if (access.maxChildren === null || access.maxChildren === undefined) {
    return false;
  }
  return access.currentChildrenCount > access.maxChildren;
}

export function isChildLockedByPlan(
  childId: string,
  access: FamilySubscriptionAccess | null | undefined
): boolean {
  if (!isDowngradedChildrenState(access)) {
    return false;
  }
  const primaryChildId = access?.freePrimaryChildId;
  if (!primaryChildId) {
    return false;
  }
  return childId !== primaryChildId;
}

export function isChildIllnessMutationLockedByPlan(
  childId: string,
  access: FamilySubscriptionAccess | null | undefined,
  hasActiveEpisode: boolean
): boolean {
  if (hasActiveEpisode) {
    return false;
  }
  return isChildLockedByPlan(childId, access);
}
