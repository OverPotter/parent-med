import type { FamilyAccessPolicy } from "@shared/types/api";

export const DEFAULT_FAMILY_ACCESS_POLICY: FamilyAccessPolicy = {
  allChildren: false,
  childIds: [],
  childrenAccess: "view",
  cabinetAccess: "none",
  pillboxAccess: "none",
  cabinetPushEnabled: false,
};

export const LEGACY_FULL_FAMILY_ACCESS_POLICY: FamilyAccessPolicy = {
  allChildren: true,
  childIds: [],
  childrenAccess: "edit",
  cabinetAccess: "edit",
  pillboxAccess: "edit",
  cabinetPushEnabled: true,
};

export function normalizeFamilyAccessPolicy(
  policy: FamilyAccessPolicy | null | undefined
): FamilyAccessPolicy {
  if (!policy) {
    return DEFAULT_FAMILY_ACCESS_POLICY;
  }

  return {
    ...policy,
    allChildren: Boolean(policy.allChildren),
    childIds: policy.allChildren ? [] : policy.childIds,
  };
}

export function hasChildAccess(
  policy: FamilyAccessPolicy | null | undefined,
  childId: string
) {
  const normalized = normalizeFamilyAccessPolicy(policy);
  return normalized.allChildren || normalized.childIds.includes(childId);
}

export function canReceiveIllnessSignalsForChild(
  policy: FamilyAccessPolicy | null | undefined,
  childId: string
) {
  return hasChildAccess(policy, childId);
}

export function hasAnyChildAccess(policy: FamilyAccessPolicy | null | undefined) {
  const normalized = normalizeFamilyAccessPolicy(policy);
  return normalized.allChildren || normalized.childIds.length > 0;
}

export function hasChildEditAccess(
  policy: FamilyAccessPolicy | null | undefined,
  childId: string
) {
  const normalized = normalizeFamilyAccessPolicy(policy);
  return normalized.childrenAccess === "edit" && hasChildAccess(normalized, childId);
}

export function hasChildActionAccess(
  policy: FamilyAccessPolicy | null | undefined,
  childId: string
) {
  const normalized = normalizeFamilyAccessPolicy(policy);
  return (
    (normalized.childrenAccess === "act" || normalized.childrenAccess === "edit") &&
    hasChildAccess(normalized, childId)
  );
}

export function getCabinetAccessLevel(policy: FamilyAccessPolicy | null | undefined) {
  return normalizeFamilyAccessPolicy(policy).cabinetAccess;
}

export function getPillboxAccessLevel(policy: FamilyAccessPolicy | null | undefined) {
  return normalizeFamilyAccessPolicy(policy).pillboxAccess;
}

export function canEditChildScopedData(policy: FamilyAccessPolicy | null | undefined) {
  return normalizeFamilyAccessPolicy(policy).childrenAccess === "edit";
}

export function canActOnChildScopedData(policy: FamilyAccessPolicy | null | undefined) {
  const access = normalizeFamilyAccessPolicy(policy).childrenAccess;
  return access === "act" || access === "edit";
}
