import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import type { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import type { MobileLocale } from "../shared/i18n/mobileI18n";
import type { MobileBottomTabKey } from "../shared/components/MobileBottomTabBar";

export type ChildProfileDestination = JournalEntryKind | "overview";

export type PillPathActiveScreen =
  | "children"
  | "analytics"
  | "analyticsBreakdown"
  | "childProfile"
  | "childProfileEdit"
  | "feedingHistory"
  | "growthHistory"
  | "privacyPolicy"
  | "overview"
  | "settings"
  | "sleepHistory"
  | "support"
  | "termsOfUse"
  | "weightHistory"
  | "journalEntry";

const CHILD_PROFILE_VISIBLE_SCREENS: PillPathActiveScreen[] = [
  "childProfile",
  "childProfileEdit",
  "analytics",
  "analyticsBreakdown",
  "feedingHistory",
  "growthHistory",
  "overview",
  "sleepHistory",
  "weightHistory",
];

export function resolveJournalTargetScreen(
  destination: ChildProfileDestination,
): PillPathActiveScreen {
  switch (destination) {
    case "overview":
      return "overview";
    case "feeding":
      return "feedingHistory";
    case "sleep":
      return "sleepHistory";
    case "weight":
      return "weightHistory";
    case "height":
      return "growthHistory";
    default:
      return "journalEntry";
  }
}

export function isChildProfileVisibleScreen(
  activeScreen: PillPathActiveScreen,
): boolean {
  return CHILD_PROFILE_VISIBLE_SCREENS.includes(activeScreen);
}

export function resolveStoredSessionPreferredLocale(
  storedSession: MobileAuthSession,
  refreshedSession: MobileAuthSession,
): MobileLocale {
  return storedSession.account.preferredLanguage === "pl" ||
    storedSession.account.preferredLanguage === "de"
    ? storedSession.account.preferredLanguage
    : refreshedSession.account.preferredLanguage;
}

export function shouldRenderMoreTab(
  activeRootTab: MobileBottomTabKey,
  authSession: MobileAuthSession | null,
): boolean {
  return activeRootTab === "more" && authSession != null;
}

export function shouldShowAnalyticsBreakdown(
  activeScreen: PillPathActiveScreen,
  selectedEpisode: AnalyticsEpisodeCard | null,
): boolean {
  return activeScreen === "analyticsBreakdown" && selectedEpisode != null;
}
