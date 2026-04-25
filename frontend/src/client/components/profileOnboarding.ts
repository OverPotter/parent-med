export function shouldShowDisplayNameOnboarding(args: {
  accountId: string | null;
  needsProfileCompletion: boolean;
  didSkipDisplayName: boolean;
}): boolean {
  return Boolean(args.accountId && args.needsProfileCompletion && !args.didSkipDisplayName);
}

export function shouldShowRecoveryCodeOnboarding(args: {
  accountId: string | null;
  hasRecoveryCode: boolean;
  didSkipRecoveryCode: boolean;
}): boolean {
  return Boolean(args.accountId && !args.hasRecoveryCode && !args.didSkipRecoveryCode);
}
