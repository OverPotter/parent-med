import { apiClient } from "./client";
import type { AuthSessionResponse, FamilyInvite, FamilyInvitePreview } from "@shared/types/api";
import {
  toAccount,
  toFamily,
  toFamilyInvite,
  toFamilyInvitePreview,
} from "@shared/types/transform";

interface RawAuthResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  account: {
    id: string;
    login: string;
    email: string | null;
    family_id: string;
    display_name: string;
    relationship_label: string | null;
    phone: string | null;
    family_role: string;
  };
  family: { id: string; name: string };
}

function toAuthResponse(raw: RawAuthResponse): AuthSessionResponse {
  return {
    tokenType: raw.token_type,
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    account: toAccount(raw.account),
    family: toFamily(raw.family),
  };
}

export async function createFamilyInvite(payload?: {
  family_role?: string;
}): Promise<FamilyInvite> {
  const res = await apiClient.post<{
    token: string;
    family_id: string;
    family_name: string;
    family_role: string;
    invite_path: string;
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

export async function acceptFamilyInvite(token: string): Promise<AuthSessionResponse> {
  const res = await apiClient.post<RawAuthResponse>(`/family-invites/${token}/accept`);
  return toAuthResponse(res.data);
}
