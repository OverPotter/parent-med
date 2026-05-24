import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { MobileAuthSession } from "../../features/auth/api/authApi";
import { useShellAuthSessionController } from "../useShellAuthSessionController";

jest.mock("../../features/auth/api/authApi", () => ({
  logoutMobileSession: jest.fn(),
  refreshMobileSession: jest.fn(),
  toBackendPreferredLanguage: jest.fn((locale: string) => locale),
  updateMyFamilyMemberProfile: jest.fn(),
  updateMyFamilyName: jest.fn(),
}));

jest.mock("../../features/auth/session/mobileAuthSessionStorage", () => ({
  clearStoredAuthSession: jest.fn(),
  readStoredAuthSession: jest.fn(),
  writeStoredAuthSession: jest.fn(),
}));

jest.mock("../../features/settings/api/settingsApi", () => ({
  applyPreferredLanguageToSession: jest.fn(
    (session: MobileAuthSession, preferredLanguage: string) => ({
      ...session,
      account: {
        ...session.account,
        preferredLanguage,
      },
    }),
  ),
  updatePreferredLanguage: jest.fn(),
}));

jest.mock("../../shared/push/nativePushSync", () => ({
  deleteStoredNativePushSubscription: jest.fn(),
}));

jest.mock("../../shared/billing/revenueCatSessionSync", () => ({
  syncRevenueCatSessionState: jest.fn(),
}));

const {
  clearStoredAuthSession,
  readStoredAuthSession,
} = jest.requireMock(
  "../../features/auth/session/mobileAuthSessionStorage",
) as {
  clearStoredAuthSession: jest.Mock;
  readStoredAuthSession: jest.Mock;
};

function buildSession(): MobileAuthSession {
  return {
    tokenType: "bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    account: {
      id: "account-1",
      email: "owner@example.com",
      familyId: "family-1",
      displayName: "Anna",
      needsProfileCompletion: false,
      relationshipLabel: null,
      phone: null,
      preferredLanguage: "ru",
      familyRole: "admin",
      hasRecoveryCode: true,
    },
    family: {
      id: "family-1",
      name: "Care Family",
      ownerAccountId: "account-1",
    },
  };
}

describe("useShellAuthSessionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readStoredAuthSession.mockResolvedValue(null);
    clearStoredAuthSession.mockResolvedValue(undefined);
  });

  it("signs out locally after account deletion even when secure storage cleanup fails", async () => {
    clearStoredAuthSession.mockRejectedValueOnce(new Error("secure store failed"));
    const setAuthSession = jest.fn();

    const { result } = renderHook(() =>
      useShellAuthSessionController({
        authSession: buildSession(),
        setAuthSession,
        setIsAuthBootstrapping: jest.fn(),
        setLocale: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSessionDeleted();
    });

    await waitFor(() => {
      expect(setAuthSession).toHaveBeenCalledWith(null);
    });
    expect(clearStoredAuthSession).toHaveBeenCalled();
  });
});
