import { ImageSourcePropType } from "react-native";
import {
  childrenScreenAssets,
  childrenScreenSpec,
} from "../../../redesign/screens/children/manifest";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";

type SourceQuickActionSpec = {
  nodeId: string;
  title: string;
};

type SourceChildCardSpec = {
  nodeId: string;
  info: {
    nameText: string;
    statsText: string;
    lastRecordText: string;
    liveActivityChip: {
      visible: boolean;
      text?: string;
    };
  };
  quickActions: SourceQuickActionSpec[];
};

type SourceBottomTabSpec = {
  nodeId: string;
  label: string;
  active: boolean;
};

type SourceChildrenScreenSpec = {
  header: {
    title: { text: string };
    subtitle: { text: string };
  };
  childrenCards: SourceChildCardSpec[];
  addChildCta: {
    label: string;
  };
  bottomNavigation: {
    tabs: SourceBottomTabSpec[];
  };
};

export type ChildQuickActionKind =
  | "sleep"
  | "feeding"
  | "observation"
  | "profile";

export type ChildQuickAction = {
  nodeId: string;
  kind: ChildQuickActionKind;
  label: string;
  imageSource: ImageSourcePropType;
};

export type ChildCard = {
  nodeId: string;
  name: string;
  stats: string;
  liveActivityVisible: boolean;
  liveActivityText: string;
  avatarSource: ImageSourcePropType;
  quickActions: ChildQuickAction[];
};

export type BottomTab = {
  nodeId: string;
  label: string;
  active: boolean;
};

const screenSpec = childrenScreenSpec as SourceChildrenScreenSpec;

const avatarSequence = [
  childrenScreenAssets.avatars.boyBlackHair,
  childrenScreenAssets.avatars.girlBlonde,
  childrenScreenAssets.avatars.boyRedHair,
  childrenScreenAssets.avatars.child1,
] as const;

function buildQuickActionMap(
  locale: MobileLocale,
): Record<string, Omit<ChildQuickAction, "nodeId">> {
  const isRu = locale === "ru";

  return {
    Сон: {
      kind: "sleep" as const,
      label: isRu ? "Сон" : "Sleep",
      imageSource: childrenScreenAssets.icons.sleep,
    },
    Кормление: {
      kind: "feeding" as const,
      label: isRu ? "Кормление" : "Feeding",
      imageSource: childrenScreenAssets.icons.feeding,
    },
    Наблюдение: {
      kind: "observation" as const,
      label: isRu ? "Наблюдать" : "Observe",
      imageSource: childrenScreenAssets.icons.observation,
    },
    Наблюдать: {
      kind: "observation" as const,
      label: isRu ? "Наблюдать" : "Observe",
      imageSource: childrenScreenAssets.icons.observation,
    },
    Профиль: {
      kind: "profile" as const,
      label: isRu ? "Профиль" : "Profile",
      imageSource: childrenScreenAssets.icons.profile,
    },
  };
}

function mapQuickAction(
  action: SourceQuickActionSpec,
  locale: MobileLocale,
): ChildQuickAction {
  const quickActionByTitle = buildQuickActionMap(locale);
  const mapped = quickActionByTitle[action.title];

  if (!mapped) {
    return {
      nodeId: action.nodeId,
      kind: "profile",
      label: action.title,
      imageSource: childrenScreenAssets.icons.profile,
    };
  }

  return {
    nodeId: action.nodeId,
    ...mapped,
  };
}

export function buildChildrenScreenContent(locale: MobileLocale) {
  const isRu = locale === "ru";

  return {
    backgroundSource: childrenScreenAssets.background,
    headerTitle: isRu ? screenSpec.header.title.text : "Children",
    headerSubtitle: isRu
      ? screenSpec.header.subtitle.text
      : "Children profiles and quick access to records.",
    addChildLabel: isRu ? screenSpec.addChildCta.label : "Add child",
    cards: screenSpec.childrenCards.map((card, index) => ({
      nodeId: card.nodeId,
      name: card.info.nameText,
      stats: card.info.statsText,
      liveActivityVisible: card.info.liveActivityChip.visible,
      liveActivityText: card.info.liveActivityChip.text ?? "",
      avatarSource: avatarSequence[index % avatarSequence.length],
      quickActions: card.quickActions.map((action) =>
        mapQuickAction(action, locale),
      ),
    })),
    tabs: isRu
      ? screenSpec.bottomNavigation.tabs
      : screenSpec.bottomNavigation.tabs.map((tab) => ({
          ...tab,
          label:
            tab.label === "Дети"
              ? "Children"
              : tab.label === "Таблетница"
                ? "Pillbox"
                : tab.label === "Аптечка"
                  ? "Cabinet"
                  : "More",
        })),
  } satisfies {
    backgroundSource: ImageSourcePropType;
    headerTitle: string;
    headerSubtitle: string;
    addChildLabel: string;
    cards: ChildCard[];
    tabs: BottomTab[];
  };
}
