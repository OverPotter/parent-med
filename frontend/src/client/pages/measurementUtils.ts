import { getChildrenCopy } from "@client/i18n/children";

type ProfileCopy = ReturnType<typeof getChildrenCopy>["childProfile"];

export function buildMeasurementTrend(
  values: number[],
  language: "ru" | "en",
  copy: ProfileCopy,
  unit: "кг" | "см" | "kg" | "cm",
  stableThreshold: number
) {
  const [latestValue, previousValue] = values;
  if (latestValue === undefined || previousValue === undefined) {
    return language === "ru" ? "Нет сравнения" : "No baseline";
  }

  const diff = latestValue - previousValue;
  if (Math.abs(diff) < stableThreshold) {
    return copy.measurementTrendStable;
  }

  const sign = diff > 0 ? "+" : "";
  return language === "ru"
    ? `${sign}${formatDecimal(diff)} ${unit} к прошлому измерению`
    : `${sign}${formatDecimal(diff)} ${unit} since previous measurement`;
}

export function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function parseMeasurement(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
