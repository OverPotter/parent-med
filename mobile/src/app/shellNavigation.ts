import type { Dispatch, SetStateAction } from "react";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import type { PillPathActiveScreen } from "./pillPathExpoShellModel";

export function openChildrenRoot(
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>,
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>,
) {
  setActiveRootTab("children");
  setActiveScreen("children");
}

export function openIllnessJournalRoot(args: {
  childId?: string | null;
  setActiveRootTab: Dispatch<SetStateAction<MobileBottomTabKey>>;
  setActiveScreen: Dispatch<SetStateAction<PillPathActiveScreen>>;
  setSelectedChildId?: Dispatch<SetStateAction<string>>;
}) {
  if (args.childId && args.setSelectedChildId) {
    args.setSelectedChildId(args.childId);
  }

  args.setActiveRootTab("journal");
  args.setActiveScreen("illnessJournal");
}
