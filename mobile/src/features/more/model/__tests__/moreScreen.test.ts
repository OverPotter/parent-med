import type { MobileAuthSession } from "../../../auth/api/authApi";
import { buildMoreScreenContent } from "../moreScreen";

function buildSession(
  overrides?: Partial<MobileAuthSession>,
): MobileAuthSession {
  return {
    tokenType: "bearer",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    account: {
      id: "account-1",
      email: "family@example.com",
      familyId: "family-1",
      displayName: "Anna",
      needsProfileCompletion: false,
      relationshipLabel: null,
      phone: null,
      preferredLanguage: "ru",
      familyRole: "member",
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

describe("buildMoreScreenContent", () => {
  it("shows owner label based on ownerAccountId even if backend role is admin", () => {
    const content = buildMoreScreenContent(
      "ru",
      buildSession({
        account: {
          id: "account-1",
          email: "owner@example.com",
          familyId: "family-1",
          displayName: "Owner",
          needsProfileCompletion: false,
          relationshipLabel: null,
          phone: null,
          preferredLanguage: "ru",
          familyRole: "admin",
          hasRecoveryCode: true,
        },
      }),
    );

    expect(content.familyRoleLabel).toBe("Владелец семьи");
  });

  it("shows admin label for invited admin who is not the family owner", () => {
    const content = buildMoreScreenContent(
      "ru",
      buildSession({
        account: {
          id: "account-2",
          email: "admin@example.com",
          familyId: "family-1",
          displayName: "Admin",
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
      }),
    );

    expect(content.familyRoleLabel).toBe("Администратор семьи");
  });

  it("shows member label for regular invited participant", () => {
    const content = buildMoreScreenContent(
      "ru",
      buildSession({
        account: {
          id: "account-3",
          email: "member@example.com",
          familyId: "family-1",
          displayName: "Member",
          needsProfileCompletion: false,
          relationshipLabel: null,
          phone: null,
          preferredLanguage: "ru",
          familyRole: "member",
          hasRecoveryCode: true,
        },
        family: {
          id: "family-1",
          name: "Care Family",
          ownerAccountId: "account-1",
        },
      }),
    );

    expect(content.familyRoleLabel).toBe("Участник семьи");
  });

  it("uses distinct english profile labels for family and account fields", () => {
    const content = buildMoreScreenContent(
      "en",
      buildSession({
        account: {
          id: "account-3",
          email: "member@example.com",
          familyId: "family-1",
          displayName: "Member",
          needsProfileCompletion: false,
          relationshipLabel: null,
          phone: null,
          preferredLanguage: "en",
          familyRole: "member",
          hasRecoveryCode: true,
        },
      }),
    );

    expect(content.familyNameLabel).toBe("Family name");
    expect(content.displayNameLabel).toBe("Name in family");
    expect(content.relationshipLabel).toBe("Who I am in the family");
    expect(content.noRelationshipValue).toBe("No family role yet");
  });
});
