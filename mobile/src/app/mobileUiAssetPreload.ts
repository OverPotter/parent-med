import { illnessAssets } from "../features/illness/assets";
import { settingsScreenAssets } from "../features/settings/assets";
import {
  normalizeChildAvatarGender,
  type ChildCard,
} from "../features/children/model/childrenRedesign";
import { childrenScreenAssets } from "../redesign/screens/children/manifest";
import { redesignBackgrounds } from "../redesign/shared/backgrounds";
import { redesignSharedIcons } from "../redesign/shared/icons";
import { mobileTabAssets } from "../shared/assets/mobileTabAssets";
import type { MobileBottomTabKey } from "../shared/components/mobileBottomTabModel";
import type { PillPathActiveScreen } from "./pillPathExpoShellModel";

const authScreenAssets = {
  background: require("../redesign/screens/auth/assets/auth_family_background_spot.png"),
} as const;

type OverlayAssetContext = {
  activeRootTab?: MobileBottomTabKey;
  activeScreen?: PillPathActiveScreen;
  selectedChild?: ChildCard | null;
};

function collectModulesToSet(value: unknown, bucket: Set<number>) {
  if (typeof value === "number") {
    bucket.add(value);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const nested of Object.values(value)) {
    collectModulesToSet(nested, bucket);
  }
}

function getShellReadyAssetModules() {
  const modules = new Set<number>();

  collectModulesToSet(authScreenAssets, modules);
  collectModulesToSet(childrenScreenAssets.background, modules);
  collectModulesToSet(childrenScreenAssets.icons, modules);
  collectModulesToSet(redesignSharedIcons, modules);
  collectModulesToSet(mobileTabAssets, modules);
  collectModulesToSet(redesignBackgrounds.childrenModule, modules);
  collectIllnessJournalAssets(modules);

  return Array.from(modules);
}

function collectSelectedChildAvatar(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  if (!selectedChild) {
    return;
  }

  collectModulesToSet(selectedChild.avatarSource, modules);
}

function collectSharedProfileAssets(modules: Set<number>) {
  collectModulesToSet(redesignSharedIcons.illnessBadge, modules);
  collectModulesToSet(redesignSharedIcons.feeding, modules);
  collectModulesToSet(redesignSharedIcons.sleep, modules);
  collectModulesToSet(redesignSharedIcons.height, modules);
  collectModulesToSet(redesignSharedIcons.overview, modules);
}

function collectIllnessOnboardingAssets(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  collectModulesToSet(illnessAssets.onboarding.careHint, modules);
  collectModulesToSet(illnessAssets.onboarding.startDate, modules);
  collectModulesToSet(illnessAssets.onboarding.commonReasons, modules);
  collectModulesToSet(illnessAssets.onboarding.reason, modules);

  const gender = normalizeChildAvatarGender(
    selectedChild?.child.gender ?? null,
  );
  if (gender === "girl") {
    collectModulesToSet(illnessAssets.onboarding.suggestions.girls, modules);
    return;
  }

  if (gender === "boy") {
    collectModulesToSet(illnessAssets.onboarding.suggestions.boys, modules);
    return;
  }

  collectModulesToSet(illnessAssets.onboarding.suggestions.boys, modules);
  collectModulesToSet(illnessAssets.onboarding.suggestions.girls, modules);
}

function collectIllnessJournalAssets(modules: Set<number>) {
  collectModulesToSet(illnessAssets.journal, modules);
}

function collectSettingsBranchAssets(modules: Set<number>) {
  collectModulesToSet(settingsScreenAssets, modules);
}

function collectChildEditBranchAssets(modules: Set<number>) {
  collectModulesToSet(childrenScreenAssets.avatars, modules);
}

function collectChildrenBranchAssets(
  modules: Set<number>,
  childrenCards: ChildCard[],
) {
  childrenCards.forEach((card) => {
    collectModulesToSet(card.avatarSource, modules);
  });
  collectSharedProfileAssets(modules);
  const genders = new Set(
    childrenCards
      .map((card) => normalizeChildAvatarGender(card.child.gender))
      .filter(Boolean),
  );

  if (genders.size === 0 || genders.has("boy")) {
    collectModulesToSet(illnessAssets.onboarding.suggestions.boys, modules);
  }

  if (genders.size === 0 || genders.has("girl")) {
    collectModulesToSet(illnessAssets.onboarding.suggestions.girls, modules);
  }

  collectModulesToSet(illnessAssets.onboarding.careHint, modules);
  collectModulesToSet(illnessAssets.onboarding.startDate, modules);
  collectModulesToSet(illnessAssets.onboarding.commonReasons, modules);
  collectModulesToSet(illnessAssets.onboarding.reason, modules);
  collectIllnessJournalAssets(modules);
}

function collectProfileBranchAssets(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  collectSelectedChildAvatar(modules, selectedChild);
  collectSharedProfileAssets(modules);
  collectIllnessOnboardingAssets(modules, selectedChild);
  collectIllnessJournalAssets(modules);
}

function collectAnalyticsBranchAssets(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  collectProfileBranchAssets(modules, selectedChild);
  collectModulesToSet(redesignSharedIcons.illnessBadge, modules);
  collectModulesToSet(illnessAssets.journal.quickMedicine, modules);
}

function collectOverviewBranchAssets(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  collectProfileBranchAssets(modules, selectedChild);
  collectModulesToSet(redesignSharedIcons.profile, modules);
  collectModulesToSet(redesignSharedIcons.observation, modules);
}

function collectIllnessBranchAssets(
  modules: Set<number>,
  selectedChild: ChildCard | null,
) {
  collectSelectedChildAvatar(modules, selectedChild);
  collectIllnessOnboardingAssets(modules, selectedChild);
  collectIllnessJournalAssets(modules);
}

function collectAssetsForScreenBranch(
  modules: Set<number>,
  childrenCards: ChildCard[],
  context: OverlayAssetContext,
) {
  switch (context.activeScreen) {
    case "children":
      collectChildrenBranchAssets(modules, childrenCards);
      return;
    case "childProfile":
      collectProfileBranchAssets(modules, context.selectedChild ?? null);
      collectAnalyticsBranchAssets(modules, context.selectedChild ?? null);
      collectOverviewBranchAssets(modules, context.selectedChild ?? null);
      return;
    case "childProfileEdit":
      collectProfileBranchAssets(modules, context.selectedChild ?? null);
      collectChildEditBranchAssets(modules);
      return;
    case "analytics":
    case "analyticsBreakdown":
      collectAnalyticsBranchAssets(modules, context.selectedChild ?? null);
      return;
    case "overview":
      collectOverviewBranchAssets(modules, context.selectedChild ?? null);
      return;
    case "feedingHistory":
    case "sleepHistory":
    case "weightHistory":
    case "growthHistory":
    case "journalEntry":
      collectProfileBranchAssets(modules, context.selectedChild ?? null);
      return;
    case "illnessOnboarding":
    case "illnessJournal":
    case "illnessActionPlaceholder":
      collectIllnessBranchAssets(modules, context.selectedChild ?? null);
      return;
    case "settings":
      collectSettingsBranchAssets(modules);
      return;
    case "support":
    case "privacyPolicy":
    case "termsOfUse":
    case "childCreate":
      return;
    default:
      if (context.activeRootTab === "children") {
        collectChildrenBranchAssets(modules, childrenCards);
      }
      return;
  }
}

export function getCriticalMobileUiAssetModules() {
  return getShellReadyAssetModules();
}

export function getInitialShellAssetModules(childrenCards: ChildCard[]) {
  const modules = new Set<number>(getShellReadyAssetModules());

  childrenCards.forEach((card) => {
    collectModulesToSet(card.avatarSource, modules);
    card.quickActions.forEach((action) => {
      collectModulesToSet(action.imageSource, modules);
    });
  });

  collectIllnessJournalAssets(modules);

  return Array.from(modules);
}

export function getPersistentMobileUiAssetModules(
  childrenCards: ChildCard[],
  context: OverlayAssetContext,
) {
  const modules = new Set<number>();
  collectAssetsForScreenBranch(modules, childrenCards, context);

  return Array.from(modules);
}
