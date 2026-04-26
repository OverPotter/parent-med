const REVENUECAT_SYNC_SUPPRESSION_KEY = "revenuecat.syncSuppressedAccounts";

function getSyncSuppressionStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function readSuppressedAccountIds(): string[] {
  const storage = getSyncSuppressionStorage();
  if (!storage) {
    return [];
  }
  const raw = storage.getItem(REVENUECAT_SYNC_SUPPRESSION_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSuppressedAccountIds(accountIds: string[]) {
  const storage = getSyncSuppressionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(REVENUECAT_SYNC_SUPPRESSION_KEY, JSON.stringify(accountIds));
}

export function isRevenueCatSyncSuppressedForAccount(accountId: string | null | undefined): boolean {
  if (!accountId) {
    return false;
  }
  return readSuppressedAccountIds().includes(accountId);
}

export function suppressRevenueCatSyncForAccount(accountId: string | null | undefined) {
  if (!accountId) {
    return;
  }
  const current = readSuppressedAccountIds();
  if (current.includes(accountId)) {
    return;
  }
  writeSuppressedAccountIds([...current, accountId]);
}

export function clearRevenueCatSyncSuppressionForAccount(accountId: string | null | undefined) {
  if (!accountId) {
    return;
  }
  const current = readSuppressedAccountIds();
  if (!current.includes(accountId)) {
    return;
  }
  writeSuppressedAccountIds(current.filter((value) => value !== accountId));
}
