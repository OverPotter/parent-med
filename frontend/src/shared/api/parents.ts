/**
 * Запросы к API: родители внутри семьи.
 */

import { apiClient } from "./client";
import type { Parent } from "@shared/types/api";
import { toParent } from "@shared/types/transform";

interface RawParent {
  id: string;
  family_id: string;
  name: string;
  role: string;
}

export async function fetchParentsByFamilyId(familyId: string): Promise<Parent[]> {
  const res = await apiClient.get<RawParent[]>("/parents", { params: { family_id: familyId } });
  return (res.data ?? []).map(toParent);
}

export async function createParent(payload: {
  family_id: string;
  name: string;
  role: string;
}): Promise<Parent> {
  const res = await apiClient.post<RawParent>("/parents", payload);
  return toParent(res.data);
}

export async function updateParent(
  id: string,
  payload: { name?: string; role?: string }
): Promise<Parent> {
  const res = await apiClient.patch<RawParent>(`/parents/${id}`, payload);
  return toParent(res.data);
}

export async function deleteParent(id: string): Promise<void> {
  await apiClient.delete(`/parents/${id}`);
}
