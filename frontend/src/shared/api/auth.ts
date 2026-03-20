/**
 * Запросы к API: регистрация, логин, me, logout и смена пароля.
 */

import { apiClient } from "./client";
import type { AuthSessionResponse, AuthStateResponse } from "@shared/types/api";
import { toAccount, toFamily } from "@shared/types/transform";

interface RawAuthResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  account: {
    id: string;
    email: string;
    family_id: string;
    display_name: string;
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

function toAuthState(raw: {
  account: {
    id: string;
    email: string;
    family_id: string;
    display_name: string;
    family_role: string;
  };
  family: { id: string; name: string };
}): AuthStateResponse {
  return {
    account: toAccount(raw.account),
    family: toFamily(raw.family),
  };
}

export async function register(payload: {
  email: string;
  password: string;
  display_name?: string;
  invite_token?: string;
}): Promise<AuthSessionResponse> {
  const res = await apiClient.post<RawAuthResponse>("/auth/signup", payload);
  return toAuthResponse(res.data);
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthSessionResponse> {
  const res = await apiClient.post<RawAuthResponse>("/auth/signin", payload);
  return toAuthResponse(res.data);
}

export async function refreshSession(refreshToken?: string | null): Promise<AuthSessionResponse> {
  const res = await apiClient.post<RawAuthResponse>(
    "/auth/refresh",
    refreshToken
      ? {
          refresh_token: refreshToken,
        }
      : undefined
  );
  return toAuthResponse(res.data);
}

export async function fetchMe(): Promise<AuthStateResponse> {
  const res = await apiClient.get<{
    account: {
      id: string;
      email: string;
      family_id: string;
      display_name: string;
      family_role: string;
    };
    family: { id: string; name: string };
  }>("/auth/me");
  return toAuthState(res.data);
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiClient.patch("/auth/password", payload);
}
