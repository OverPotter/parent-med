import type { MobileAuthSession } from "../features/auth/api/authApi";
import type { JournalEntryKind } from "../features/journal/model/journalEntryScreen";
import type { AnalyticsEpisodeCard } from "../features/analytics/model/analyticsScreen";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";

export type ChildProfileDestination = JournalEntryKind | "overview" | "illness";

export type PillPathActiveScreen =
  | "children"
  | "analytics"
  | "analyticsBreakdown"
  | "pillboxAnalytics"
  | "childProfile"
  | "childCreate"
  | "childProfileEdit"
  | "family"
  | "feedingHistory"
  | "growthHistory"
  | "help"
  | "privacyPolicy"
  | "overview"
  | "settings"
  | "sleepHistory"
  | "support"
  | "termsOfUse"
  | "weightHistory"
  | "journalEntry"
  | "illnessOnboarding"
  | "illnessJournal"
  | "illnessReminders"
  | "illnessActionPlaceholder";

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

const ROOT_MODULE_SCREENS: PillPathActiveScreen[] = [
  "children",
  "illnessJournal",
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
    case "illness":
      return "illnessJournal";
    default:
      return "journalEntry";
  }
}

export function isChildProfileVisibleScreen(
  activeScreen: PillPathActiveScreen,
): boolean {
  return CHILD_PROFILE_VISIBLE_SCREENS.includes(activeScreen);
}

export function shouldRenderMoreTab(
  activeRootTab: MobileBottomTabKey,
  authSession: MobileAuthSession | null,
): boolean {
  return activeRootTab === "more" && authSession != null;
}

export function resolvePostAuthLandingScreen(args: {
  justAuthenticated: boolean;
  hasFamily: boolean;
}): PillPathActiveScreen | null {
  if (!args.hasFamily) {
    return "family";
  }

  return null;
}

export function shouldShowAnalyticsBreakdown(
  activeScreen: PillPathActiveScreen,
  selectedEpisode: AnalyticsEpisodeCard | null,
): boolean {
  return activeScreen === "analyticsBreakdown" && selectedEpisode != null;
}

export function shouldShowRootTabBarUnderlay(
  activeScreen: PillPathActiveScreen,
): boolean {
  return (
    activeScreen === "childCreate" ||
    activeScreen === "childProfile" ||
    activeScreen === "journalEntry" ||
    activeScreen === "illnessOnboarding" ||
    activeScreen === "illnessReminders" ||
    activeScreen === "family" ||
    activeScreen === "help" ||
    activeScreen === "support" ||
    activeScreen === "settings" ||
    activeScreen === "privacyPolicy" ||
    activeScreen === "termsOfUse"
  );
}

export function isRootModuleScreen(
  activeScreen: PillPathActiveScreen,
): boolean {
  return ROOT_MODULE_SCREENS.includes(activeScreen);
}
