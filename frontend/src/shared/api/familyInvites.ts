import { apiClient } from "./client";
import type { FamilyInvite, FamilyInvitePreview } from "@shared/types/api";
import { toFamilyInvite, toFamilyInvitePreview } from "@shared/types/transform";

export async function createFamilyInvite(payload?: {
  family_role?: string;
}): Promise<FamilyInvite> {
  const res = await apiClient.post<{
    token: string;
    family_id: string;
    family_name: string;
    family_role: string;
    expires_at: string;
  }>("/family-invites", payload ?? {});
  return toFamilyInvite(res.data);
}

export async function fetchFamilyInvitePreview(token: string): Promise<FamilyInvitePreview> {
  const res = await apiClient.get<{
    family_id: string;
    family_name: string;
    family_role: string;
    expires_at: string;
  }>(`/family-invites/${token}`);
  return toFamilyInvitePreview(res.data);
}
