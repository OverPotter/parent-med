import type { FamilyAccessPolicy } from "@shared/types/api";
import {
  canReceiveIllnessSignalsForChild,
  hasChildActionAccess,
  canEditChildScopedData,
  getCabinetAccessLevel,
  getPillboxAccessLevel,
  hasAnyChildAccess,
  hasChildAccess,
  hasChildEditAccess,
} from "@shared/familyAccess/policy";

export function isFamilyAdmin(familyRole: string | null | undefined) {
  return familyRole === "admin";
}

export function canViewAnyChildren(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return hasAnyChildAccess(policy);
}

export function canViewChild(
  childId: string,
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return hasChildAccess(policy, childId);
}

export function canEditChild(
  childId: string,
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return hasChildEditAccess(policy, childId);
}

export function canActChild(
  childId: string,
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return hasChildActionAccess(policy, childId);
}

export function canManageChildrenList(
  familyRole: string | null | undefined,
  _policy: FamilyAccessPolicy | null | undefined
) {
  return isFamilyAdmin(familyRole);
}

export function canViewCabinet(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return getCabinetAccessLevel(policy) !== "none";
}

export function canEditCabinet(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return getCabinetAccessLevel(policy) === "edit";
}

export function canViewPillbox(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return getPillboxAccessLevel(policy) !== "none";
}

export function canEditPillbox(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return getPillboxAccessLevel(policy) === "edit" && canEditChildScopedData(policy);
}

export function canActPillbox(
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  const access = getPillboxAccessLevel(policy);
  return access === "act" || access === "edit";
}

export function canReceiveIllnessPushForChild(
  childId: string,
  _familyRole: string | null | undefined,
  policy: FamilyAccessPolicy | null | undefined
) {
  return canReceiveIllnessSignalsForChild(policy, childId);
}
