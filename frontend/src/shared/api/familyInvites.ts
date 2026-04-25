import { apiClient } from "./client";
import { buildClientSessionTokens, isNativeClientRuntime } from "@shared/security/authSession";
import type { AuthSessionResponse, FamilyInvite, FamilyInvitePreview } from "@shared/types/api";
import {
  toAccount,
  toFamily,
  toFamilyInvite,
  toFamilyInvitePreview,
} from "@shared/types/transform";

interface RawAuthResponse {
  token_type: string;
  access_token: string | null;
  refresh_token: string | null;
  account: {
    id: string;
    email: string | null;
    family_id: string;
    display_name: string;
    has_recovery_code?: boolean | null;
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
  family: {
    id: string;
    name: string;
    cabinet_member_account_ids?: string[] | null;
    billing_account_id?: string | null;
    plan_code?: "free" | "plus" | "pro" | null;
    subscription_status?: "inactive" | "active" | "grace" | "canceled" | "expired" | null;
    subscription_provider?: string | null;
    subscription_product_id?: string | null;
    subscription_expires_at?: string | null;
    premium_active?: boolean | null;
  };
}

function toAuthResponse(raw: RawAuthResponse): AuthSessionResponse {
  return {
    tokenType: raw.token_type,
    ...buildClientSessionTokens({
      accessToken: raw.access_token,
      refreshToken: raw.refresh_token,
    }),
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
  const endpoint = isNativeClientRuntime()
    ? `/family-invites/${token}/accept/native`
    : `/family-invites/${token}/accept`;
  const res = await apiClient.post<RawAuthResponse>(endpoint);
  return toAuthResponse(res.data);
}
