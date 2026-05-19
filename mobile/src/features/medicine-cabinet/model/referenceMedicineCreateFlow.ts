import type { MobileMedicineCatalogItem } from "../api/mobileMedicineCatalogApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export type ReferenceCategoryKey =
  | "all"
  | "temperature_pain"
  | "cold_cough"
  | "nose_throat"
  | "allergy"
  | "gut"
  | "eyes"
  | "ears"
  | "skin_wounds";

export type ReferenceCreateStep = "search" | "storage";

const referenceCategoryTemplates: Array<{
  key: ReferenceCategoryKey;
  label: string;
  imageSource?: number;
  backgroundColor: string;
  activeBackgroundColor: string;
  borderColor: string;
  textColor: string;
  activeTextColor: string;
}> = [
  {
    key: "all",
    label: "All",
    backgroundColor: "#FBF8FF",
    activeBackgroundColor: "#E7DEFF",
    borderColor: "#DCCFF8",
    textColor: "#7D6CCF",
    activeTextColor: "#5E4FB5",
  },
  {
    key: "temperature_pain",
    label: "Fever and pain",
    imageSource: require("../assets/reference-categories/optimized/temperature_pain_category.png"),
    backgroundColor: "#FFF4EE",
    activeBackgroundColor: "#FFDCD3",
    borderColor: "#F3C2B6",
    textColor: "#D7644F",
    activeTextColor: "#B94E3B",
  },
  {
    key: "cold_cough",
    label: "Cold and cough",
    imageSource: require("../assets/reference-categories/optimized/cold_cough_category.png"),
    backgroundColor: "#F5F9FF",
    activeBackgroundColor: "#DCEBFF",
    borderColor: "#C7DCF8",
    textColor: "#4A78B8",
    activeTextColor: "#355C93",
  },
  {
    key: "nose_throat",
    label: "Nose and throat",
    imageSource: require("../assets/reference-categories/optimized/nose_throat_category.png"),
    backgroundColor: "#EFF7FF",
    activeBackgroundColor: "#D6EAFF",
    borderColor: "#B7D6F3",
    textColor: "#4E83C5",
    activeTextColor: "#3568A6",
  },
  {
    key: "allergy",
    label: "Allergy",
    imageSource: require("../assets/reference-categories/optimized/allergy_category.png"),
    backgroundColor: "#FFF8EA",
    activeBackgroundColor: "#FFE9BD",
    borderColor: "#F3D9A3",
    textColor: "#C28B2C",
    activeTextColor: "#9E6F14",
  },
  {
    key: "gut",
    label: "Gut",
    imageSource: require("../assets/reference-categories/optimized/gut_category.png"),
    backgroundColor: "#FFF6EF",
    activeBackgroundColor: "#FFE1CF",
    borderColor: "#F2CFB9",
    textColor: "#B86A4C",
    activeTextColor: "#96543A",
  },
  {
    key: "eyes",
    label: "Eyes",
    imageSource: require("../assets/reference-categories/optimized/eyes_category.png"),
    backgroundColor: "#F2FBF7",
    activeBackgroundColor: "#D8F1E4",
    borderColor: "#BFE4D1",
    textColor: "#408B6A",
    activeTextColor: "#2E6F53",
  },
  {
    key: "ears",
    label: "Ears",
    imageSource: require("../assets/reference-categories/optimized/ears_category.png"),
    backgroundColor: "#FFF8EF",
    activeBackgroundColor: "#FFE5CC",
    borderColor: "#F3D3AF",
    textColor: "#BD7A34",
    activeTextColor: "#955B1D",
  },
  {
    key: "skin_wounds",
    label: "Skin and wounds",
    imageSource: require("../assets/reference-categories/optimized/skin_wounds_category.png"),
    backgroundColor: "#F5FCF8",
    activeBackgroundColor: "#D7EFE3",
    borderColor: "#BDDCCB",
    textColor: "#4A8A66",
    activeTextColor: "#2E6A4A",
  },
];

function getReferenceCategoryLabel(
  key: ReferenceCategoryKey,
  locale: MobileLocale,
) {
  if (key === "all") {
    return locale === "ru"
      ? "Все"
      : locale === "de"
        ? "Alle"
        : locale === "pl"
          ? "Wszystkie"
          : "All";
  }
  if (key === "temperature_pain") {
    return locale === "ru"
      ? "Температура и боль"
      : locale === "de"
        ? "Fieber und Schmerz"
        : locale === "pl"
          ? "Gorączka i ból"
          : "Fever and pain";
  }
  if (key === "cold_cough") {
    return locale === "ru"
      ? "Простуда и кашель"
      : locale === "de"
        ? "Erkältung und Husten"
        : locale === "pl"
          ? "Przeziębienie i kaszel"
          : "Cold and cough";
  }
  if (key === "nose_throat") {
    return locale === "ru"
      ? "Нос и горло"
      : locale === "de"
        ? "Nase und Hals"
        : locale === "pl"
          ? "Nos i gardło"
          : "Nose and throat";
  }
  if (key === "allergy") {
    return locale === "ru"
      ? "Аллергия"
      : locale === "de"
        ? "Allergie"
        : locale === "pl"
          ? "Alergia"
          : "Allergy";
  }
  if (key === "gut") {
    return locale === "ru"
      ? "ЖКТ"
      : locale === "de"
        ? "Magen-Darm"
        : locale === "pl"
          ? "Jelita"
          : "Gut";
  }
  if (key === "eyes") {
    return locale === "ru"
      ? "Глаза"
      : locale === "de"
        ? "Augen"
        : locale === "pl"
          ? "Oczy"
          : "Eyes";
  }
  if (key === "ears") {
    return locale === "ru"
      ? "Уши"
      : locale === "de"
        ? "Ohren"
        : locale === "pl"
          ? "Uszy"
          : "Ears";
  }
  return locale === "ru"
    ? "Кожа и раны"
    : locale === "de"
      ? "Haut und Wunden"
      : locale === "pl"
        ? "Skóra i rany"
        : "Skin and wounds";
}

export function getReferenceCategories(locale: MobileLocale) {
  return referenceCategoryTemplates.map((category) => ({
    ...category,
    label: getReferenceCategoryLabel(category.key, locale),
  }));
}

const GUT_CATEGORY_KEYWORDS = [
  "живот",
  "stomach",
  "изжог",
  "heartburn",
  "reflux",
  "antacid",
  "омепраз",
  "omepraz",
  "фамотид",
  "famotid",
  "симетик",
  "simeth",
  "gas",
  "bloating",
  "кальция карбонат",
  "calcium carbonate",
  "понос",
  "diarr",
  "лоперам",
  "loperam",
  "регидрат",
  "rehydra",
  "ors",
  "oral rehydr",
  "висмут",
  "bismuth",
  "запор",
  "constip",
  "лактул",
  "lactul",
  "бисакод",
  "bisacod",
  "сенна",
  "senna",
  "полиэтиленглик",
  "polyethylene glycol",
  "peg",
  "тошнот",
  "nause",
  "рвот",
  "vomit",
  "ондансет",
  "ondanset",
  "меклиз",
  "mecliz",
  "дименгидр",
  "dimenhydr",
  "motion sickness",
];

function normalizeReferenceText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function hasReferenceKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getReferenceCategoryMatch(
  item: MobileMedicineCatalogItem,
  category: ReferenceCategoryKey,
): boolean {
  if (category === "all") {
    return true;
  }

  const haystack = [
    item.name,
    item.form,
    item.concentration ?? "",
    item.description ?? "",
    item.dosage ?? "",
  ]
    .map(normalizeReferenceText)
    .join(" ");

  switch (category) {
    case "temperature_pain":
      return hasReferenceKeyword(haystack, [
        "парацет",
        "acetamin",
        "paracetam",
        "ибупроф",
        "ibuprofen",
        "нуроф",
        "aspirin",
        "аспирин",
        "naprox",
        "напрокс",
        "ketorol",
        "кеторол",
        "diclofen",
        "диклоф",
        "fever",
        "температ",
        "жар",
        "лихорад",
        "pain",
        "боль",
        "головн",
        "migraine",
        "мигрен",
        "analges",
        "обезбол",
        "antipyret",
        "жаропониж",
        "headache",
      ]);
    case "cold_cough":
      return hasReferenceKeyword(haystack, [
        "каш",
        "cough",
        "простуд",
        "cold",
        "flu",
        "грип",
        "dextrometh",
        "декстрометорф",
        "guaifen",
        "гвайфен",
        "benzonat",
        "бензонатат",
        "oseltam",
      ]);
    case "nose_throat":
      return hasReferenceKeyword(haystack, [
        "нос",
        "горл",
        "nasal",
        "throat",
        "saline",
        "солев",
        "phenylephrine",
        "фенилэф",
        "pseudoephed",
        "псевдоэф",
        "oxymetaz",
        "оксиметаз",
        "fluticas",
        "флутиказ",
        "mometas",
        "мометаз",
        "спрей",
        "spray",
        "леден",
        "lozen",
        "menthol",
        "ментол",
        "phenol",
      ]);
    case "allergy":
      return hasReferenceKeyword(haystack, [
        "аллер",
        "allerg",
        "антигист",
        "цетириз",
        "cetiriz",
        "лоратад",
        "loratad",
        "дифенгид",
        "diphenhyd",
        "азеласт",
        "azelast",
        "кетотиф",
        "ketotif",
        "олопат",
        "olopat",
      ]);
    case "gut":
      return hasReferenceKeyword(haystack, GUT_CATEGORY_KEYWORDS);
    case "eyes":
      return hasReferenceKeyword(haystack, [
        "глаз",
        "eye",
        "ophthalm",
        "ketotif",
        "кетотиф",
        "olopat",
        "олопат",
      ]);
    case "ears":
      return hasReferenceKeyword(haystack, [
        "ух",
        "ear",
        "otic",
        "benzocaine",
        "антипирин",
      ]);
    case "skin_wounds":
      return hasReferenceKeyword(haystack, [
        "кожа",
        "skin",
        "рана",
        "wound",
        "ожог",
        "burn",
        "маз",
        "cream",
        "крем",
        "гель",
        "gel",
        "хлоргекс",
        "chlorhex",
        "бацитр",
        "bacitr",
        "мупиро",
        "mupiro",
        "гидрокорт",
        "hydrocort",
        "клотрим",
        "clotrim",
        "миконаз",
        "micona",
      ]);
  }
}
