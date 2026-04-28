type FamilyRole = string | null | undefined;

type ViewerParams = {
  familyOwnerAccountId?: string | null;
  currentAccountId?: string | null;
  currentAccountRole?: FamilyRole;
};

type TargetParams = ViewerParams & {
  targetAccountId?: string | null;
  targetFamilyRole?: FamilyRole;
  adminsCount?: number;
};

export function isFamilyOwnerAccount({
  familyOwnerAccountId,
  currentAccountId,
}: Pick<ViewerParams, "familyOwnerAccountId" | "currentAccountId">) {
  return Boolean(
    familyOwnerAccountId && currentAccountId && familyOwnerAccountId === currentAccountId
  );
}

export function isFamilyAdminAccount(params: ViewerParams) {
  return !isFamilyOwnerAccount(params) && params.currentAccountRole === "admin";
}

export function canManageFamilyMembers(params: ViewerParams) {
  return isFamilyOwnerAccount(params) || isFamilyAdminAccount(params);
}

export function canLeaveCurrentFamily({
  familyOwnerAccountId,
  currentAccountId,
  hasCurrentMember,
}: {
  familyOwnerAccountId?: string | null;
  currentAccountId?: string | null;
  hasCurrentMember: boolean;
}) {
  return hasCurrentMember && !isFamilyOwnerAccount({ familyOwnerAccountId, currentAccountId });
}

export function canManageFamilyMemberAccess({
  familyOwnerAccountId,
  currentAccountId,
  currentAccountRole,
  targetAccountId,
  targetFamilyRole,
}: TargetParams) {
  const isOwner = isFamilyOwnerAccount({ familyOwnerAccountId, currentAccountId });
  const isAdmin = isFamilyAdminAccount({
    familyOwnerAccountId,
    currentAccountId,
    currentAccountRole,
  });
  const isCurrent = currentAccountId === targetAccountId;

  if (!targetAccountId || isCurrent) {
    return false;
  }
  if (isOwner) {
    return true;
  }
  return isAdmin && targetFamilyRole === "member";
}

export function canPromoteFamilyMember({
  familyOwnerAccountId,
  currentAccountId,
  targetAccountId,
  targetFamilyRole,
}: TargetParams) {
  const isOwner = isFamilyOwnerAccount({ familyOwnerAccountId, currentAccountId });
  const isCurrent = currentAccountId === targetAccountId;
  const isTargetOwner = familyOwnerAccountId === targetAccountId;

  return Boolean(isOwner && !isCurrent && !isTargetOwner && targetFamilyRole !== "admin");
}

export function canDemoteFamilyMember({
  familyOwnerAccountId,
  currentAccountId,
  targetAccountId,
  targetFamilyRole,
  adminsCount = 0,
}: TargetParams) {
  const isOwner = isFamilyOwnerAccount({ familyOwnerAccountId, currentAccountId });
  const isCurrent = currentAccountId === targetAccountId;
  const isTargetOwner = familyOwnerAccountId === targetAccountId;

  return Boolean(
    isOwner && !isCurrent && !isTargetOwner && targetFamilyRole === "admin" && adminsCount > 1
  );
}

export function canDeleteFamilyMember({
  familyOwnerAccountId,
  currentAccountId,
  currentAccountRole,
  targetAccountId,
  targetFamilyRole,
}: TargetParams) {
  const isOwner = isFamilyOwnerAccount({ familyOwnerAccountId, currentAccountId });
  const isAdmin = isFamilyAdminAccount({
    familyOwnerAccountId,
    currentAccountId,
    currentAccountRole,
  });
  const isCurrent = currentAccountId === targetAccountId;
  const isTargetOwner = familyOwnerAccountId === targetAccountId;

  if (!targetAccountId || isCurrent || isTargetOwner) {
    return false;
  }
  if (isOwner) {
    return true;
  }
  return isAdmin && targetFamilyRole === "member";
}
