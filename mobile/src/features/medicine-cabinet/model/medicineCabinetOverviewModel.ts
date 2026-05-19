import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import type { MobileHouseholdMedicine } from "../api/mobileHouseholdMedicinesApi";

export type CabinetFilterKey = "expired" | "attention" | "ready" | "all";

export type CabinetTag = {
  text: string;
  backgroundColor: string;
  textColor: string;
};

export type MedicineCardItem = {
  id: string;
  title: string;
  subtitle: string;
  medicineForm?: string | null;
  medicineCategory?: string | null;
  concentration?: string | null;
  artBackgroundColor: string;
  tags: CabinetTag[];
  statusText: string;
  statusBackgroundColor: string;
  statusTextColor: string;
  cabinetStatus: "ready" | "attention" | "expired";
  description?: string | null;
  dosage?: string | null;
  comment?: string | null;
  expiryLabel?: string | null;
  openedLabel?: string | null;
  afterOpeningLabel?: string | null;
  raw: MobileHouseholdMedicine;
};

export type SummaryStat = {
  key: CabinetFilterKey;
  value: string;
  title: string;
  hint: string;
  backgroundColor: string;
  activeBackgroundColor: string;
  activeBorderColor: string;
  iconSource: number;
};

const summaryStatTemplates: Omit<SummaryStat, "value">[] = [
  {
    key: "all",
    title: "All",
    hint: "Full list of home medicines",
    backgroundColor: "#F1EBFF",
    activeBackgroundColor: "#E3D8FF",
    activeBorderColor: "#D1BFFB",
    iconSource: require("../assets/summary/medicine_box_ui.png"),
  },
  {
    key: "ready",
    title: "Ready",
    hint: "Currently look safe",
    backgroundColor: "#EEF9F3",
    activeBackgroundColor: "#DDF3E7",
    activeBorderColor: "#BCE4CE",
    iconSource: require("../assets/summary/check_success_ui.png"),
  },
  {
    key: "attention",
    title: "Check",
    hint: "Expiry is coming up",
    backgroundColor: "#FFF3E6",
    activeBackgroundColor: "#FFE4C8",
    activeBorderColor: "#F6D0A0",
    iconSource: require("../assets/summary/need_check_ui.png"),
  },
  {
    key: "expired",
    title: "Expired",
    hint: "Packs past their expiry date",
    backgroundColor: "#FFF0F0",
    activeBackgroundColor: "#FFDCDC",
    activeBorderColor: "#F0B1B1",
    iconSource: require("../assets/summary/warning_ui.png"),
  },
];

function getCabinetStatTitle(
  key: CabinetFilterKey,
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
  if (key === "ready") {
    return locale === "ru"
      ? "Можно"
      : locale === "de"
        ? "Okay"
        : locale === "pl"
          ? "Można"
          : "Ready";
  }
  if (key === "attention") {
    return locale === "ru"
      ? "Проверить"
      : locale === "de"
        ? "Prüfen"
        : locale === "pl"
          ? "Sprawdź"
          : "Check";
  }
  return locale === "ru"
    ? "Просрочено"
    : locale === "de"
      ? "Abgelaufen"
      : locale === "pl"
        ? "Przetermin."
        : "Expired";
}

function getCabinetStatHint(
  key: CabinetFilterKey,
  locale: MobileLocale,
) {
  if (key === "all") {
    return locale === "ru"
      ? "Полный список домашних препаратов"
      : locale === "de"
        ? "Alle Medikamente zu Hause"
        : locale === "pl"
          ? "Pełna lista domowych leków"
          : "Full list of home medicines";
  }
  if (key === "ready") {
    return locale === "ru"
      ? "Сейчас выглядят безопасными"
      : locale === "de"
        ? "Wirken derzeit unbedenklich"
        : locale === "pl"
          ? "Obecnie wyglądają bezpiecznie"
          : "Currently look safe";
  }
  if (key === "attention") {
    return locale === "ru"
      ? "Срок подходит к концу"
      : locale === "de"
        ? "Ablaufdatum nähert sich"
        : locale === "pl"
          ? "Termin wkrótce upływa"
          : "Expiry is coming up";
  }
  return locale === "ru"
    ? "Упаковки с истекшим сроком"
    : locale === "de"
      ? "Packungen mit abgelaufenem Datum"
      : locale === "pl"
        ? "Opakowania po terminie"
        : "Packs past their expiry date";
}

function getDateLocale(locale: MobileLocale) {
  if (locale === "ru") return "ru-RU";
  if (locale === "de") return "de-DE";
  if (locale === "pl") return "pl-PL";
  return "en-US";
}

function formatCabinetDate(
  value: string | null | undefined,
  locale: MobileLocale,
) {
  if (!value) {
    return null;
  }

  const normalized = value.slice(0, 10);
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(getDateLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatOpenedRelative(
  value: string | null | undefined,
  locale: MobileLocale,
) {
  if (!value) {
    return null;
  }

  const openedAt = new Date(value);
  if (Number.isNaN(openedAt.getTime())) {
    return null;
  }

  const today = new Date();
  const diffMs = today.getTime() - openedAt.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (diffDays === 0) {
    if (locale === "ru") return "Открыт сегодня";
    if (locale === "de") return "Heute geöffnet";
    if (locale === "pl") return "Otwarto dziś";
    return "Opened today";
  }
  if (diffDays === 1) {
    if (locale === "ru") return "Открыт вчера";
    if (locale === "de") return "Gestern geöffnet";
    if (locale === "pl") return "Otwarto wczoraj";
    return "Opened yesterday";
  }
  if (locale === "ru") return `Открыт ${diffDays} дн. назад`;
  if (locale === "de") return `Vor ${diffDays} Tg. geöffnet`;
  if (locale === "pl") return `Otwarto ${diffDays} dni temu`;
  return `Opened ${diffDays}d ago`;
}

function capitalizeText(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function isExpiredStatus(status: string) {
  return status === "expired" || status === "expired_after_opening";
}

function isAttentionStatus(status: string) {
  return status === "expiring_soon" || status === "expiring_after_opening";
}

export function getDefaultCabinetFilter(
  medicines: MobileHouseholdMedicine[],
): CabinetFilterKey {
  void medicines;
  return "all";
}

export function buildCabinetSummaryStats(
  medicines: MobileHouseholdMedicine[],
  locale: MobileLocale,
): SummaryStat[] {
  const expiredCount = medicines.filter((medicine) =>
    isExpiredStatus(medicine.status),
  ).length;
  const attentionCount = medicines.filter((medicine) =>
    isAttentionStatus(medicine.status),
  ).length;
  const readyCount = medicines.filter(
    (medicine) =>
      !isExpiredStatus(medicine.status) && !isAttentionStatus(medicine.status),
  ).length;

  const values: Record<CabinetFilterKey, number> = {
    expired: expiredCount,
    attention: attentionCount,
    ready: readyCount,
    all: medicines.length,
  };

  return summaryStatTemplates.map((stat) => ({
    ...stat,
    title: getCabinetStatTitle(stat.key, locale),
    hint: getCabinetStatHint(stat.key, locale),
    value: String(values[stat.key]),
  }));
}

function getMedicineCardStatus(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
): Pick<
  MedicineCardItem,
  "cabinetStatus" | "statusText" | "statusBackgroundColor" | "statusTextColor"
> {
  if (isExpiredStatus(medicine.status)) {
    return {
      cabinetStatus: "expired",
      statusText:
        locale === "ru"
          ? "Просрочен"
          : locale === "de"
            ? "Abgelaufen"
            : locale === "pl"
              ? "Przetermin."
              : "Expired",
      statusBackgroundColor: "#FFE1E1",
      statusTextColor: "#E85D5D",
    };
  }

  if (isAttentionStatus(medicine.status)) {
    return {
      cabinetStatus: "attention",
      statusText:
        locale === "ru"
          ? "Проверить"
          : locale === "de"
            ? "Prüfen"
            : locale === "pl"
              ? "Sprawdź"
              : "Check",
      statusBackgroundColor: "#FFF0D9",
      statusTextColor: "#D77A16",
    };
  }

  if (!medicine.openedAt) {
    return {
      cabinetStatus: "ready",
      statusText:
        locale === "ru"
          ? "Не вскрыт"
          : locale === "de"
            ? "Ungeöffnet"
            : locale === "pl"
              ? "Nieotwarty"
              : "Unopened",
      statusBackgroundColor: "#EEF5FF",
      statusTextColor: "#4A90D9",
    };
  }

  return {
    cabinetStatus: "ready",
    statusText:
      locale === "ru"
        ? "Можно"
        : locale === "de"
          ? "Okay"
          : locale === "pl"
            ? "Można"
            : "Ready",
    statusBackgroundColor: "#E7F7EF",
    statusTextColor: "#1F8A5B",
  };
}

function getMedicineArtBackgroundColor(medicineForm?: string | null) {
  const normalizedForm = medicineForm?.trim().toLowerCase() ?? "";

  if (normalizedForm.includes("сироп") || normalizedForm.includes("суспенз")) {
    return "#F1EBFF";
  }
  if (normalizedForm.includes("спрей") || normalizedForm.includes("ингал")) {
    return "#E8F5FF";
  }
  if (
    normalizedForm.includes("маз") ||
    normalizedForm.includes("крем") ||
    normalizedForm.includes("гель") ||
    normalizedForm.includes("лосьон")
  ) {
    return "#FFF1E8";
  }
  if (normalizedForm.includes("таблет") || normalizedForm.includes("капсул")) {
    return "#EAF7F0";
  }
  return "#F6F0FF";
}

function getMedicineTags(medicine: MobileHouseholdMedicine): CabinetTag[] {
  const category = capitalizeText(medicine.medicineCategory);
  if (!category) {
    return [];
  }

  return [
    {
      text: category,
      backgroundColor: "#EEE7FF",
      textColor: "#7A63D6",
    },
  ];
}

function getMedicineSubtitle(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
) {
  const openedRelative = formatOpenedRelative(medicine.openedAt, locale);
  if (openedRelative) {
    return openedRelative;
  }

  if (isExpiredStatus(medicine.status)) {
    const expiryLabel =
      formatCabinetDate(medicine.expiryDate, locale) ?? medicine.expiryDate;
    if (locale === "ru") return `Срок до ${expiryLabel}`;
    if (locale === "de") return `Haltbar bis ${expiryLabel}`;
    if (locale === "pl") return `Termin do ${expiryLabel}`;
    return `Expires ${expiryLabel}`;
  }

  if (locale === "ru") return "Не вскрыт";
  if (locale === "de") return "Ungeöffnet";
  if (locale === "pl") return "Nieotwarty";
  return "Unopened";
}

function getMedicineExpiryLabel(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
) {
  const expiryDate = formatCabinetDate(medicine.expiryDate, locale);
  if (!expiryDate) {
    return null;
  }
  if (locale === "ru") return `До ${expiryDate}`;
  if (locale === "de") return `Bis ${expiryDate}`;
  if (locale === "pl") return `Do ${expiryDate}`;
  return `By ${expiryDate}`;
}

function getMedicineOpenedLabel(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
) {
  const openedAt = formatCabinetDate(medicine.openedAt, locale);
  if (!openedAt) {
    return null;
  }
  if (locale === "ru") return `Вскрыт ${openedAt}`;
  if (locale === "de") return `Geöffnet ${openedAt}`;
  if (locale === "pl") return `Otwarto ${openedAt}`;
  return `Opened ${openedAt}`;
}

function getMedicineAfterOpeningLabel(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
) {
  if (medicine.openedExpiresAt) {
    const openedExpiryDate = formatCabinetDate(
      medicine.openedExpiresAt,
      locale,
    );
    if (openedExpiryDate) {
      if (locale === "ru") return `До ${openedExpiryDate}`;
      if (locale === "de") return `Bis ${openedExpiryDate}`;
      if (locale === "pl") return `Do ${openedExpiryDate}`;
      return `By ${openedExpiryDate}`;
    }
  }

  if (medicine.effectiveOpenedShelfDays) {
    if (locale === "ru") return `${medicine.effectiveOpenedShelfDays} дн.`;
    if (locale === "de") return `${medicine.effectiveOpenedShelfDays} Tg.`;
    if (locale === "pl") return `${medicine.effectiveOpenedShelfDays} dni`;
    return `${medicine.effectiveOpenedShelfDays} days`;
  }

  return null;
}

export function toMedicineCardItem(
  medicine: MobileHouseholdMedicine,
  locale: MobileLocale,
): MedicineCardItem {
  return {
    id: medicine.id,
    title: medicine.medicineName,
    subtitle: getMedicineSubtitle(medicine, locale),
    medicineForm: medicine.medicineForm,
    medicineCategory: medicine.medicineCategory,
    concentration: medicine.medicineConcentration,
    artBackgroundColor: getMedicineArtBackgroundColor(medicine.medicineForm),
    tags: getMedicineTags(medicine),
    ...getMedicineCardStatus(medicine, locale),
    description: medicine.medicineDescription,
    dosage: medicine.medicineDosage,
    comment: medicine.comment,
    expiryLabel: getMedicineExpiryLabel(medicine, locale),
    openedLabel: getMedicineOpenedLabel(medicine, locale),
    afterOpeningLabel: getMedicineAfterOpeningLabel(medicine, locale),
    raw: medicine,
  };
}

export function resolveMedicineFormIcon(medicineForm?: string | null) {
  const normalizedForm = medicineForm?.trim().toLowerCase() ?? "";

  if (!normalizedForm) {
    return require("../assets/forms/pill_organizer.png");
  }

  if (normalizedForm.includes("капсул") || normalizedForm.includes("caplet")) {
    return require("../assets/forms/capsules_tablets.png");
  }

  if (normalizedForm.includes("таблет") || normalizedForm.includes("жевательн")) {
    return require("../assets/forms/blister_tablets.png");
  }

  if (normalizedForm.includes("сироп") || normalizedForm.includes("суспенз")) {
    return require("../assets/forms/syrup_solution_spoon.png");
  }

  if (normalizedForm.includes("спрей")) {
    return require("../assets/forms/spray.png");
  }

  if (normalizedForm.includes("капл")) {
    return require("../assets/forms/drops.png");
  }

  if (
    normalizedForm.includes("маз") ||
    normalizedForm.includes("крем") ||
    normalizedForm.includes("гель") ||
    normalizedForm.includes("лосьон")
  ) {
    return require("../assets/forms/ointment.png");
  }

  if (
    normalizedForm.includes("раствор") ||
    normalizedForm.includes("порош") ||
    normalizedForm.includes("гранул") ||
    normalizedForm.includes("небулайзер") ||
    normalizedForm.includes("полоск")
  ) {
    return require("../assets/forms/effervescent_solution.png");
  }

  if (normalizedForm.includes("ингал")) {
    return require("../assets/forms/pill_bottle.png");
  }

  return require("../assets/forms/pill_organizer.png");
}

export function filterEligibleCabinetRecipientIds(
  selectedIds: string[] | null | undefined,
  eligibleRecipientIds: string[],
) {
  return (selectedIds ?? []).filter((id) => eligibleRecipientIds.includes(id));
}

export function getCabinetFilterSectionTitle(
  locale: MobileLocale,
  filter: CabinetFilterKey,
) {
  if (filter === "all") {
    if (locale === "ru") return "Все препараты дома";
    if (locale === "de") return "Alle Medikamente zu Hause";
    if (locale === "pl") return "Wszystkie leki w domu";
    return "All medicines at home";
  }

  if (filter === "attention") {
    if (locale === "ru") return "Стоит проверить";
    if (locale === "de") return "Sollte geprüft werden";
    if (locale === "pl") return "Warto sprawdzić";
    return "Worth checking";
  }

  if (filter === "expired") {
    if (locale === "ru") return "Просроченные препараты";
    if (locale === "de") return "Abgelaufene Medikamente";
    if (locale === "pl") return "Przeterminowane leki";
    return "Expired medicines";
  }

  if (locale === "ru") return "Можно использовать";
  if (locale === "de") return "Kann verwendet werden";
  if (locale === "pl") return "Można użyć";
  return "Ready to use";
}
