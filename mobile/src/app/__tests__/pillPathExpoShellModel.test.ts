import type { MobileAuthSession } from "../../features/auth/api/authApi";
import {
  isChildProfileVisibleScreen,
  resolveJournalTargetScreen,
  resolveStoredSessionPreferredLocale,
  shouldRenderMoreTab,
  shouldShowRootTabBarUnderlay,
  shouldShowAnalyticsBreakdown,
} from "../pillPathExpoShellModel";

const baseSession: MobileAuthSession = {
  tokenType: "bearer",
  accessToken: "access",
  refreshToken: "refresh",
  account: {
    id: "account-1",
    email: "user@example.com",
    familyId: "family-1",
    displayName: "Anna",
    relationshipLabel: null,
    phone: null,
    preferredLanguage: "ru",
    familyRole: "admin",
    hasRecoveryCode: false,
  },
  family: {
    id: "family-1",
    name: "Care Family",
    ownerAccountId: "account-1",
  },
};

describe("pillPathExpoShellModel", () => {
  it("maps child destinations to shell screens", () => {
    expect(resolveJournalTargetScreen("overview")).toBe("overview");
    expect(resolveJournalTargetScreen("feeding")).toBe("feedingHistory");
    expect(resolveJournalTargetScreen("sleep")).toBe("sleepHistory");
    expect(resolveJournalTargetScreen("weight")).toBe("weightHistory");
    expect(resolveJournalTargetScreen("height")).toBe("growthHistory");
    expect(resolveJournalTargetScreen("illness")).toBe("illnessJournal");
  });

  it("keeps pl/de locale from stored session during bootstrap", () => {
    const storedPl = {
      ...baseSession,
      account: { ...baseSession.account, preferredLanguage: "pl" as const },
    };
    const refreshedEn = {
      ...baseSession,
      account: { ...baseSession.account, preferredLanguage: "en" as const },
    };

    expect(resolveStoredSessionPreferredLocale(storedPl, refreshedEn)).toBe("pl");
    expect(resolveStoredSessionPreferredLocale(baseSession, refreshedEn)).toBe("en");
  });

  it("exposes routing predicates for more tab and breakdown", () => {
    expect(shouldRenderMoreTab("more", baseSession)).toBe(true);
    expect(shouldRenderMoreTab("children", baseSession)).toBe(false);
    expect(shouldRenderMoreTab("more", null)).toBe(false);

    expect(shouldShowAnalyticsBreakdown("analyticsBreakdown", { id: "1" } as never)).toBe(
      true,
    );
    expect(shouldShowAnalyticsBreakdown("analytics", { id: "1" } as never)).toBe(false);
    expect(shouldShowAnalyticsBreakdown("analyticsBreakdown", null)).toBe(false);
  });

  it("knows which child profile screens keep the child profile visible", () => {
    expect(isChildProfileVisibleScreen("childProfile")).toBe(true);
    expect(isChildProfileVisibleScreen("analytics")).toBe(true);
    expect(isChildProfileVisibleScreen("settings")).toBe(false);
  });

  it("shows the root tab bar under overlay screens that swipe back to a root module", () => {
    expect(shouldShowRootTabBarUnderlay("childProfile")).toBe(true);
    expect(shouldShowRootTabBarUnderlay("journalEntry")).toBe(true);
    expect(shouldShowRootTabBarUnderlay("illnessReminders")).toBe(true);
    expect(shouldShowRootTabBarUnderlay("analytics")).toBe(false);
    expect(shouldShowRootTabBarUnderlay("childProfileEdit")).toBe(false);
  });
});
