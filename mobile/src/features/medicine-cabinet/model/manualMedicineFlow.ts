import { Ionicons } from "@expo/vector-icons";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type ManualCategory =
  | "oral"
  | "nose"
  | "throat"
  | "eyes"
  | "ears"
  | "skin"
  | "inhalation"
  | "other";

export type ManualCategoryOption = {
  value: ManualCategory;
  labelRu: string;
  labelEn: string;
  icon?: keyof typeof Ionicons.glyphMap;
  imageSource?: number;
  iconColor: string;
  activeBorderColor: string;
  cardBackgroundColor: string;
  cardActiveBackgroundColor: string;
  iconBackgroundColor: string;
  previewImageSource: number;
};

export const manualCategoryOptions: ManualCategoryOption[] = [
  {
    value: "oral",
    labelRu: "Внутрь",
    labelEn: "Oral",
    imageSource: require("../assets/categories/optimized/oral_category.png"),
    iconColor: "#F56565",
    activeBorderColor: "#F3B8AC",
    cardBackgroundColor: "#FFF7F4",
    cardActiveBackgroundColor: "#FFDCD3",
    iconBackgroundColor: "#FFE1DC",
    previewImageSource: require("../assets/forms/syrup_solution_spoon.png"),
  },
  {
    value: "nose",
    labelRu: "Нос",
    labelEn: "Nose",
    imageSource: require("../assets/categories/optimized/nose_category.png"),
    iconColor: "#4A90D9",
    activeBorderColor: "#BFDDF7",
    cardBackgroundColor: "#F6FBFF",
    cardActiveBackgroundColor: "#DDEEFF",
    iconBackgroundColor: "#E8F4FF",
    previewImageSource: require("../assets/forms/spray.png"),
  },
  {
    value: "throat",
    labelRu: "Горло",
    labelEn: "Throat",
    imageSource: require("../assets/categories/optimized/throat_category.png"),
    iconColor: "#8B6FE8",
    activeBorderColor: "#D6C6FB",
    cardBackgroundColor: "#FAF8FF",
    cardActiveBackgroundColor: "#E6DCFF",
    iconBackgroundColor: "#EEE7FF",
    previewImageSource: require("../assets/forms/pill_bottle.png"),
  },
  {
    value: "eyes",
    labelRu: "Глаза",
    labelEn: "Eyes",
    imageSource: require("../assets/categories/optimized/eyes_category.png"),
    iconColor: "#46B982",
    activeBorderColor: "#BFE8D2",
    cardBackgroundColor: "#F7FCF9",
    cardActiveBackgroundColor: "#DDF4E8",
    iconBackgroundColor: "#E7F7EF",
    previewImageSource: require("../assets/forms/drops.png"),
  },
  {
    value: "ears",
    labelRu: "Уши",
    labelEn: "Ears",
    imageSource: require("../assets/categories/optimized/ears_category.png"),
    iconColor: "#F59E42",
    activeBorderColor: "#F6D5A3",
    cardBackgroundColor: "#FFF9F0",
    cardActiveBackgroundColor: "#FFE8C2",
    iconBackgroundColor: "#FFF0D9",
    previewImageSource: require("../assets/forms/drops.png"),
  },
  {
    value: "skin",
    labelRu: "Кожа",
    labelEn: "Skin",
    imageSource: require("../assets/categories/optimized/skin_category.png"),
    iconColor: "#46B982",
    activeBorderColor: "#B9E6D5",
    cardBackgroundColor: "#F5FCF8",
    cardActiveBackgroundColor: "#D4F0E3",
    iconBackgroundColor: "#E7F7EF",
    previewImageSource: require("../assets/forms/ointment.png"),
  },
  {
    value: "inhalation",
    labelRu: "Ингаляция",
    labelEn: "Inhalation",
    imageSource: require("../assets/categories/optimized/inhalation_category.png"),
    iconColor: "#8B6FE8",
    activeBorderColor: "#D6C6FB",
    cardBackgroundColor: "#FAF8FF",
    cardActiveBackgroundColor: "#E6DCFF",
    iconBackgroundColor: "#EEE7FF",
    previewImageSource: require("../assets/forms/effervescent_solution.png"),
  },
  {
    value: "other",
    labelRu: "Другое",
    labelEn: "Other",
    icon: "ellipsis-horizontal",
    iconColor: "#8A94A6",
    activeBorderColor: "#D8CEC8",
    cardBackgroundColor: "#FBF9F7",
    cardActiveBackgroundColor: "#EEE7E1",
    iconBackgroundColor: "#F4F0EC",
    previewImageSource: require("../assets/forms/pill_organizer.png"),
  },
];

export function getManualCategoryLabel(
  category: ManualCategory | null,
  locale: MobileLocale,
) {
  const option = manualCategoryOptions.find((entry) => entry.value === category);
  if (!option) {
    if (locale === "ru") return "Категория не выбрана";
    if (locale === "de") return "Keine Kategorie";
    if (locale === "pl") return "Brak kategorii";
    return "No category yet";
  }

  if (locale === "ru") return option.labelRu;
  if (locale === "de") {
    if (option.value === "oral") return "Oral";
    if (option.value === "nose") return "Nase";
    if (option.value === "throat") return "Hals";
    if (option.value === "eyes") return "Augen";
    if (option.value === "ears") return "Ohren";
    if (option.value === "skin") return "Haut";
    if (option.value === "inhalation") return "Inhalation";
    return "Andere";
  }
  if (locale === "pl") {
    if (option.value === "oral") return "Doustnie";
    if (option.value === "nose") return "Nos";
    if (option.value === "throat") return "Gardło";
    if (option.value === "eyes") return "Oczy";
    if (option.value === "ears") return "Uszy";
    if (option.value === "skin") return "Skóra";
    if (option.value === "inhalation") return "Inhalacja";
    return "Inne";
  }
  return option.labelEn;
}

export function getManualCategoryPreviewImageSource(
  category: ManualCategory | null,
) {
  return (
    manualCategoryOptions.find((entry) => entry.value === category)?.previewImageSource ??
    require("../assets/forms/pill_organizer.png")
  );
}

export function getManualCategoryStorageValue(
  category: ManualCategory | null,
) {
  const option = manualCategoryOptions.find((entry) => entry.value === category);
  return option?.labelRu.trim().toLowerCase() ?? null;
}

export function getManualCategoryFormValue(category: ManualCategory | null) {
  switch (category) {
    case "oral":
      return "сироп";
    case "nose":
      return "спрей";
    case "throat":
      return "спрей";
    case "eyes":
      return "капли";
    case "ears":
      return "капли";
    case "skin":
      return "мазь";
    case "inhalation":
      return "ингалятор";
    case "other":
      return "не указано";
    default:
      return "не указано";
  }
}
