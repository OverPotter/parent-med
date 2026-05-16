import type { MobileHouseholdMedicine } from "../../api/mobileHouseholdMedicinesApi";
import {
  buildCabinetSummaryStats,
  getCabinetFilterSectionTitle,
  toMedicineCardItem,
} from "../medicineCabinetOverviewModel";

function makeMedicine(
  overrides: Partial<MobileHouseholdMedicine> = {},
): MobileHouseholdMedicine {
  return {
    id: "med-1",
    familyId: "family-1",
    medicineName: "Nurofen",
    medicineForm: "сироп",
    medicineCategory: "temperature",
    medicineConcentration: null,
    medicineDescription: "Pain relief",
    medicineDosage: "5 ml",
    pediatricDoseMgPerKgMin: null,
    pediatricDoseMgPerKgMax: null,
    pediatricDoseNote: null,
    expiryDate: "2026-05-20",
    openedAt: null,
    openedShelfDays: null,
    effectiveOpenedShelfDays: null,
    comment: null,
    status: "ready",
    statusLabel: "ready",
    expiryAlertDate: null,
    expiresInDays: 5,
    openedExpiresAt: null,
    openedExpiresInDays: null,
    ...overrides,
  };
}

describe("medicineCabinetOverviewModel", () => {
  it("localizes summary stat labels", () => {
    const stats = buildCabinetSummaryStats(
      [
        makeMedicine({ id: "1", status: "ready" }),
        makeMedicine({ id: "2", status: "expiring_soon" }),
        makeMedicine({ id: "3", status: "expired" }),
      ],
      "de",
    );

    expect(stats.map((stat) => [stat.key, stat.title])).toEqual([
      ["all", "Alle"],
      ["ready", "Okay"],
      ["attention", "Prüfen"],
      ["expired", "Abgelaufen"],
    ]);
  });

  it("localizes medicine card labels", () => {
    const card = toMedicineCardItem(
      makeMedicine({
        status: "expired",
        openedAt: "2026-05-10T10:00:00Z",
        openedExpiresAt: "2026-05-18",
      }),
      "pl",
    );

    expect(card.statusText).toBe("Przetermin.");
    expect(card.openedLabel).toContain("Otwarto");
    expect(card.afterOpeningLabel).toContain("Do");
  });

  it("returns localized section titles", () => {
    expect(getCabinetFilterSectionTitle("en", "ready")).toBe("Ready to use");
    expect(getCabinetFilterSectionTitle("ru", "expired")).toBe(
      "Просроченные препараты",
    );
  });
});
