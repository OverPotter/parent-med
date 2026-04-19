import type { HouseholdMedicine } from "@shared/types/api";

export type CabinetFilterKey = "expired" | "attention" | "ready" | "all";

export function isExpiredStatus(status: string) {
  return status === "expired" || status === "expired_after_opening";
}

export function needsAttention(status: string) {
  return (
    isExpiredStatus(status) || status === "expiring_soon" || status === "expiring_after_opening"
  );
}

export function getDefaultFilter(medicines: HouseholdMedicine[]): CabinetFilterKey {
  if (medicines.some((medicine) => isExpiredStatus(medicine.status))) {
    return "expired";
  }
  if (medicines.some((medicine) => needsAttention(medicine.status))) {
    return "attention";
  }
  if (medicines.some((medicine) => !needsAttention(medicine.status))) {
    return "ready";
  }
  return "all";
}

export function getFilterDotClass(filter: CabinetFilterKey, options?: { hasAttention?: boolean }) {
  if (filter === "expired") {
    return "bg-[color:color-mix(in_srgb,var(--color-danger)_84%,#ef4444_16%)]";
  }
  if (filter === "attention") {
    return "bg-[color:color-mix(in_srgb,var(--color-warning)_76%,var(--color-danger)_24%)]";
  }
  if (filter === "ready") {
    return "bg-[color:color-mix(in_srgb,var(--color-success)_82%,var(--color-primary)_18%)]";
  }
  return options?.hasAttention
    ? "bg-[color:color-mix(in_srgb,var(--color-info)_68%,var(--color-primary)_18%)]"
    : "bg-[color:color-mix(in_srgb,var(--color-primary)_64%,var(--color-info)_36%)]";
}
