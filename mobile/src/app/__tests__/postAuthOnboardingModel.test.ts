import type { MobileAuthSession } from "../../features/auth/api/authApi";
import { resolvePostAuthOnboardingStep } from "../postAuthOnboardingModel";

const baseSession: MobileAuthSession = {
  tokenType: "bearer",
  accessToken: "access",
  refreshToken: "refresh",
  account: {
    id: "account-1",
    email: "user@example.com",
    familyId: "family-1",
    displayName: "",
    needsProfileCompletion: true,
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "ru",
    familyRole: "owner",
    hasRecoveryCode: false,
  },
  family: {
    id: "family-1",
    name: "Care Family",
    ownerAccountId: "account-1",
  },
};

describe("resolvePostAuthOnboardingStep", () => {
  it("starts with display name when profile completion is required", () => {
    expect(
      resolvePostAuthOnboardingStep({
        session: baseSession,
        skippedDisplayName: false,
        skippedRecoveryCode: false,
      }),
    ).toBe("display-name");
  });

  it("moves to recovery code when profile is complete", () => {
    expect(
      resolvePostAuthOnboardingStep({
        session: {
          ...baseSession,
          account: {
            ...baseSession.account,
            displayName: "Anna",
            needsProfileCompletion: false,
          },
        },
        skippedDisplayName: false,
        skippedRecoveryCode: false,
      }),
    ).toBe("recovery-code");
  });

  it("respects skipped flags", () => {
    expect(
      resolvePostAuthOnboardingStep({
        session: baseSession,
        skippedDisplayName: true,
        skippedRecoveryCode: true,
      }),
    ).toBeNull();
  });
});
