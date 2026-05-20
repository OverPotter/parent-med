import type { MobileBottomTabItem, MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import { buildChildrenScreenContent } from "../features/children/model/childrenRedesign";
import { hasActiveIllnessObservation } from "../features/illness/model/illnessObservationState";
import type { MobileIllnessObservation } from "../features/illness/model/illnessObservation";
import type { MobileLocale } from "../shared/i18n/mobileI18n";
import type { PillPathActiveScreen } from "./pillPathExpoShellModel";

export function shouldShowJournalRootTab(args: {
  activeIllnessObservationsByChildId: Record<string, MobileIllnessObservation | undefined>;
  activeRootTab: MobileBottomTabKey;
  activeScreen: PillPathActiveScreen;
}) {
  return (
    hasActiveIllnessObservation(args.activeIllnessObservationsByChildId) ||
    args.activeRootTab === "journal" ||
    args.activeScreen === "illnessJournal" ||
    args.activeScreen === "illnessReminders" ||
    args.activeScreen === "illnessActionPlaceholder"
  );
}

export function buildRootTabItems(args: {
  locale: MobileLocale;
  activeRootTab: MobileBottomTabKey;
  shouldShowJournalTab: boolean;
  journalLabel: string;
}): MobileBottomTabItem[] {
  const baseTabs = buildChildrenScreenContent(args.locale, args.activeRootTab).tabs;
  const journalTab: MobileBottomTabItem = {
    key: "journal",
    label: args.journalLabel,
    active: args.activeRootTab === "journal",
  };

  const tabsWithoutMore = baseTabs.filter((tab) => tab.key !== "more");
  const moreTab = baseTabs.find((tab) => tab.key === "more");

  return [
    ...(args.shouldShowJournalTab ? [journalTab] : []),
    ...tabsWithoutMore,
    ...(moreTab ? [moreTab] : []),
  ];
}
