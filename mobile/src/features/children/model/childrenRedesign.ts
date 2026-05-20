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
} from "../../../shared/components/mobileBottomTabModel";

type SourceQuickActionSpec = {
  nodeId: string;
  title: string;
};

type SourceChildCardSpec = {
  nodeId: string;
  info: {
    nameText: string;
    statsText: string;
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

type FallbackStatsParts = {
  years: number | null;
  weightKg: number | null;
  heightCm: number | null;
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
  | "boy_glasses"
  | "boy_curls_dark"
  | "boy_curls_light"
  | "boy_spiky_dark"
  | "girl_blonde"
  | "girl"
  | "girl_pigtails"
  | "girl_braid_glasses"
  | "girl_headband"
  | "girl_red_curls"
  | "girl_dark_bob"
  | "girl_dark_curls_bow"
  | "girl_brown_clip"
  | "girl_dark_bob_flower"
  | "baby_boy"
  | "baby_boy_curls"
  | "baby_boy_blonde_blue"
  | "baby_boy_dark_side"
  | "baby_boy_blonde_short"
  | "baby_boy_brown_curls"
  | "baby_girl_curls"
  | "baby_girl_blonde_pigtails"
  | "baby_girl_blonde_pigtails_alt"
  | "baby_girl_dark_sideclip"
  | "baby_girl_dark_puff_buns"
  | "baby_girl_curls_bow"
  | "baby_girl_red_bob_flower";

export type ChildrenStopActionKind = "sleep" | "feeding";

export type ChildQuickAction = {
  nodeId: string;
  kind: ChildQuickActionKind;
  label: string;
  imageSource: ImageSourcePropType;
};

export type ChildCardChild = {
  id: string;
  name: string;
  ageLabel: string | null;
  weightValue: string;
  heightValue: string;
  birthDate: string | null;
  babyModeEnabled: boolean;
  avatarKey: string | null;
  gender: string | null;
  allergies: string | null;
  notes: string | null;
};

export type ChildCard = {
  nodeId: string;
  name: string;
  stats: string;
  child: ChildCardChild;
  isLocked: boolean;
  avatarSource: ImageSourcePropType | null;
  quickActions: ChildQuickAction[];
};

export type ChildAccessState = {
  unlockedChildId: string | null;
  lockedChildIds: string[];
};

export function getObservationActionLabel(
  locale: MobileLocale,
  hasActiveObservation: boolean,
) {
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

const tabKeyBySourceNodeId: Record<string, MobileBottomTabKey> = {
  dARF2: "children",
  n2LcFM: "pillbox",
  zbsG1: "cabinet",
  Z6buO: "more",
};

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
    key: "boy_glasses",
    gender: "boy",
    source: childrenScreenAssets.avatars.boyGlasses,
  },
  {
    key: "boy_curls_dark",
    gender: "boy",
    source: childrenScreenAssets.avatars.boyCurlsDark,
  },
  {
    key: "boy_curls_light",
    gender: "boy",
    source: childrenScreenAssets.avatars.boyCurlsLight,
  },
  {
    key: "boy_spiky_dark",
    gender: "boy",
    source: childrenScreenAssets.avatars.child3,
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
  {
    key: "girl_pigtails",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlPigtails,
  },
  {
    key: "girl_braid_glasses",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlBraidGlasses,
  },
  {
    key: "girl_headband",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlHeadband,
  },
  {
    key: "girl_red_curls",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlRedCurls,
  },
  {
    key: "girl_dark_bob",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlDarkBob,
  },
  {
    key: "girl_dark_curls_bow",
    gender: "girl",
    source: childrenScreenAssets.avatars.girlDarkCurlsBow,
  },
  {
    key: "girl_brown_clip",
    gender: "girl",
    source: childrenScreenAssets.avatars.child1,
  },
  {
    key: "girl_dark_bob_flower",
    gender: "girl",
    source: childrenScreenAssets.avatars.child2,
  },
  {
    key: "baby_boy",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoy,
  },
  {
    key: "baby_boy_curls",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoyCurls,
  },
  {
    key: "baby_boy_blonde_blue",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoyBlondeBlue,
  },
  {
    key: "baby_boy_dark_side",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoyDarkSide,
  },
  {
    key: "baby_boy_blonde_short",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoyBlondeShort,
  },
  {
    key: "baby_boy_brown_curls",
    gender: "boy",
    source: childrenScreenAssets.avatars.babyBoyBrownCurls,
  },
  {
    key: "baby_girl_curls",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlCurls,
  },
  {
    key: "baby_girl_blonde_pigtails",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlBlondePigtails,
  },
  {
    key: "baby_girl_blonde_pigtails_alt",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlBlondePigtailsAlt,
  },
  {
    key: "baby_girl_dark_sideclip",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlDarkSideclip,
  },
  {
    key: "baby_girl_dark_puff_buns",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlDarkPuffBuns,
  },
  {
    key: "baby_girl_curls_bow",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlCurlsBow,
  },
  {
    key: "baby_girl_red_bob_flower",
    gender: "girl",
    source: childrenScreenAssets.avatars.babyGirlRedBobFlower,
  },
];

export function getChildAvatarPresets(gender?: ChildAvatarGender | null) {
  if (!gender) {
    return childAvatarPresets;
  }

  return childAvatarPresets.filter((item) => item.gender === gender);
}

export function getChildAvatarPresetSources(gender?: ChildAvatarGender | null) {
  return getChildAvatarPresets(gender).map((item) => item.source);
}

const avatarByKey: Record<string, ImageSourcePropType> = {
  boy_black_hair: childrenScreenAssets.avatars.boyBlackHair,
  boy_red_hair: childrenScreenAssets.avatars.boyRedHair,
  boy_glasses: childrenScreenAssets.avatars.boyGlasses,
  boy_curls_dark: childrenScreenAssets.avatars.boyCurlsDark,
  boy_curls_light: childrenScreenAssets.avatars.boyCurlsLight,
  boy_spiky_dark: childrenScreenAssets.avatars.child3,
  girl_blonde: childrenScreenAssets.avatars.girlBlonde,
  boy: childrenScreenAssets.avatars.boy,
  girl: childrenScreenAssets.avatars.girl,
  girl_pigtails: childrenScreenAssets.avatars.girlPigtails,
  girl_braid_glasses: childrenScreenAssets.avatars.girlBraidGlasses,
  girl_headband: childrenScreenAssets.avatars.girlHeadband,
  girl_red_curls: childrenScreenAssets.avatars.girlRedCurls,
  girl_dark_bob: childrenScreenAssets.avatars.girlDarkBob,
  girl_dark_curls_bow: childrenScreenAssets.avatars.girlDarkCurlsBow,
  girl_brown_clip: childrenScreenAssets.avatars.child1,
  girl_dark_bob_flower: childrenScreenAssets.avatars.child2,
  baby_boy: childrenScreenAssets.avatars.babyBoy,
  baby_boy_curls: childrenScreenAssets.avatars.babyBoyCurls,
  baby_boy_blonde_blue: childrenScreenAssets.avatars.babyBoyBlondeBlue,
  baby_boy_dark_side: childrenScreenAssets.avatars.babyBoyDarkSide,
  baby_boy_blonde_short: childrenScreenAssets.avatars.babyBoyBlondeShort,
  baby_boy_brown_curls: childrenScreenAssets.avatars.babyBoyBrownCurls,
  baby_girl_curls: childrenScreenAssets.avatars.babyGirlCurls,
  baby_girl_blonde_pigtails:
    childrenScreenAssets.avatars.babyGirlBlondePigtails,
  baby_girl_blonde_pigtails_alt:
    childrenScreenAssets.avatars.babyGirlBlondePigtailsAlt,
  baby_girl_dark_sideclip: childrenScreenAssets.avatars.babyGirlDarkSideclip,
  baby_girl_dark_puff_buns: childrenScreenAssets.avatars.babyGirlDarkPuffBuns,
  baby_girl_curls_bow: childrenScreenAssets.avatars.babyGirlCurlsBow,
  baby_girl_red_bob_flower: childrenScreenAssets.avatars.babyGirlRedBobFlower,
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
      label: isRu
        ? "Кормление"
        : isDe
          ? "Fütterung"
          : isPl
            ? "Karmienie"
            : "Feeding",
      imageSource: childrenScreenAssets.icons.feeding,
    },
    Наблюдение: {
      kind: "observation" as const,
      label: isRu
        ? "Наблюдать"
        : isDe
          ? "Beobachten"
          : isPl
            ? "Obserwuj"
            : "Observe",
      imageSource: childrenScreenAssets.icons.observation,
    },
    Наблюдать: {
      kind: "observation" as const,
      label: isRu
        ? "Наблюдать"
        : isDe
          ? "Beobachten"
          : isPl
            ? "Obserwuj"
            : "Observe",
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

  if (!avatarKey) {
    return null;
  }

  const normalizedGender = normalizeChildAvatarGender(gender);

  if (normalizedGender === "girl") {
    return childrenScreenAssets.avatars.girl;
  }

  if (normalizedGender === "boy") {
    return childrenScreenAssets.avatars.boy;
  }

  return resolveAvatarSource(avatarKey, index);
}

export function getChildAvatarSourceByKey(avatarKey: string | null) {
  return avatarKey ? (avatarByKey[avatarKey] ?? null) : null;
}

export function getChildAvatarGenderByKey(
  avatarKey: ChildAvatarPresetKey | null,
): ChildAvatarGender | null {
  if (!avatarKey) {
    return null;
  }

  return (
    childAvatarPresets.find((item) => item.key === avatarKey)?.gender ?? null
  );
}

export function normalizeChildAvatarGender(
  value: string | null,
): ChildAvatarGender | null {
  if (value === "boy" || value === "male") {
    return "boy";
  }

  if (value === "girl" || value === "female") {
    return "girl";
  }

  return null;
}

export function isCompactAvatarPresetKey(key: ChildAvatarPresetKey) {
  return key === "girl_dark_bob";
}

function buildCardStatsLabel(
  child: Pick<MobileChildSummary, "ageLabel" | "babyModeEnabled">,
  latestMetrics: { weightValue: string; heightValue: string },
  locale: MobileLocale,
) {
  const parts = [
    child.ageLabel,
    latestMetrics.weightValue || null,
    latestMetrics.heightValue || null,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" • ");
  }

  if (child.babyModeEnabled) {
    if (locale === "ru") return "Режим малыша";
    if (locale === "de") return "Baby-Modus";
    if (locale === "pl") return "Tryb niemowlęcia";
    return "Baby mode";
  }

  return "";
}

function formatWeightValue(
  valueKg: number | null | undefined,
  locale: MobileLocale,
) {
  if (typeof valueKg !== "number") {
    return "";
  }

  const formatted =
    locale === "ru" || locale === "de" || locale === "pl"
      ? valueKg.toFixed(1).replace(".", ",")
      : valueKg.toFixed(1);
  return `${formatted} ${locale === "ru" ? "кг" : "kg"}`;
}

function formatHeightValue(
  valueCm: number | null | undefined,
  locale: MobileLocale,
) {
  if (typeof valueCm !== "number") {
    return "";
  }

  return `${Math.round(valueCm)} ${locale === "ru" ? "см" : "cm"}`;
}

function formatFallbackAgeYears(
  years: number | null,
  locale: MobileLocale,
) {
  if (years === null) {
    return null;
  }
  if (locale === "ru") {
    return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`;
  }
  if (locale === "de") {
    return `${years} ${years === 1 ? "Jahr" : "Jahre"}`;
  }
  if (locale === "pl") {
    return `${years} ${years === 1 ? "rok" : years < 5 ? "lata" : "lat"}`;
  }
  return `${years} ${years === 1 ? "year" : "years"}`;
}

function parseFallbackStatsLabel(value: string): FallbackStatsParts {
  const yearsMatch = value.match(/(\d+)\s+год/);
  const weightMatch = value.match(/(\d+(?:[.,]\d+)?)\s*кг/);
  const heightMatch = value.match(/(\d+(?:[.,]\d+)?)\s*см/);

  return {
    years: yearsMatch ? Number.parseInt(yearsMatch[1] ?? "", 10) : null,
    weightKg: weightMatch
      ? Number.parseFloat((weightMatch[1] ?? "").replace(",", "."))
      : null,
    heightCm: heightMatch
      ? Number.parseFloat((heightMatch[1] ?? "").replace(",", "."))
      : null,
  };
}

function localizeFallbackStatsLabel(
  statsText: string,
  locale: MobileLocale,
) {
  if (locale === "ru") {
    return statsText;
  }

  const parsed = parseFallbackStatsLabel(statsText);
  const parts = [
    formatFallbackAgeYears(parsed.years, locale),
    formatWeightValue(parsed.weightKg, locale) || null,
    formatHeightValue(parsed.heightCm, locale) || null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : statsText;
}

function getChildrenTabLabel(
  locale: MobileLocale,
  key: MobileBottomTabKey,
) {
  if (key === "children") {
    return locale === "ru"
      ? "Дети"
      : locale === "de"
        ? "Kinder"
        : locale === "pl"
          ? "Dzieci"
          : "Children";
  }
  if (key === "pillbox") {
    return locale === "ru"
      ? "Таблетница"
      : locale === "de"
        ? "Pillenbox"
        : locale === "pl"
          ? "Pudełko leków"
          : "Pillbox";
  }
  if (key === "cabinet") {
    return locale === "ru"
      ? "Аптечка"
      : locale === "de"
        ? "Hausapotheke"
        : locale === "pl"
          ? "Apteczka"
          : "Cabinet";
  }
  return locale === "ru"
    ? "Ещё"
    : locale === "de"
      ? "Mehr"
      : locale === "pl"
        ? "Więcej"
        : "More";
}

function mapTabKey(tab: SourceBottomTabSpec): MobileBottomTabKey {
  return tabKeyBySourceNodeId[tab.nodeId] ?? "more";
}

export function buildChildrenScreenContent(
  locale: MobileLocale,
  activeTabKey: MobileBottomTabKey = "children",
) {
  const isRu = locale === "ru";
  const isDe = locale === "de";
  const isPl = locale === "pl";
  const quickActionByTitle = buildQuickActionMap(locale);
  const sourceTabs = screenSpec.bottomNavigation.tabs.map((tab) => {
    const key = mapTabKey(tab);
    return {
      ...tab,
      key,
      label: getChildrenTabLabel(locale, key),
    };
  });

  return {
    backgroundSource: childrenScreenAssets.background,
    headerTitle: isRu
      ? screenSpec.header.title.text
      : isDe
        ? "Kinder"
        : isPl
          ? "Dzieci"
          : "Children",
    headerSubtitle: isRu
      ? screenSpec.header.subtitle.text
      : isDe
        ? "Kinderprofile und schneller Zugriff auf Einträge."
        : isPl
          ? "Profile dzieci i szybki dostęp do wpisów."
          : "Children profiles and quick access to records.",
    addChildLabel: isRu
      ? screenSpec.addChildCta.label
      : isDe
        ? "Kind hinzufügen"
        : isPl
          ? "Dodaj dziecko"
          : "Add child",
    cards: screenSpec.childrenCards.map((card, index) => ({
      nodeId: card.nodeId,
      name: card.info.nameText,
      stats: localizeFallbackStatsLabel(card.info.statsText, locale),
      isLocked: false,
      child: {
        id: card.nodeId,
        name: card.info.nameText,
        ageLabel: null,
        weightValue: "",
        heightValue: "",
        birthDate: null,
        babyModeEnabled: false,
        avatarKey: null,
        gender: null,
        allergies: null,
        notes: null,
      },
      avatarSource: avatarSequence[index % avatarSequence.length],
      quickActions: card.quickActions.map((action) =>
        mapQuickAction(action, quickActionByTitle),
      ),
    })),
    tabs: sourceTabs.map(
      (tab): MobileBottomTabItem => ({
        key: tab.key,
        label: tab.label,
        active: tab.key === activeTabKey,
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
  latestEntriesByChildId?: Record<
    string,
    { weightKg?: number | null; heightCm?: number | null } | undefined
  >,
  lockedChildIds: string[] = [],
): ChildCard[] {
  const lockedChildIdSet = new Set(lockedChildIds);
  const quickActionByTitle = buildQuickActionMap(locale);
  const fallbackQuickActions = screenSpec.childrenCards[0]?.quickActions ?? [];
  const buildApiQuickActions = (childId: string, babyModeEnabled: boolean) =>
    fallbackQuickActions
      .filter((action) => {
        const mapped = quickActionByTitle[action.title];

        if (!mapped) {
          return true;
        }

        if (!babyModeEnabled) {
          return mapped.kind !== "sleep" && mapped.kind !== "feeding";
        }

        return true;
      })
      .map((action) =>
        mapQuickAction(
          {
            ...action,
            nodeId: `${childId}:${action.nodeId}`,
          },
          quickActionByTitle,
        ),
      );

  return children.map((child, index) => {
    const latestMetrics = latestEntriesByChildId?.[child.id];
    const weightValue = formatWeightValue(latestMetrics?.weightKg, locale);
    const heightValue = formatHeightValue(latestMetrics?.heightCm, locale);

    return {
      nodeId: child.id,
      name: child.name,
      stats: buildCardStatsLabel(child, { weightValue, heightValue }, locale),
      isLocked: lockedChildIdSet.has(child.id),
      child: {
        id: child.id,
        name: child.name,
        ageLabel: child.ageLabel,
        weightValue,
        heightValue,
        birthDate: child.birthDate,
        babyModeEnabled: child.babyModeEnabled,
        avatarKey: child.avatarKey,
        gender: child.gender,
        allergies: child.allergies,
        notes: child.notes,
      },
      avatarSource: resolveAvatarSourceWithGender(
        child.avatarKey,
        child.gender,
        index,
      ),
      quickActions: buildApiQuickActions(child.id, child.babyModeEnabled),
    };
  });
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

export function resolveChildAccess(params: {
  children: Array<Pick<MobileChildSummary, "id">>;
  premiumActive: boolean;
}): ChildAccessState {
  if (params.premiumActive || params.children.length <= 1) {
    return {
      unlockedChildId: params.children[0]?.id ?? null,
      lockedChildIds: [],
    };
  }

  const unlockedChildId = params.children[0]?.id ?? null;

  return {
    unlockedChildId,
    lockedChildIds: params.children
      .slice(1)
      .map((child) => child.id),
  };
}
