import { ImageSourcePropType } from "react-native";
import type { MobileChildSummary } from "../api/childrenApi";
import {
  childrenScreenAssets,
  childrenScreenSpec,
} from "../../../redesign/screens/children/manifest";
import { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  MobileBottomTabItem,
  MobileBottomTabKey,
} from "../../../shared/components/MobileBottomTabBar";

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

export type ChildAvatarGender = "boy" | "girl";
export type ChildAvatarPresetKey =
  | "boy_black_hair"
  | "boy_red_hair"
  | "boy"
  | "girl_blonde"
  | "girl";

export type ChildrenStopActionKind = "sleep" | "feeding";

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

export function getObservationActionLabel(locale: MobileLocale, hasActiveObservation: boolean) {
  if (hasActiveObservation) {
    if (locale === "ru") return "Журнал";
    if (locale === "de") return "Journal";
    if (locale === "pl") return "Dziennik";
    return "Journal";
  }

  if (locale === "ru") return "Наблюдать";
  if (locale === "de") return "Beobachten";
  if (locale === "pl") return "Obserwuj";
  return "Observe";
}

export type ChildrenStopActionCopy = {
  title: string;
  cancelLabel: string;
  confirmLabel: string;
};

const screenSpec = childrenScreenSpec as SourceChildrenScreenSpec;

const avatarSequence = [
  childrenScreenAssets.avatars.boyBlackHair,
  childrenScreenAssets.avatars.girlBlonde,
  childrenScreenAssets.avatars.boyRedHair,
  childrenScreenAssets.avatars.child1,
] as const;

export const childAvatarPresets: Array<{
  key: ChildAvatarPresetKey;
  gender: ChildAvatarGender;
  source: ImageSourcePropType;
}> = [
  {
    key: "boy_black_hair",
    gender: "boy",
    source: childrenScreenAssets.avatars.boyBlackHair,
  },
  {
    key: "boy_red_hair",
    gender: "boy",
    source: childrenScreenAssets.avatars.boyRedHair,
  },
  {
    key: "boy",
    gender: "boy",
    source: childrenScreenAssets.avatars.boy,
  },
  {
    key: "girl_blonde",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlBlonde,
  },
  {
    key: "girl",
    gender: "girl",
    source: childrenScreenAssets.avatars.girl,
  },
];

const avatarByKey: Record<string, ImageSourcePropType> = {
  boy_black_hair: childrenScreenAssets.avatars.boyBlackHair,
  boy_red_hair: childrenScreenAssets.avatars.boyRedHair,
  girl_blonde: childrenScreenAssets.avatars.girlBlonde,
  boy: childrenScreenAssets.avatars.boy,
  girl: childrenScreenAssets.avatars.girl,
  child1: childrenScreenAssets.avatars.child1,
  child2: childrenScreenAssets.avatars.child2,
  child3: childrenScreenAssets.avatars.child3,
};

function buildQuickActionMap(
  locale: MobileLocale,
): Record<string, Omit<ChildQuickAction, "nodeId">> {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";

  return {
    Сон: {
      kind: "sleep" as const,
      label: isRu ? "Сон" : isDe ? "Schlaf" : isPl ? "Sen" : "Sleep",
      imageSource: childrenScreenAssets.icons.sleep,
    },
    Кормление: {
      kind: "feeding" as const,
      label: isRu ? "Кормление" : isDe ? "Fütterung" : isPl ? "Karmienie" : "Feeding",
      imageSource: childrenScreenAssets.icons.feeding,
    },
    Наблюдение: {
      kind: "observation" as const,
      label: isRu ? "Наблюдать" : isDe ? "Beobachten" : isPl ? "Obserwuj" : "Observe",
      imageSource: childrenScreenAssets.icons.observation,
    },
    Наблюдать: {
      kind: "observation" as const,
      label: isRu ? "Наблюдать" : isDe ? "Beobachten" : isPl ? "Obserwuj" : "Observe",
      imageSource: childrenScreenAssets.icons.observation,
    },
    Профиль: {
      kind: "profile" as const,
      label: isRu ? "Профиль" : isDe ? "Profil" : isPl ? "Profil" : "Profile",
      imageSource: childrenScreenAssets.icons.profile,
    },
  };
}

function mapQuickAction(
  action: SourceQuickActionSpec,
  quickActionByTitle: Record<string, Omit<ChildQuickAction, "nodeId">>,
): ChildQuickAction {
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

function resolveAvatarSource(avatarKey: string | null, index: number) {
  if (avatarKey && avatarByKey[avatarKey]) {
    return avatarByKey[avatarKey];
  }

  return avatarSequence[index % avatarSequence.length];
}

function resolveAvatarSourceWithGender(
  avatarKey: string | null,
  gender: string | null,
  index: number,
) {
  if (avatarKey && avatarByKey[avatarKey]) {
    return avatarByKey[avatarKey];
  }

  if (gender === "boy") {
    return childrenScreenAssets.avatars.boyBlackHair;
  }

  if (gender === "girl") {
    return childrenScreenAssets.avatars.girlBlonde;
  }

  return resolveAvatarSource(avatarKey, index);
}

export function getChildAvatarSourceByKey(avatarKey: string | null) {
  return avatarKey ? avatarByKey[avatarKey] ?? null : null;
}

export function getChildAvatarGenderByKey(
  avatarKey: ChildAvatarPresetKey | null,
): ChildAvatarGender | null {
  if (!avatarKey) {
    return null;
  }

  return childAvatarPresets.find((item) => item.key === avatarKey)?.gender ?? null;
}

function buildCardStatsLabel(
  child: Pick<MobileChildSummary, "ageLabel" | "babyModeEnabled">,
  locale: MobileLocale,
) {
  if (child.ageLabel) {
    return child.ageLabel;
  }

  if (child.babyModeEnabled) {
    if (locale === "ru") return "Режим малыша";
    if (locale === "de") return "Baby-Modus";
    if (locale === "pl") return "Tryb niemowlęcia";
    return "Baby mode";
  }

  return "";
}

function mapTabKey(label: string): MobileBottomTabKey {
  if (label === "Дети" || label === "Children" || label === "Dzieci" || label === "Kinder") {
    return "children";
  }

  if (
    label === "Ещё" ||
    label === "More" ||
    label === "Mehr" ||
    label === "Więcej"
  ) {
    return "more";
  }

  if (label === "Таблетница" || label === "Pillbox" || label === "Pudełko leków" || label === "Pillenbox") {
    return "pillbox";
  }

  if (label === "Аптечка" || label === "Cabinet" || label === "Apteczka" || label === "Hausapotheke") {
    return "cabinet";
  }

  return "more";
}

export function buildChildrenScreenContent(
  locale: MobileLocale,
  activeTabKey: MobileBottomTabKey = "children",
) {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const quickActionByTitle = buildQuickActionMap(locale);
  const sourceTabs = screenSpec.bottomNavigation.tabs.map((tab) => ({
    ...tab,
    label: isRu
      ? tab.label
      : isDe
        ? tab.label === "Дети"
          ? "Kinder"
          : tab.label === "Ещё"
            ? "Mehr"
            : tab.label === "Таблетница"
              ? "Pillenbox"
              : tab.label === "Аптечка"
                ? "Hausapotheke"
                : tab.label
      : isPl
        ? tab.label === "Дети"
          ? "Dzieci"
          : tab.label === "Ещё"
            ? "Więcej"
            : tab.label === "Таблетница"
              ? "Pudełko leków"
              : tab.label === "Аптечка"
                ? "Apteczka"
                : tab.label
      : tab.label === "Дети"
        ? "Children"
        : tab.label === "Ещё"
          ? "More"
          : tab.label === "Таблетница"
            ? "Pillbox"
            : tab.label === "Аптечка"
              ? "Cabinet"
              : tab.label,
  }));

  return {
    backgroundSource: childrenScreenAssets.background,
    headerTitle: isRu ? screenSpec.header.title.text : isDe ? "Kinder" : isPl ? "Dzieci" : "Children",
    headerSubtitle: isRu
      ? screenSpec.header.subtitle.text
      : isDe
        ? "Kinderprofile und schneller Zugriff auf Einträge."
      : isPl
        ? "Profile dzieci i szybki dostęp do wpisów."
      : "Children profiles and quick access to records.",
    addChildLabel: isRu ? screenSpec.addChildCta.label : isDe ? "Kind hinzufügen" : isPl ? "Dodaj dziecko" : "Add child",
    cards: screenSpec.childrenCards.map((card, index) => ({
      nodeId: card.nodeId,
      name: card.info.nameText,
      stats: card.info.statsText,
      liveActivityVisible: card.info.liveActivityChip.visible,
      liveActivityText: card.info.liveActivityChip.text ?? "",
      avatarSource: avatarSequence[index % avatarSequence.length],
      quickActions: card.quickActions.map((action) =>
        mapQuickAction(action, quickActionByTitle),
      ),
    })),
    tabs: sourceTabs.map(
      (tab): MobileBottomTabItem => ({
        key: mapTabKey(tab.label),
        label: tab.label,
        active: mapTabKey(tab.label) === activeTabKey,
      }),
    ),
  } satisfies {
    backgroundSource: ImageSourcePropType;
    headerTitle: string;
    headerSubtitle: string;
    addChildLabel: string;
    cards: ChildCard[];
    tabs: MobileBottomTabItem[];
  };
}

export function buildChildrenCardsFromApi(
  children: MobileChildSummary[],
  locale: MobileLocale,
): ChildCard[] {
  const quickActionByTitle = buildQuickActionMap(locale);
  const fallbackQuickActions = screenSpec.childrenCards[0]?.quickActions ?? [];

  return children.map((child, index) => ({
    nodeId: child.id,
    name: child.name,
    stats: buildCardStatsLabel(child, locale),
    liveActivityVisible: false,
    liveActivityText: "",
    avatarSource: resolveAvatarSourceWithGender(
      child.avatarKey,
      child.gender,
      index,
    ),
    quickActions: fallbackQuickActions.map((action) =>
      mapQuickAction(
        {
          ...action,
          nodeId: `${child.id}:${action.nodeId}`,
        },
        quickActionByTitle,
      ),
    ),
  }));
}

export function buildChildrenStopActionCopy(
  locale: MobileLocale,
  kind: ChildrenStopActionKind,
): ChildrenStopActionCopy {
  const cancelLabel =
    locale === "ru"
      ? "Нет"
      : locale === "pl"
        ? "Nie"
        : locale === "de"
          ? "Nein"
          : "No";
  const confirmLabel =
    locale === "ru"
      ? "Да"
      : locale === "pl"
        ? "Tak"
        : locale === "de"
          ? "Ja"
          : "Yes";

  const title =
    kind === "sleep"
      ? locale === "ru"
        ? "Завершить сон?"
        : locale === "pl"
          ? "Zakończyć sen?"
          : locale === "de"
            ? "Schlaf beenden?"
            : "Finish sleep?"
      : locale === "ru"
        ? "Завершить кормление?"
        : locale === "pl"
          ? "Zakończyć karmienie?"
          : locale === "de"
            ? "Füttern beenden?"
            : "Finish feeding?";

  return {
    title,
    cancelLabel,
    confirmLabel,
  };
}
