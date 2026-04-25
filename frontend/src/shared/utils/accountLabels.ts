type AccountLike = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  relationshipLabel?: string | null;
};

export function getAccountDisplayLabel(account: AccountLike): string {
  return account.displayName || account.email || account.id;
}

export function getAccountSecondaryLabel(account: AccountLike): string {
  return account.relationshipLabel || account.email || account.id;
}
