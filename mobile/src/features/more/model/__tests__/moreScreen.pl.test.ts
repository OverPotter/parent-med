import type { MobileAuthSession } from "../../../auth/api/authApi";
import { buildMoreScreenContent } from "../moreScreen";

const session: MobileAuthSession = {
  tokenType: "bearer",
  accessToken: "access-token",
  refreshToken: "refresh-token",
  account: {
    id: "account-1",
    email: "family@example.com",
    familyId: "family-1",
    displayName: "Anna",
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "pl",
    familyRole: "member",
    hasRecoveryCode: true,
  },
  family: {
    id: "family-1",
    name: "Rodzina",
    ownerAccountId: "account-2",
  },
};

describe("buildMoreScreenContent polish", () => {
  it("returns polish labels for profile and navigation rows", () => {
    const content = buildMoreScreenContent("pl", session);

    expect(content.title).toBe("Więcej");
    expect(content.displayNameLabel).toBe("Imię w rodzinie");
    expect(content.relationshipLabel).toBe("Kim jestem w rodzinie");
    expect(content.logoutLabel).toBe("Wyloguj się");
    expect(content.navItems[1]?.title).toBe("Ustawienia");
  });
});
