import {
  afterOpeningShelfOptions,
  resolveAfterOpeningMode,
  type AfterOpeningMode,
} from "./afterOpeningShelfLife";
import { getManualCategoryLabel, type ManualCategory } from "./manualMedicineFlow";
import type { FlowStep } from "../screens/MedicineCabinetManualCreateParts";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

export function formatExpiryForPreview(
  expiryDate: string,
  locale: MobileLocale,
) {
  if (!expiryDate.trim()) {
    return "";
  }

  const [year, month] = expiryDate.trim().split("-");
  if (!year || !month) {
    return expiryDate.trim();
  }

  if (locale === "ru") return `До ${month}.${year}`;
  if (locale === "de") return `Bis ${month}.${year}`;
  if (locale === "pl") return `Do ${month}.${year}`;
  return `By ${month}.${year}`;
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
  locale,
}: {
  medicineName: string;
  category: ManualCategory | null;
  expiryDate: string;
  openedDateLabel: string;
  afterOpeningPeriod: string;
  afterOpeningMode: AfterOpeningMode;
  locale: MobileLocale;
}) {
  const previewTitle =
    medicineName.trim().length > 0
      ? medicineName.trim()
      : locale === "ru"
        ? "Новый препарат"
        : locale === "de"
          ? "Neues Medikament"
          : locale === "pl"
            ? "Nowy lek"
            : "New medicine";

  const previewSubtitleBase = getManualCategoryLabel(category, locale);
  const previewExpiry = formatExpiryForPreview(expiryDate, locale);
  const previewOpened = openedDateLabel
    ? locale === "ru"
      ? `Вскрыт ${openedDateLabel}`
      : locale === "de"
        ? `Geöffnet ${openedDateLabel}`
        : locale === "pl"
          ? `Otwarto ${openedDateLabel}`
          : `Opened ${openedDateLabel}`
    : "";
  const previewAfterOpening =
    afterOpeningPeriod.trim().length > 0
      ? locale === "ru"
        ? `После вскрытия ${afterOpeningPeriod.trim()} дн.`
        : locale === "de"
          ? `Nach dem Öffnen ${afterOpeningPeriod.trim()} Tg.`
          : locale === "pl"
            ? `Po otwarciu ${afterOpeningPeriod.trim()} dni`
            : `After opening ${afterOpeningPeriod.trim()} days`
      : "";
  const afterOpeningLabel =
    afterOpeningMode === "custom"
      ? afterOpeningPeriod.trim()
        ? locale === "ru"
          ? `${afterOpeningPeriod.trim()} дн.`
          : locale === "de"
            ? `${afterOpeningPeriod.trim()} Tg.`
            : locale === "pl"
              ? `${afterOpeningPeriod.trim()} dni`
              : `${afterOpeningPeriod.trim()} days`
        : locale === "ru"
          ? "Свой срок"
          : locale === "de"
            ? "Eigene Frist"
            : locale === "pl"
              ? "Własny termin"
              : "Custom period"
      : afterOpeningMode
        ? locale === "ru"
          ? `${afterOpeningMode} дн.`
          : locale === "de"
            ? `${afterOpeningMode} Tg.`
            : locale === "pl"
              ? `${afterOpeningMode} dni`
              : `${afterOpeningMode} days`
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
