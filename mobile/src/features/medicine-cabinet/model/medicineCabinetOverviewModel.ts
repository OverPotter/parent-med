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
    title: "Все",
    hint: "Полный список домашних препаратов",
    backgroundColor: "#F1EBFF",
    activeBackgroundColor: "#E3D8FF",
    activeBorderColor: "#D1BFFB",
    iconSource: require("../assets/summary/medicine_box_ui.png"),
  },
  {
    key: "ready",
    title: "Можно",
    hint: "Сейчас выглядят безопасными",
    backgroundColor: "#EEF9F3",
    activeBackgroundColor: "#DDF3E7",
    activeBorderColor: "#BCE4CE",
    iconSource: require("../assets/summary/check_success_ui.png"),
  },
  {
    key: "attention",
    title: "Проверить",
    hint: "Срок подходит к концу",
    backgroundColor: "#FFF3E6",
    activeBackgroundColor: "#FFE4C8",
    activeBorderColor: "#F6D0A0",
    iconSource: require("../assets/summary/need_check_ui.png"),
  },
  {
    key: "expired",
    title: "Просрочено",
    hint: "Упаковки с истекшим сроком",
    backgroundColor: "#FFF0F0",
    activeBackgroundColor: "#FFDCDC",
    activeBorderColor: "#F0B1B1",
    iconSource: require("../assets/summary/warning_ui.png"),
  },
];

function formatRuDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.slice(0, 10);
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}.${month}.${year}`;
}

function formatOpenedRelative(value: string | null | undefined) {
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
    return "Открыт сегодня";
  }
  if (diffDays === 1) {
    return "Открыт вчера";
  }
  return `Открыт ${diffDays} дн. назад`;
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
    value: String(values[stat.key]),
  }));
}

function getMedicineCardStatus(
  medicine: MobileHouseholdMedicine,
): Pick<
  MedicineCardItem,
  "cabinetStatus" | "statusText" | "statusBackgroundColor" | "statusTextColor"
> {
  if (isExpiredStatus(medicine.status)) {
    return {
      cabinetStatus: "expired",
      statusText: "Просрочен",
      statusBackgroundColor: "#FFE1E1",
      statusTextColor: "#E85D5D",
    };
  }

  if (isAttentionStatus(medicine.status)) {
    return {
      cabinetStatus: "attention",
      statusText: "Проверить",
      statusBackgroundColor: "#FFF0D9",
      statusTextColor: "#D77A16",
    };
  }

  if (!medicine.openedAt) {
    return {
      cabinetStatus: "ready",
      statusText: "Не вскрыт",
      statusBackgroundColor: "#EEF5FF",
      statusTextColor: "#4A90D9",
    };
  }

  return {
    cabinetStatus: "ready",
    statusText: "Можно",
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

function getMedicineSubtitle(medicine: MobileHouseholdMedicine) {
  const openedRelative = formatOpenedRelative(medicine.openedAt);
  if (openedRelative) {
    return openedRelative;
  }

  if (isExpiredStatus(medicine.status)) {
    return `Срок до ${formatRuDate(medicine.expiryDate) ?? medicine.expiryDate}`;
  }

  return "Не вскрыт";
}

function getMedicineExpiryLabel(medicine: MobileHouseholdMedicine) {
  const expiryDate = formatRuDate(medicine.expiryDate);
  if (!expiryDate) {
    return null;
  }
  return `До ${expiryDate}`;
}

function getMedicineOpenedLabel(medicine: MobileHouseholdMedicine) {
  const openedAt = formatRuDate(medicine.openedAt);
  if (!openedAt) {
    return null;
  }
  return `Вскрыт ${openedAt}`;
}

function getMedicineAfterOpeningLabel(medicine: MobileHouseholdMedicine) {
  if (medicine.openedExpiresAt) {
    const openedExpiryDate = formatRuDate(medicine.openedExpiresAt);
    if (openedExpiryDate) {
      return `До ${openedExpiryDate}`;
    }
  }

  if (medicine.effectiveOpenedShelfDays) {
    return `${medicine.effectiveOpenedShelfDays} дн.`;
  }

  return null;
}

export function toMedicineCardItem(
  medicine: MobileHouseholdMedicine,
): MedicineCardItem {
  return {
    id: medicine.id,
    title: medicine.medicineName,
    subtitle: getMedicineSubtitle(medicine),
    medicineForm: medicine.medicineForm,
    medicineCategory: medicine.medicineCategory,
    concentration: medicine.medicineConcentration,
    artBackgroundColor: getMedicineArtBackgroundColor(medicine.medicineForm),
    tags: getMedicineTags(medicine),
    ...getMedicineCardStatus(medicine),
    description: medicine.medicineDescription,
    dosage: medicine.medicineDosage,
    comment: medicine.comment,
    expiryLabel: getMedicineExpiryLabel(medicine),
    openedLabel: getMedicineOpenedLabel(medicine),
    afterOpeningLabel: getMedicineAfterOpeningLabel(medicine),
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
