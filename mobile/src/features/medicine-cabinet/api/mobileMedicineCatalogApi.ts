import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "../../illness/api/illnessApiClient";

type RawCuratedMedicineCatalogItem = {
  id: string;
  language: string;
  display_name: string;
  active_substance?: string | null;
  form: string;
  strength?: string | null;
  short_description?: string | null;
  dosage_summary?: string | null;
  pediatric_dose_mg_per_kg_min?: number | null;
  pediatric_dose_mg_per_kg_max?: number | null;
  pediatric_dose_note?: string | null;
  default_opened_shelf_days?: number | null;
};

export type MobileMedicineCatalogItem = {
  id: string;
  name: string;
  form: string;
  concentration: string | null;
  description: string | null;
  dosage: string | null;
  pediatricDoseMgPerKgMin: number | null;
  pediatricDoseMgPerKgMax: number | null;
  pediatricDoseNote: string | null;
  defaultOpenedShelfDays: number | null;
};

export class MobileMedicineCatalogApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileMedicineCatalogApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

function toMobileMedicineCatalogItem(
  raw: RawCuratedMedicineCatalogItem,
): MobileMedicineCatalogItem {
  return {
    id: raw.id,
    name: raw.display_name,
    form: raw.form,
    concentration: raw.strength ?? null,
    description: raw.short_description ?? null,
    dosage: raw.dosage_summary ?? null,
    pediatricDoseMgPerKgMin: raw.pediatric_dose_mg_per_kg_min ?? null,
    pediatricDoseMgPerKgMax: raw.pediatric_dose_mg_per_kg_max ?? null,
    pediatricDoseNote: raw.pediatric_dose_note ?? null,
    defaultOpenedShelfDays: raw.default_opened_shelf_days ?? null,
  };
}

export async function searchMobileMedicineCatalog(payload: {
  accessToken: string | null;
  language: string;
  query?: string;
  limit?: number;
}): Promise<MobileMedicineCatalogItem[]> {
  const params = new URLSearchParams({
    language: payload.language,
    limit: String(payload.limit ?? 40),
  });

  if (payload.query?.trim()) {
    params.set("query", payload.query.trim());
  }

  const response = await requestIllnessAuthedJson<RawCuratedMedicineCatalogItem[]>(
    `/curated-medicine-catalog?${params.toString()}`,
    { method: "GET" },
    payload.accessToken,
    (message, options) => new MobileMedicineCatalogApiError(message, options),
  );

  return (response ?? []).map(toMobileMedicineCatalogItem);
}
