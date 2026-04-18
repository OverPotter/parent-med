import type { AppLanguage } from "@shared/i18n";
import type { HouseholdMedicine } from "@shared/types/api";
import { formatDate, getLocalIsoDate } from "@shared/utils/date";
import { tCabinet, type CabinetCopyKey } from "./copy";

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

export function getMedicineFormOptions(language: AppLanguage) {
  return [
    { value: "таблетки", label: tCabinet(language, "tablets") },
    { value: "сироп", label: tCabinet(language, "syrup") },
    { value: "капли", label: tCabinet(language, "drops") },
    { value: "суспензия", label: tCabinet(language, "suspension") },
    { value: "раствор", label: tCabinet(language, "solution") },
    { value: "суппозитории", label: tCabinet(language, "suppositories") },
  ];
}

export function getLocalizedMedicineForm(value: string, language: AppLanguage): string {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return value;
  }

  const knownForms: Record<string, CabinetCopyKey> = {
    таблетки: "tablets",
    syrup: "syrup",
    сироп: "syrup",
    капли: "drops",
    drops: "drops",
    суспензия: "suspension",
    suspension: "suspension",
    раствор: "solution",
    solution: "solution",
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
