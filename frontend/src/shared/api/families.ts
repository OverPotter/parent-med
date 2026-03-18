/**
 * Запросы к API: семьи.
 */

import { apiClient } from "./client";
import type { Family } from "@shared/types/api";
import { toFamily } from "@shared/types/transform";

export async function fetchFamilies(): Promise<Family[]> {
  const res = await apiClient.get<Array<{ id: string; name: string }>>("/families");
  return res.data.map(toFamily);
}

export async function fetchFamily(id: string): Promise<Family> {
  const res = await apiClient.get<{ id: string; name: string }>(`/families/${id}`);
  return toFamily(res.data);
}

export async function createFamily(name: string): Promise<Family> {
  const res = await apiClient.post<{ id: string; name: string }>("/families", { name });
  return toFamily(res.data);
}

export async function updateFamily(id: string, name: string): Promise<Family> {
  const res = await apiClient.patch<{ id: string; name: string }>(`/families/${id}`, { name });
  return toFamily(res.data);
}

export async function deleteFamily(id: string): Promise<void> {
  await apiClient.delete(`/families/${id}`);
}
