/**
 * Запросы к API: curated-справочник препаратов для выбора в аптечке.
 */

import { apiClient } from "./client";
import type { MedicineCatalogItem } from "@shared/types/api";
import type { AppLanguage } from "@shared/i18n";

interface RawCuratedMedicineCatalogItem {
  id: string;
  language: string;
  display_name: string;
  active_substance: string | null;
  form: string;
  strength: string | null;
  short_description?: string | null;
  dosage_summary?: string | null;
  pediatric_dose_mg_per_kg_min?: number | null;
  pediatric_dose_mg_per_kg_max?: number | null;
  pediatric_dose_note?: string | null;
  default_opened_shelf_days?: number | null;
  is_otc: boolean;
  is_home_cabinet_relevant: boolean;
  search_rank: number;
}

interface SearchMedicineCatalogOptions {
  query?: string;
  language: AppLanguage;
  limit?: number;
}

export async function searchMedicineCatalog(
  options: SearchMedicineCatalogOptions
): Promise<MedicineCatalogItem[]> {
  const { query, language, limit = 20 } = options;
  const res = await apiClient.get<RawCuratedMedicineCatalogItem[]>("/curated-medicine-catalog", {
    params: {
      language,
      limit,
      ...(query?.trim() ? { query: query.trim() } : {}),
    },
  });
  return (res.data ?? []).map(toMedicineCatalogItem);
}

export async function fetchMedicineCatalogItem(id: string): Promise<MedicineCatalogItem> {
  const res = await apiClient.get<RawCuratedMedicineCatalogItem>(`/curated-medicine-catalog/${id}`);
  return toMedicineCatalogItem(res.data);
}

function toMedicineCatalogItem(r: RawCuratedMedicineCatalogItem): MedicineCatalogItem {
  return {
    id: r.id,
    name: r.display_name,
    form: r.form,
    concentration: r.strength ?? null,
    description: r.short_description ?? null,
    dosage: r.dosage_summary ?? null,
    pediatricDoseMgPerKgMin: r.pediatric_dose_mg_per_kg_min ?? null,
    pediatricDoseMgPerKgMax: r.pediatric_dose_mg_per_kg_max ?? null,
    pediatricDoseNote: r.pediatric_dose_note ?? null,
    defaultOpenedShelfDays: r.default_opened_shelf_days ?? null,
  };
}
