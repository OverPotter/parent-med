/**
 * Запросы к API: домашняя аптечка.
 */

import { apiClient } from "./client";
import type { HouseholdMedicine } from "@shared/types/api";
import { toHouseholdMedicine } from "@shared/types/transform";

type Raw = {
  id: string;
  family_id: string;
  catalog_item_id: string | null;
  medicine_name: string;
  medicine_form: string;
  medicine_concentration: string | null;
  medicine_description: string | null;
  medicine_dosage: string | null;
  expiry_date: string;
  opened_at: string | null;
  opened_shelf_days: number | null;
  effective_opened_shelf_days: number | null;
  comment: string | null;
  status: string;
  status_label: string;
  expiry_alert_date: string | null;
  expires_in_days: number;
  opened_expires_at: string | null;
  opened_expires_in_days: number | null;
};

export async function fetchHouseholdMedicines(): Promise<HouseholdMedicine[]> {
  const res = await apiClient.get<Raw[]>("/household-medicines");
  return (res.data ?? []).map(toHouseholdMedicine);
}

export async function fetchHouseholdMedicine(id: string): Promise<HouseholdMedicine> {
  const res = await apiClient.get<Raw>(`/household-medicines/${id}`);
  return toHouseholdMedicine(res.data);
}

export async function createHouseholdMedicine(p: {
  catalog_item_id?: string | null;
  medicine_name?: string | null;
  medicine_form?: string | null;
  medicine_concentration?: string | null;
  medicine_description?: string | null;
  medicine_dosage?: string | null;
  expiry_date: string;
  opened_at?: string | null;
  opened_shelf_days?: number | null;
  comment?: string | null;
}): Promise<HouseholdMedicine> {
  const res = await apiClient.post<Raw>("/household-medicines", p);
  return toHouseholdMedicine(res.data);
}

export async function updateHouseholdMedicine(
  id: string,
  p: {
    medicine_name?: string | null;
    medicine_form?: string | null;
    medicine_concentration?: string | null;
    medicine_description?: string | null;
    medicine_dosage?: string | null;
    expiry_date?: string | null;
    opened_at?: string | null;
    opened_shelf_days?: number | null;
    comment?: string | null;
  }
): Promise<HouseholdMedicine> {
  const res = await apiClient.patch<Raw>(`/household-medicines/${id}`, p);
  return toHouseholdMedicine(res.data);
}

export async function deleteHouseholdMedicine(id: string): Promise<void> {
  await apiClient.delete(`/household-medicines/${id}`);
}
