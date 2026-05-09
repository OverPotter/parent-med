import type { MobileAuthSession } from "../../../auth/api/authApi";
import type {
  MobileFamilyAccessSummary,
  MobileFamilySettingsSummary,
} from "../../api/settingsApi";
import { buildSettingsScreenContent } from "../settingsScreen";
import { resolveSettingsOwnershipPolicy } from "../settingsOwnershipPolicy";

const content = buildSettingsScreenContent("ru");

function buildSession(
  overrides?: Partial<MobileAuthSession>,
): MobileAuthSession {
  return {
    tokenType: "bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    account: {
      id: "account-1",
      email: "owner@example.com",
      familyId: "family-1",
      displayName: "Anna",
      relationshipLabel: null,
      phone: null,
      preferredLanguage: "ru",
      familyRole: "admin",
      hasRecoveryCode: true,
      ...(overrides?.account ?? {}),
    },
    family: {
      id: "family-1",
      name: "Care Family",
      ownerAccountId: "account-1",
      ...(overrides?.family ?? {}),
    },
    ...overrides,
  };
}

function buildFamilySummary(
  overrides?: Partial<MobileFamilySettingsSummary>,
): MobileFamilySettingsSummary {
  return {
    id: "family-1",
    name: "Care Family",
    ownerAccountId: "account-1",
    planCode: "plus",
    subscriptionStatus: "active",
    subscriptionExpiresAt: "2026-12-01T00:00:00Z",
    premiumActive: true,
    ...overrides,
  };
}

function buildFamilyAccess(
  overrides?: Partial<MobileFamilyAccessSummary>,
): MobileFamilyAccessSummary {
  return {
    planCode: "plus",
    subscriptionStatus: "active",
    premiumActive: true,
    canManageSubscription: true,
    canUseLiveActivities: true,
    currentChildrenCount: 2,
    currentAdultsCount: 2,
    currentPillboxPlanCount: 1,
    ...overrides,
  };
}

describe("resolveSettingsOwnershipPolicy", () => {
  it("treats family owner with other adults as delete-family flow", () => {
    const policy = resolveSettingsOwnershipPolicy({
      content,
      session: buildSession(),
      familySummary: buildFamilySummary(),
      familyAccess: buildFamilyAccess(),
    });

    expect(policy.isFamilyOwner).toBe(true);
    expect(policy.showDeleteFamilyAction).toBe(true);
    expect(policy.usesFamilyDeleteEndpoint).toBe(true);
    expect(policy.showSubscriptionManagement).toBe(true);
    expect(policy.deletionBlocked).toBe(true);
    expect(policy.deleteLabel).toBe(content.deleteFamilyLabel);
    expect(policy.deleteHint).toBe(content.deleteFamilyBlockedHint);
  });

  it("shows delete-account copy for solo owner but still uses family delete endpoint", () => {
    const policy = resolveSettingsOwnershipPolicy({
      content,
      session: buildSession(),
      familySummary: buildFamilySummary({ ownerAccountId: null }),
      familyAccess: buildFamilyAccess({
        currentAdultsCount: 1,
        currentChildrenCount: 0,
        subscriptionStatus: "inactive",
        canManageSubscription: false,
      }),
    });

    expect(policy.isFamilyOwner).toBe(true);
    expect(policy.showDeleteFamilyAction).toBe(false);
    expect(policy.usesFamilyDeleteEndpoint).toBe(true);
    expect(policy.showSubscriptionManagement).toBe(true);
    expect(policy.deletionBlocked).toBe(false);
    expect(policy.deleteLabel).toBe(content.deleteAccountLabel);
    expect(policy.deleteHint).toBe(content.deleteAccountHint);
  });

  it("treats invited admin as non-owner and keeps delete-account flow", () => {
    const policy = resolveSettingsOwnershipPolicy({
      content,
      session: buildSession({
        account: {
          id: "account-2",
          email: "admin@example.com",
          familyId: "family-1",
          displayName: "Mila",
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
      }),
      familySummary: buildFamilySummary(),
      familyAccess: buildFamilyAccess({
        canManageSubscription: false,
        subscriptionStatus: "inactive",
      }),
    });

    expect(policy.isFamilyOwner).toBe(false);
    expect(policy.showDeleteFamilyAction).toBe(false);
    expect(policy.usesFamilyDeleteEndpoint).toBe(false);
    expect(policy.showSubscriptionManagement).toBe(false);
    expect(policy.deletionBlocked).toBe(false);
    expect(policy.deleteLabel).toBe(content.deleteAccountLabel);
    expect(policy.confirmDeleteMessage).toBe(content.confirmDeleteMemberMessage);
  });
});
