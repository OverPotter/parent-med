/**
 * Запросы к API: регистрация, логин, me, logout и смена пароля.
 */

import { apiClient } from "./client";
import {
  buildClientSessionTokens,
  isNativeClientRuntime,
  sanitizeRefreshToken,
} from "@shared/security/authSession";
import type { AuthSessionResponse, AuthStateResponse } from "@shared/types/api";
import { toAccount, toFamily } from "@shared/types/transform";

interface RawAuthResponse {
  token_type: string;
  access_token: string | null;
  refresh_token: string | null;
  account: {
    id: string;
    email: string | null;
    family_id: string;
    display_name: string;
    needs_profile_completion?: boolean | null;
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

function toAuthState(raw: {
  account: {
    id: string;
    email: string | null;
    family_id: string;
    display_name: string;
    needs_profile_completion?: boolean | null;
    relationship_label: string | null;
    phone: string | null;
    preferred_language: "ru" | "en";
    family_role: string;
    access_policy?: RawAuthResponse["account"]["access_policy"];
  };
  family: RawAuthResponse["family"];
}): AuthStateResponse {
  return {
    account: toAccount(raw.account),
    family: toFamily(raw.family),
  };
}

export async function register(payload: {
  email: string;
  password: string;
  remember_me?: boolean;
  invite_token?: string;
  preferred_language?: "ru" | "en";
}): Promise<AuthSessionResponse> {
  const endpoint = isNativeClientRuntime() ? "/auth/native/signup" : "/auth/signup";
  const res = await apiClient.post<RawAuthResponse>(endpoint, payload);
  return toAuthResponse(res.data);
}

export async function login(payload: {
  email: string;
  password: string;
  remember_me?: boolean;
}): Promise<AuthSessionResponse> {
  const endpoint = isNativeClientRuntime() ? "/auth/native/signin" : "/auth/signin";
  const res = await apiClient.post<RawAuthResponse>(endpoint, payload);
  return toAuthResponse(res.data);
}

export async function refreshSession(refreshToken?: string | null): Promise<AuthSessionResponse> {
  const tokenForBody = sanitizeRefreshToken(refreshToken);
  const endpoint = isNativeClientRuntime() ? "/auth/native/refresh" : "/auth/refresh";
  const res = await apiClient.post<RawAuthResponse>(
    endpoint,
    tokenForBody
      ? {
          refresh_token: tokenForBody,
        }
      : undefined
  );
  return toAuthResponse(res.data);
}

export async function fetchMe(): Promise<AuthStateResponse> {
  const res = await apiClient.get<{
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
      access_policy?: RawAuthResponse["account"]["access_policy"];
    };
    family: RawAuthResponse["family"];
  }>("/auth/me");
  return toAuthState(res.data);
}

export async function logout(refreshToken?: string | null): Promise<void> {
  const tokenForBody = sanitizeRefreshToken(refreshToken);
  await apiClient.post(
    "/auth/logout",
    tokenForBody
      ? {
          refresh_token: tokenForBody,
        }
      : undefined
  );
}

export async function deleteMyAccount(): Promise<void> {
  await apiClient.delete("/auth/me");
}

export async function deleteMyFamily(): Promise<void> {
  await apiClient.delete("/auth/family");
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  refresh_token?: string | null;
}): Promise<void> {
  const tokenForBody = sanitizeRefreshToken(payload.refresh_token);
  await apiClient.patch("/auth/password", {
    current_password: payload.current_password,
    new_password: payload.new_password,
    ...(tokenForBody ? { refresh_token: tokenForBody } : {}),
  });
}

export async function updateRecoveryCode(payload: {
  recovery_code: string;
}): Promise<void> {
  await apiClient.patch("/auth/recovery-code", payload);
}

export async function resetPasswordByRecoveryCode(payload: {
  email: string;
  recovery_code: string;
  new_password: string;
}): Promise<void> {
  await apiClient.post("/auth/recover-password/code/reset", payload);
}

export async function updateAccountLanguage(preferredLanguage: "ru" | "en") {
  const res = await apiClient.patch<{
    id: string;
    email: string | null;
    family_id: string;
    display_name: string;
    needs_profile_completion?: boolean | null;
    has_recovery_code?: boolean | null;
    relationship_label: string | null;
    phone: string | null;
    preferred_language: "ru" | "en";
    family_role: string;
    access_policy?: RawAuthResponse["account"]["access_policy"];
  }>("/auth/language", {
    preferred_language: preferredLanguage,
  });
  return toAccount(res.data);
}
