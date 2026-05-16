import { buildManualCreatePreviewState } from "../manualMedicineCreateFlow";
import { getManualCategoryLabel } from "../manualMedicineFlow";
import { getReferenceCategories } from "../referenceMedicineCreateFlow";

describe("manual and reference cabinet copy", () => {
  it("localizes manual category labels and preview state", () => {
    expect(getManualCategoryLabel("skin", "de")).toBe("Haut");
    expect(getManualCategoryLabel("inhalation", "pl")).toBe("Inhalacja");

    const preview = buildManualCreatePreviewState({
      medicineName: "",
      category: "oral",
      expiryDate: "2026-12-01",
      openedDateLabel: "1 Dec 2026",
      afterOpeningPeriod: "45",
      afterOpeningMode: "custom",
      locale: "en",
    });

    expect(preview.previewTitle).toBe("New medicine");
    expect(preview.previewSubtitleBase).toBe("Oral");
    expect(preview.previewExpiry).toBe("By 12.2026");
    expect(preview.previewOpened).toBe("Opened 1 Dec 2026");
    expect(preview.afterOpeningLabel).toBe("45 days");
  });

  it("localizes reference categories", () => {
    const german = getReferenceCategories("de");
    const polish = getReferenceCategories("pl");

    expect(german.find((item) => item.key === "cold_cough")?.label).toBe(
      "Erkältung und Husten",
    );
    expect(polish.find((item) => item.key === "skin_wounds")?.label).toBe(
      "Skóra i rany",
    );
  });
});
