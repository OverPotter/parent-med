import type { MobileAuthSession } from "../features/auth/api/authApi";

export type PostAuthOnboardingStep = "display-name" | "recovery-code" | null;

export function resolvePostAuthOnboardingStep(args: {
  session: MobileAuthSession | null;
  skippedDisplayName: boolean;
  skippedRecoveryCode: boolean;
}): PostAuthOnboardingStep {
  const session = args.session;

  if (!session?.account.id) {
    return null;
  }

  if (
    session.account.needsProfileCompletion &&
    !args.skippedDisplayName
  ) {
    return "display-name";
  }

  if (!session.account.hasRecoveryCode && !args.skippedRecoveryCode) {
    return "recovery-code";
  }

  return null;
}
