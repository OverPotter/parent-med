import { ImageSourcePropType } from "react-native";
import { MobileLocale, TranslationTree } from "../../../shared/i18n/mobileI18n";
import { ChildCard } from "../../children/model/childrenRedesign";

export type ChildProfileEditContent = {
  backLabel: string;
  title: string;
  subtitle: string;
  childName: string;
  childMeta: string;
  changePhotoLabel: string;
  avatarSource: ImageSourcePropType;
  sections: {
    main: {
      title: string;
      rows: Array<{
        id: string;
        label: string;
        value: string;
      }>;
    };
    health: {
      title: string;
      rows: Array<{
        id: string;
        label: string;
        description: string;
      }>;
    };
    settings: {
      title: string;
      rows: Array<{
        id: string;
        label: string;
        description: string;
        enabled: boolean;
      }>;
    };
  };
  actions: {
    save: string;
    delete: string;
  };
};

function getAgeValue(statsText: string) {
  return (
    statsText
      .split("•")
      .map((item) => item.trim())
      .filter(Boolean)[0] ?? "—"
  );
}

export function buildChildProfileEditContent(
  child: ChildCard,
  locale: MobileLocale,
  copy: TranslationTree,
): ChildProfileEditContent {
  const ageValue = getAgeValue(child.stats);
  const birthDate = copy.editProfileScreen.values.birthDate;

  return {
    backLabel: copy.editProfileScreen.backToProfile,
    title: copy.editProfileScreen.title,
    subtitle:
      locale === "ru"
        ? `Основные данные и настройки ${child.name}.`
        : locale === "pl"
          ? `Podstawowe dane i ustawienia ${child.name}.`
          : locale === "de"
            ? `Grunddaten und Einstellungen von ${child.name}.`
          : `Core details and ${child.name}'s settings.`,
    childName: child.name,
    childMeta: `${ageValue} • ${birthDate}`,
    changePhotoLabel: copy.editProfileScreen.changePhoto,
    avatarSource: child.avatarSource,
    sections: {
      main: {
        title: copy.editProfileScreen.sections.main,
        rows: [
          {
            id: "childName",
            label: copy.editProfileScreen.rows.childName,
            value: child.name,
          },
          {
            id: "birthDate",
            label: copy.editProfileScreen.rows.birthDate,
            value: birthDate,
          },
        ],
      },
      health: {
        title: copy.editProfileScreen.sections.health,
        rows: [
          {
            id: "allergies",
            label: copy.editProfileScreen.rows.allergies,
            description: copy.editProfileScreen.descriptions.allergies,
          },
          {
            id: "notes",
            label: copy.editProfileScreen.rows.notes,
            description: copy.editProfileScreen.descriptions.notes,
          },
        ],
      },
      settings: {
        title: copy.editProfileScreen.sections.settings,
        rows: [
          {
            id: "babyMode",
            label: copy.editProfileScreen.rows.babyMode,
            description: copy.editProfileScreen.descriptions.babyMode,
            enabled: true,
          },
          {
            id: "liveActivity",
            label: copy.editProfileScreen.rows.liveActivity,
            description: copy.editProfileScreen.descriptions.liveActivity,
            enabled: true,
          },
        ],
      },
    },
    actions: copy.editProfileScreen.actions,
  };
}
