import {
  afterOpeningShelfOptions,
  resolveAfterOpeningMode,
  type AfterOpeningMode,
} from "./afterOpeningShelfLife";
import { getManualCategoryLabel, type ManualCategory } from "./manualMedicineFlow";
import type { FlowStep } from "../screens/MedicineCabinetManualCreateParts";

export function formatExpiryForPreview(expiryDate: string) {
  if (!expiryDate.trim()) {
    return "";
  }

  const [year, month] = expiryDate.trim().split("-");
  if (!year || !month) {
    return expiryDate.trim();
  }

  return `До ${month}.${year}`;
}

export function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string, fallback: Date) {
  if (!value.trim()) {
    return fallback;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return fallback;
  }

  return new Date(year, month - 1, day);
}

export function resolvePreviousStep(step: FlowStep): FlowStep | null {
  if (step === 2) {
    return 1;
  }
  if (step === 3) {
    return 2;
  }
  return null;
}

export function buildManualCreatePreviewState({
  medicineName,
  category,
  expiryDate,
  openedDateLabel,
  afterOpeningPeriod,
  afterOpeningMode,
  isRu,
}: {
  medicineName: string;
  category: ManualCategory | null;
  expiryDate: string;
  openedDateLabel: string;
  afterOpeningPeriod: string;
  afterOpeningMode: AfterOpeningMode;
  isRu: boolean;
}) {
  const previewTitle =
    medicineName.trim().length > 0
      ? medicineName.trim()
      : isRu
        ? "Новый препарат"
        : "New medicine";

  const previewSubtitleBase = getManualCategoryLabel(category, isRu);
  const previewExpiry = formatExpiryForPreview(expiryDate);
  const previewOpened = openedDateLabel ? `Вскрыт ${openedDateLabel}` : "";
  const previewAfterOpening =
    afterOpeningPeriod.trim().length > 0
      ? `После вскрытия ${afterOpeningPeriod.trim()} дн.`
      : "";
  const afterOpeningLabel =
    afterOpeningMode === "custom"
      ? afterOpeningPeriod.trim()
        ? `${afterOpeningPeriod.trim()} дн.`
        : "Свой срок"
      : afterOpeningMode
        ? `${afterOpeningMode} дн.`
        : "";

  return {
    previewTitle,
    previewSubtitleBase,
    previewExpiry,
    previewOpened,
    previewAfterOpening,
    afterOpeningLabel,
  };
}

export { afterOpeningShelfOptions as manualAfterOpeningOptions, resolveAfterOpeningMode };
