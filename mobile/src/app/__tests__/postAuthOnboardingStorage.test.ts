import {
  clearPostAuthOnboardingSkips,
  markDisplayNameOnboardingSkipped,
  markRecoveryCodeOnboardingSkipped,
  readPostAuthOnboardingSkips,
} from "../postAuthOnboardingStorage";

const mockSecureStoreState = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreState.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreState.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreState.delete(key);
  }),
}));

describe("postAuthOnboardingStorage", () => {
  beforeEach(() => {
    mockSecureStoreState.clear();
  });

  it("persists skipped display-name and recovery-code flags for the same account", async () => {
    await markDisplayNameOnboardingSkipped("account-1");
    await markRecoveryCodeOnboardingSkipped("account-1");

    await expect(readPostAuthOnboardingSkips("account-1")).resolves.toEqual({
      skippedDisplayName: true,
      skippedRecoveryCode: true,
    });
  });

  it("clears persisted flags when requested", async () => {
    await markDisplayNameOnboardingSkipped("account-1");
    await markRecoveryCodeOnboardingSkipped("account-1");

    await clearPostAuthOnboardingSkips("account-1");

    await expect(readPostAuthOnboardingSkips("account-1")).resolves.toEqual({
      skippedDisplayName: false,
      skippedRecoveryCode: false,
    });
  });
});
