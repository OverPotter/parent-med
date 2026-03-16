/**
 * Запросы к API: домашняя аптечка.
 */

import { apiClient } from "./client";
import type { HouseholdMedicine } from "@shared/types/api";
import { toHouseholdMedicine } from "@shared/types/transform";

type Raw = {
  id: string;
  family_id: string;
  catalog_item_id: string;
  expiry_date: string;
  opened_at: string | null;
  storage_place: string | null;
  comment: string | null;
};

export async function fetchHouseholdMedicinesByFamilyId(
  familyId: string
): Promise<HouseholdMedicine[]> {
  const res = await apiClient.get<Raw[]>("/household-medicines", {
    params: { family_id: familyId },
  });
  return (res.data ?? []).map(toHouseholdMedicine);
}

export async function fetchHouseholdMedicine(id: string): Promise<HouseholdMedicine> {
  const res = await apiClient.get<Raw>(`/household-medicines/${id}`);
  return toHouseholdMedicine(res.data);
}

export async function createHouseholdMedicine(p: {
  family_id: string;
  catalog_item_id: string;
  expiry_date: string;
  opened_at?: string | null;
  storage_place?: string | null;
  comment?: string | null;
}): Promise<HouseholdMedicine> {
  const res = await apiClient.post<Raw>("/household-medicines", p);
  return toHouseholdMedicine(res.data);
}

export async function updateHouseholdMedicine(
  id: string,
  p: { opened_at?: string | null; storage_place?: string | null; comment?: string | null }
): Promise<HouseholdMedicine> {
  const res = await apiClient.patch<Raw>(`/household-medicines/${id}`, p);
  return toHouseholdMedicine(res.data);
}

export async function deleteHouseholdMedicine(id: string): Promise<void> {
  await apiClient.delete(`/household-medicines/${id}`);
}
