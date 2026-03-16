/**
 * Запросы к API: справочник препаратов (поиск по названию, создание).
 */

import { apiClient } from "./client";
import type { MedicineCatalogItem } from "@shared/types/api";
import { toMedicineCatalogItem } from "@shared/types/transform";

interface RawMedicineCatalogItem {
  id: string;
  name: string;
  form: string;
  concentration: string | null;
}

export async function searchMedicineCatalog(
  name: string,
  limit = 20
): Promise<MedicineCatalogItem[]> {
  const res = await apiClient.get<RawMedicineCatalogItem[]>("/medicine-catalog", {
    params: { name, limit },
  });
  return (res.data ?? []).map(toMedicineCatalogItem);
}

export async function fetchMedicineCatalogItem(id: string): Promise<MedicineCatalogItem> {
  const res = await apiClient.get<RawMedicineCatalogItem>(`/medicine-catalog/${id}`);
  return toMedicineCatalogItem(res.data);
}

export async function createMedicineCatalogItem(body: {
  name: string;
  form: string;
  concentration?: string | null;
}): Promise<MedicineCatalogItem> {
  const res = await apiClient.post<RawMedicineCatalogItem>("/medicine-catalog", body);
  return toMedicineCatalogItem(res.data);
}
