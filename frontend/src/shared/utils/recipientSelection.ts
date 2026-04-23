export function resolveRecipientSelection(
  selectedIds: string[] | null | undefined,
  currentAccountId: string | null | undefined,
  eligibleAccountIds: string[]
): string[] {
  const normalizedSelectedIds = (selectedIds ?? []).filter((id) => eligibleAccountIds.includes(id));
  if (normalizedSelectedIds.length > 0) {
    return normalizedSelectedIds;
  }
  if (currentAccountId && eligibleAccountIds.includes(currentAccountId)) {
    return [currentAccountId];
  }
  return [];
}

export function shouldAutoAssignCurrentRecipient(
  selectedIds: string[] | null | undefined,
  currentAccountId: string | null | undefined,
  eligibleAccountIds: string[]
): boolean {
  return (
    (selectedIds ?? []).length === 0 &&
    !!currentAccountId &&
    eligibleAccountIds.includes(currentAccountId)
  );
}
