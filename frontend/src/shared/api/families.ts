/**
 * Запросы к API: семьи.
 */

import { apiClient } from "./client";
import type { Family, FamilyMember, FamilySubscriptionAccess } from "@shared/types/api";
import { toFamily, toFamilyMember } from "@shared/types/transform";
import {
  toFamilySubscriptionAccess,
  type RawFamilySubscriptionAccess,
} from "@shared/types/familySubscriptionAccess";

type RawFamily = {
  id: string;
  name: string;
  cabinet_member_account_ids?: string[] | null;
  owner_account_id?: string | null;
  billing_account_id?: string | null;
  free_primary_child_id?: string | null;
  plan_code?: "free" | "plus" | "pro" | null;
  subscription_status?: "inactive" | "trialing" | "active" | "grace" | "canceled" | "expired" | null;
  subscription_provider?: string | null;
  subscription_product_id?: string | null;
  subscription_expires_at?: string | null;
  premium_active?: boolean | null;
};

type RawFamilyMember = {
  id: string;
  email: string | null;
  family_id: string;
  display_name: string;
  relationship_label: string | null;
  phone: string | null;
  preferred_language: "ru" | "en";
  family_role: string;
  access_policy?: {
    all_children?: boolean;
    child_ids?: string[] | null;
    children_access?: "view" | "act" | "edit";
    cabinet_access?: "none" | "view" | "edit";
    pillbox_access?: "none" | "view" | "act" | "edit";
    cabinet_push_enabled?: boolean;
  } | null;
};

export async function fetchFamilies(): Promise<Family[]> {
  const res = await apiClient.get<RawFamily[]>("/families");
  return res.data.map(toFamily);
}

export async function fetchFamily(id: string): Promise<Family> {
  const res = await apiClient.get<RawFamily>(`/families/${id}`);
  return toFamily(res.data);
}

export async function createFamily(name: string): Promise<Family> {
  const res = await apiClient.post<RawFamily>("/families", { name });
  return toFamily(res.data);
}

export async function updateFamily(id: string, name: string): Promise<Family> {
  const res = await apiClient.patch<RawFamily>(`/families/${id}`, { name });
  return toFamily(res.data);
}

export async function updateMyFamily(name: string): Promise<Family> {
  const res = await apiClient.patch<RawFamily>("/families/me", { name });
  return toFamily(res.data);
}

export async function fetchMyFamily(): Promise<Family> {
  const res = await apiClient.get<RawFamily>("/families/me");
  return toFamily(res.data);
}

export async function fetchMyFamilyAccess(): Promise<FamilySubscriptionAccess> {
  const res = await apiClient.get<RawFamilySubscriptionAccess>("/families/me/access");
  return toFamilySubscriptionAccess(res.data);
}

export async function updateMyFamilyCabinetRecipients(
  cabinetMemberAccountIds: string[]
): Promise<Family> {
  const res = await apiClient.patch<RawFamily>("/families/me", {
    cabinet_member_account_ids: cabinetMemberAccountIds,
  });
  return toFamily(res.data);
}

export async function fetchMyFamilyMembers(): Promise<FamilyMember[]> {
  const res = await apiClient.get<RawFamilyMember[]>("/families/me/members");
  return (res.data ?? []).map(toFamilyMember);
}

export async function updateFamilyMember(
  memberAccountId: string,
  payload: {
    family_role?: string;
    access_policy?: {
      all_children?: boolean;
      child_ids?: string[];
      children_access?: "view" | "act" | "edit";
      cabinet_access?: "none" | "view" | "edit";
      pillbox_access?: "none" | "view" | "act" | "edit";
      cabinet_push_enabled?: boolean;
    };
  }
): Promise<FamilyMember> {
  const res = await apiClient.patch<RawFamilyMember>(
    `/families/me/members/${memberAccountId}`,
    payload
  );
  return toFamilyMember(res.data);
}

export async function updateFamilyMemberProfile(
  memberAccountId: string,
  payload: {
    display_name?: string | null;
    relationship_label?: string | null;
    phone?: string | null;
  }
): Promise<FamilyMember> {
  const res = await apiClient.patch<RawFamilyMember>(
    `/families/me/members/${memberAccountId}/profile`,
    payload
  );
  return toFamilyMember(res.data);
}

export async function deleteFamilyMember(memberAccountId: string): Promise<void> {
  await apiClient.delete(`/families/me/members/${memberAccountId}`);
}

export async function deleteFamily(id: string): Promise<void> {
  await apiClient.delete(`/families/${id}`);
}
