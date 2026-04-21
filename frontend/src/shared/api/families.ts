/**
 * Запросы к API: семьи.
 */

import { apiClient } from "./client";
import type { Family, FamilyMember } from "@shared/types/api";
import { toFamily, toFamilyMember } from "@shared/types/transform";

export async function fetchFamilies(): Promise<Family[]> {
  const res = await apiClient.get<
    Array<{ id: string; name: string; cabinet_member_account_ids?: string[] | null }>
  >("/families");
  return res.data.map(toFamily);
}

export async function fetchFamily(id: string): Promise<Family> {
  const res = await apiClient.get<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>(`/families/${id}`);
  return toFamily(res.data);
}

export async function createFamily(name: string): Promise<Family> {
  const res = await apiClient.post<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>("/families", { name });
  return toFamily(res.data);
}

export async function updateFamily(id: string, name: string): Promise<Family> {
  const res = await apiClient.patch<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>(`/families/${id}`, { name });
  return toFamily(res.data);
}

export async function updateMyFamily(name: string): Promise<Family> {
  const res = await apiClient.patch<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>("/families/me", { name });
  return toFamily(res.data);
}

export async function fetchMyFamily(): Promise<Family> {
  const res = await apiClient.get<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>("/families/me");
  return toFamily(res.data);
}

export async function updateMyFamilyCabinetRecipients(
  cabinetMemberAccountIds: string[]
): Promise<Family> {
  const res = await apiClient.patch<{
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
  }>("/families/me", {
    cabinet_member_account_ids: cabinetMemberAccountIds,
  });
  return toFamily(res.data);
}

export async function fetchMyFamilyMembers(): Promise<FamilyMember[]> {
  const res = await apiClient.get<
    Array<{
      id: string;
      login: string;
      email: string | null;
      family_id: string;
      display_name: string;
      relationship_label: string | null;
      phone: string | null;
      preferred_language: "ru" | "en";
      family_role: string;
    }>
  >("/families/me/members");
  return (res.data ?? []).map(toFamilyMember);
}

export async function updateFamilyMemberRole(
  memberAccountId: string,
  familyRole: string
): Promise<FamilyMember> {
  const res = await apiClient.patch<{
    id: string;
    login: string;
    email: string | null;
    family_id: string;
    display_name: string;
    relationship_label: string | null;
    phone: string | null;
    preferred_language: "ru" | "en";
    family_role: string;
  }>(`/families/me/members/${memberAccountId}`, { family_role: familyRole });
  return toFamilyMember(res.data);
}

export async function updateFamilyMemberProfile(
  memberAccountId: string,
  payload: {
    display_name?: string;
    relationship_label?: string | null;
    phone?: string | null;
  }
): Promise<FamilyMember> {
  const res = await apiClient.patch<{
    id: string;
    login: string;
    email: string | null;
    family_id: string;
    display_name: string;
    relationship_label: string | null;
    phone: string | null;
    preferred_language: "ru" | "en";
    family_role: string;
  }>(`/families/me/members/${memberAccountId}/profile`, payload);
  return toFamilyMember(res.data);
}

export async function deleteFamilyMember(memberAccountId: string): Promise<void> {
  await apiClient.delete(`/families/me/members/${memberAccountId}`);
}

export async function deleteFamily(id: string): Promise<void> {
  await apiClient.delete(`/families/${id}`);
}
