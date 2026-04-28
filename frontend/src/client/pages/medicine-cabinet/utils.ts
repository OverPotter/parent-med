import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { formatDate, getLocalIsoDate } from "@shared/utils/date";
import { tCabinet, type CabinetCopyKey } from "./copy";

type DoseCalcSource = {
  pediatricDoseMgPerKgMin?: number | null;
  pediatricDoseMgPerKgMax?: number | null;
};

export function isExpiredDate(value: string): boolean {
  if (!value) return false;
  const today = getLocalIsoDate();
  return value < today;
}

export function toOpenedShelfDaysOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.floor(parsed);
  if (rounded < 1 || rounded > 3650) return null;
  return rounded;
}

export function hasUnknownOpenedShelfLife(openedAt: string, openedShelfDays: string): boolean {
  return Boolean(openedAt && !openedShelfDays);
}

export function formatDoseCalcValue(source: DoseCalcSource, language: AppLanguage): string | null {
  const minDose = source.pediatricDoseMgPerKgMin ?? null;
  const maxDose = source.pediatricDoseMgPerKgMax ?? null;

  if (minDose == null && maxDose == null) {
    return null;
  }

  const formatValue = (value: number) =>
    new Intl.NumberFormat(language === "ru" ? "ru-RU" : "en-US", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);

  if (minDose != null && maxDose != null && Math.abs(minDose - maxDose) > 0.001) {
    return `${formatValue(minDose)}-${formatValue(maxDose)} ${
      language === "ru" ? "мг/кг" : "mg/kg"
    }`;
  }

  return `${formatValue(maxDose ?? minDose ?? 0)} ${language === "ru" ? "мг/кг" : "mg/kg"}`;
}

export function getManualMedicineCategoryOptions(language: AppLanguage) {
  return [
    { value: "внутрь", label: language === "ru" ? "Внутрь" : "Oral" },
    { value: "нос", label: language === "ru" ? "Нос" : "Nose" },
    { value: "горло", label: language === "ru" ? "Горло" : "Throat" },
    { value: "глаза", label: language === "ru" ? "Глаза" : "Eyes" },
    { value: "уши", label: language === "ru" ? "Уши" : "Ears" },
    { value: "кожа", label: language === "ru" ? "Кожа" : "Skin" },
    { value: "ингаляция", label: language === "ru" ? "Ингаляция" : "Inhalation" },
    { value: "другое", label: language === "ru" ? "Другое" : "Other" },
  ];
}

export type MedicineCatalogCategory =
  | ""
  | "temperature_pain"
  | "cold_cough"
  | "nose_throat"
  | "allergy"
  | "stomach"
  | "diarrhea"
  | "constipation"
  | "nausea"
  | "eyes"
  | "ears"
  | "skin_wounds";

export function getMedicineCatalogCategoryOptions(language: AppLanguage) {
  return language === "ru"
    ? [
        { value: "", label: "Все" },
        { value: "temperature_pain", label: "Температура и боль" },
        { value: "cold_cough", label: "Простуда и кашель" },
        { value: "nose_throat", label: "Нос и горло" },
        { value: "allergy", label: "Аллергия" },
        { value: "stomach", label: "Живот" },
        { value: "diarrhea", label: "Понос" },
        { value: "constipation", label: "Запор" },
        { value: "nausea", label: "Тошнота" },
        { value: "eyes", label: "Глаза" },
        { value: "ears", label: "Уши" },
        { value: "skin_wounds", label: "Кожа и раны" },
      ]
    : [
        { value: "", label: "All" },
        { value: "temperature_pain", label: "Fever and pain" },
        { value: "cold_cough", label: "Cold and cough" },
        { value: "nose_throat", label: "Nose and throat" },
        { value: "allergy", label: "Allergy" },
        { value: "stomach", label: "Stomach" },
        { value: "diarrhea", label: "Diarrhea" },
        { value: "constipation", label: "Constipation" },
        { value: "nausea", label: "Nausea" },
        { value: "eyes", label: "Eyes" },
        { value: "ears", label: "Ears" },
        { value: "skin_wounds", label: "Skin and wounds" },
      ];
}

function normalizeMedicineCatalogText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function hasKeywordMatch(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getMedicineCatalogCategoryMatch(
  item: {
    name: string;
    form: string;
    concentration?: string | null;
    description?: string | null;
    dosage?: string | null;
  },
  category: MedicineCatalogCategory
) {
  if (!category) {
    return true;
  }

  const text = [
    item.name,
    item.form,
    item.concentration ?? "",
    item.description ?? "",
    item.dosage ?? "",
  ]
    .map(normalizeMedicineCatalogText)
    .join(" ");

  switch (category) {
    case "temperature_pain":
      return hasKeywordMatch(text, [
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
      return hasKeywordMatch(text, [
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
      return hasKeywordMatch(text, [
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
      return hasKeywordMatch(text, [
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
    case "stomach":
      return hasKeywordMatch(text, [
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
      ]);
    case "diarrhea":
      return hasKeywordMatch(text, [
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
      ]);
    case "constipation":
      return hasKeywordMatch(text, [
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
      ]);
    case "nausea":
      return hasKeywordMatch(text, [
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
      ]);
    case "eyes":
      return hasKeywordMatch(text, [
        "глаз",
        "eye",
        "ophthalm",
        "ketotif",
        "кетотиф",
        "olopat",
        "олопат",
      ]);
    case "ears":
      return hasKeywordMatch(text, ["ух", "ear", "otic", "benzocaine", "антипирин"]);
    case "skin_wounds":
      return hasKeywordMatch(text, [
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

export function getLocalizedMedicineForm(value: string, language: AppLanguage): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return value;
  }

  const knownForms: Record<string, CabinetCopyKey> = {
    внутрь: "manualCategoryOral",
    oral: "manualCategoryOral",
    нос: "manualCategoryNose",
    nose: "manualCategoryNose",
    горло: "manualCategoryThroat",
    throat: "manualCategoryThroat",
    глаза: "manualCategoryEyes",
    eyes: "manualCategoryEyes",
    уши: "manualCategoryEars",
    ears: "manualCategoryEars",
    кожа: "manualCategorySkin",
    skin: "manualCategorySkin",
    ингаляция: "manualCategoryInhalation",
    inhalation: "manualCategoryInhalation",
    другое: "manualCategoryOther",
    other: "manualCategoryOther",
    таблетки: "tablets",
    capsules: "capsules",
    капсулы: "capsules",
    syrup: "syrup",
    сироп: "syrup",
    капли: "drops",
    drops: "drops",
    spray: "sprays",
    sprays: "sprays",
    спрей: "sprays",
    спреи: "sprays",
    суспензия: "suspension",
    suspension: "suspension",
    раствор: "solution",
    solution: "solution",
    ointment: "ointments",
    ointments: "ointments",
    мазь: "ointments",
    мази: "ointments",
    суппозитории: "suppositories",
    suppositories: "suppositories",
  };

  const matchedKey = knownForms[normalized];
  return matchedKey ? tCabinet(language, matchedKey) : value;
}

export function getMedicineStatusDotClass(medicine: HouseholdMedicine): string {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return "bg-[color:color-mix(in_srgb,var(--color-danger)_82%,#ef4444_18%)]";
  }

  if (!medicine.openedAt) {
    return "bg-[color:color-mix(in_srgb,var(--color-info)_74%,var(--color-primary)_26%)]";
  }

  if (medicine.status === "expiring_soon" || medicine.status === "expiring_after_opening") {
    return "bg-[color:color-mix(in_srgb,var(--color-warning)_78%,var(--color-primary)_22%)]";
  }

  return "bg-[color:color-mix(in_srgb,var(--color-success)_82%,var(--color-primary)_18%)]";
}

export function getMedicineStatusDateClass(medicine: HouseholdMedicine): string {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return "text-[color:color-mix(in_srgb,var(--color-danger)_88%,var(--color-foreground)_12%)]";
  }

  if (medicine.status === "expiring_soon" || medicine.status === "expiring_after_opening") {
    return "text-[color:color-mix(in_srgb,var(--color-warning)_78%,var(--color-foreground)_22%)]";
  }

  return "text-foreground";
}

export function getStatusDateText(medicine: HouseholdMedicine, language: AppLanguage): string {
  if (
    (medicine.status === "expired_after_opening" || medicine.status === "expiring_after_opening") &&
    medicine.openedExpiresAt
  ) {
    return tCabinet(language, "untilOpened", {
      date: formatDate(medicine.openedExpiresAt),
    });
  }

  return tCabinet(language, "untilExpiry", { date: formatDate(medicine.expiryDate) });
}

export function getMedicineStatusLabel(medicine: HouseholdMedicine, language: AppLanguage): string {
  if (medicine.status === "expired" || medicine.status === "expired_after_opening") {
    return tCabinet(language, "statusExpired");
  }

  if (!medicine.openedAt) {
    return tCabinet(language, "statusCheckOpened");
  }

  if (medicine.status === "expiring_soon" || medicine.status === "expiring_after_opening") {
    return tCabinet(language, "statusExpiringSoon");
  }

  return tCabinet(language, "statusOk");
}
