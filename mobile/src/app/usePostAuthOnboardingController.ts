import { useCallback, useEffect, useMemo, useState } from "react";
import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { PostAuthOnboardingStep } from "./postAuthOnboardingModel";
import { resolvePostAuthOnboardingStep } from "./postAuthOnboardingModel";
import {
  markDisplayNameOnboardingSkipped,
  markRecoveryCodeOnboardingSkipped,
  readPostAuthOnboardingSkips,
} from "./postAuthOnboardingStorage";

export function usePostAuthOnboardingController(args: {
  authSession: MobileAuthSession | null;
  handleUpdateAuthSession: (patch: {
    displayName?: string;
    relationshipLabel?: string | null;
    phone?: string | null;
  }) => Promise<void>;
  handleMarkRecoveryCodeConfigured: () => Promise<void>;
}) {
  const [skippedDisplayNameOnboarding, setSkippedDisplayNameOnboarding] =
    useState(false);
  const [skippedRecoveryCodeOnboarding, setSkippedRecoveryCodeOnboarding] =
    useState(false);
  const [forcedPostAuthOnboardingStep, setForcedPostAuthOnboardingStep] =
    useState<PostAuthOnboardingStep>(null);

  useEffect(() => {
    if (!args.authSession?.account.id) {
      setSkippedDisplayNameOnboarding(false);
      setSkippedRecoveryCodeOnboarding(false);
      setForcedPostAuthOnboardingStep(null);
      return;
    }

    let cancelled = false;

    void readPostAuthOnboardingSkips(args.authSession.account.id).then((result) => {
      if (cancelled) {
        return;
      }

      setSkippedDisplayNameOnboarding(result.skippedDisplayName);
      setSkippedRecoveryCodeOnboarding(result.skippedRecoveryCode);
    });

    return () => {
      cancelled = true;
    };
  }, [args.authSession?.account.id]);

  const resolvedPostAuthOnboardingStep = useMemo(
    () =>
      resolvePostAuthOnboardingStep({
        session: args.authSession,
        skippedDisplayName: skippedDisplayNameOnboarding,
        skippedRecoveryCode: skippedRecoveryCodeOnboarding,
      }),
    [
      args.authSession,
      skippedDisplayNameOnboarding,
      skippedRecoveryCodeOnboarding,
    ],
  );

  const postAuthOnboardingStep =
    forcedPostAuthOnboardingStep ?? resolvedPostAuthOnboardingStep;

  const handleSkipDisplayNameOnboarding = useCallback(async () => {
    if (!args.authSession?.account.id) {
      return;
    }

    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep("recovery-code");
      return;
    }

    await markDisplayNameOnboardingSkipped(args.authSession.account.id);
    setSkippedDisplayNameOnboarding(true);
  }, [args.authSession?.account.id, forcedPostAuthOnboardingStep]);

  const handleSkipRecoveryCodeOnboarding = useCallback(async () => {
    if (!args.authSession?.account.id) {
      return;
    }

    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep(null);
      return;
    }

    await markRecoveryCodeOnboardingSkipped(args.authSession.account.id);
    setSkippedRecoveryCodeOnboarding(true);
  }, [args.authSession?.account.id, forcedPostAuthOnboardingStep]);

  const handleSavePostAuthDisplayName = useCallback(
    async (patch: {
      displayName: string;
      relationshipLabel: string | null;
      phone: string | null;
    }) => {
      await args.handleUpdateAuthSession(patch);
      if (forcedPostAuthOnboardingStep) {
        setForcedPostAuthOnboardingStep("recovery-code");
      }
    },
    [args, forcedPostAuthOnboardingStep],
  );

  const handleSavePostAuthRecoveryCode = useCallback(async () => {
    await args.handleMarkRecoveryCodeConfigured();
    if (forcedPostAuthOnboardingStep) {
      setForcedPostAuthOnboardingStep(null);
    }
  }, [args, forcedPostAuthOnboardingStep]);

  return {
    postAuthOnboardingStep,
    handleSkipDisplayNameOnboarding,
    handleSkipRecoveryCodeOnboarding,
    handleSavePostAuthDisplayName,
    handleSavePostAuthRecoveryCode,
  };
}
