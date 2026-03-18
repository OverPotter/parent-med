/**
 * Запросы к API: дети.
 */

import { apiClient } from "./client";
import type { Child } from "@shared/types/api";
import { toChild } from "@shared/types/transform";

export async function fetchChildrenByFamilyId(familyId: string): Promise<Child[]> {
  const res = await apiClient.get<
    Array<{
      id: string;
      family_id: string;
      name: string;
      birth_date: string | null;
      age_label: string | null;
    }>
  >("/children", { params: { family_id: familyId } });
  return (res.data ?? []).map(toChild);
}

export async function fetchChild(id: string): Promise<Child> {
  const res = await apiClient.get<{
    id: string;
    family_id: string;
    name: string;
    birth_date: string | null;
    age_label: string | null;
  }>(`/children/${id}`);
  return toChild(res.data);
}

interface CreateChildBody {
  family_id: string;
  name: string;
  birth_date?: string | null;
}

export async function createChild(
  familyId: string,
  name: string,
  birthDate?: string | null
): Promise<Child> {
  const body: CreateChildBody = { family_id: familyId, name, birth_date: birthDate ?? null };
  const res = await apiClient.post<{
    id: string;
    family_id: string;
    name: string;
    birth_date: string | null;
    age_label: string | null;
  }>("/children", body);
  return toChild(res.data);
}

export async function updateChild(
  id: string,
  name?: string,
  birthDate?: string | null
): Promise<Child> {
  const res = await apiClient.patch<{
    id: string;
    family_id: string;
    name: string;
    birth_date: string | null;
    age_label: string | null;
  }>(`/children/${id}`, { name, birth_date: birthDate ?? undefined });
  return toChild(res.data);
}

export async function deleteChild(id: string): Promise<void> {
  await apiClient.delete(`/children/${id}`);
}
