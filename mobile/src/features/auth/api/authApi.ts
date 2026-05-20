import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import { getMobileApiBaseUrl } from "../../../shared/config/mobileRuntimeConfig";

type BackendPreferredLanguage = MobileLocale;

type RawFamilyInvitePreviewResponse = {
  family_id: string;
  family_name: string;
  family_role: string;
  expires_at: string;
};

type RawFamilyResponse = {
  id: string;
  name: string;
  owner_account_id?: string | null;
};

type RawFamilyMemberResponse = {
  id: string;
  email: string | null;
  family_id: string;
  display_name: string;
  relationship_label: string | null;
  phone: string | null;
  preferred_language: BackendPreferredLanguage;
  family_role: string;
};

export type MobileAuthSession = {
  tokenType: string;
  accessToken: string | null;
  refreshToken: string | null;
  account: {
    id: string;
    email: string | null;
    familyId: string;
    displayName: string;
    needsProfileCompletion: boolean;
    relationshipLabel: string | null;
    phone: string | null;
    preferredLanguage: MobileLocale;
    familyRole: string;
    hasRecoveryCode: boolean;
  };
  family: {
    id: string;
    name: string;
    ownerAccountId: string | null;
  };
};

export class MobileAuthApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileAuthApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

type RawAuthResponse = {
  token_type: string;
  access_token: string | null;
  refresh_token: string | null;
  account: {
    id: string;
    email: string | null;
    family_id: string;
    display_name: string;
    needs_profile_completion?: boolean | null;
    relationship_label?: string | null;
    phone?: string | null;
    preferred_language: BackendPreferredLanguage;
    family_role: string;
    has_recovery_code?: boolean | null;
  };
  family: RawFamilyResponse;
};

const API_BASE_URL = getMobileApiBaseUrl();

function toSession(raw: RawAuthResponse): MobileAuthSession {
  return {
    tokenType: raw.token_type,
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    account: {
      id: raw.account.id,
      email: raw.account.email,
      familyId: raw.account.family_id,
      displayName: raw.account.display_name,
      needsProfileCompletion: Boolean(raw.account.needs_profile_completion),
      relationshipLabel: raw.account.relationship_label ?? null,
      phone: raw.account.phone ?? null,
      preferredLanguage: raw.account.preferred_language,
      familyRole: raw.account.family_role,
      hasRecoveryCode: Boolean(raw.account.has_recovery_code),
    },
    family: {
      id: raw.family.id,
      name: raw.family.name,
      ownerAccountId: raw.family.owner_account_id ?? null,
    },
  };
}

function parseErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const candidate = payload as {
    code?: unknown;
    detail?: unknown;
    message?: unknown;
  };

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    detail:
      typeof candidate.detail === "string"
        ? candidate.detail
        : typeof candidate.message === "string"
          ? candidate.message
          : undefined,
  };
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const { code, detail } = parseErrorPayload(payload);
    throw new MobileAuthApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

async function requestAuthedJson<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<T> {
  return requestJson<T>(path, {
    ...init,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export function toBackendPreferredLanguage(
  locale: MobileLocale,
): BackendPreferredLanguage {
  return locale;
}

export async function loginWithPassword(payload: {
  email: string;
  password: string;
}) {
  const response = await requestJson<RawAuthResponse>("/auth/native/signin", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      remember_me: true,
    }),
  });

  return toSession(response);
}

export async function registerWithPassword(payload: {
  email: string;
  password: string;
  preferredLanguage: BackendPreferredLanguage;
  inviteToken?: string;
}) {
  const response = await requestJson<RawAuthResponse>("/auth/native/signup", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      remember_me: true,
      preferred_language: payload.preferredLanguage,
      invite_token: payload.inviteToken,
    }),
  });

  return toSession(response);
}

export async function fetchFamilyInvitePreview(token: string) {
  const response = await requestJson<RawFamilyInvitePreviewResponse>(
    `/family-invites/${token}`,
    {
      method: "GET",
    },
  );

  return {
    familyName: response.family_name,
    expiresAt: response.expires_at,
  };
}

export async function refreshMobileSession(refreshToken: string) {
  const response = await requestJson<RawAuthResponse>("/auth/native/refresh", {
    method: "POST",
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  return toSession(response);
}

export async function logoutMobileSession(payload: {
  accessToken: string | null;
  refreshToken: string | null;
}) {
  await requestAuthedJson<void>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({
        refresh_token: payload.refreshToken,
      }),
    },
    payload.accessToken,
  );
}

export async function updateMyFamilyName(payload: {
  accessToken: string | null;
  name: string;
}) {
  const response = await requestAuthedJson<RawFamilyResponse>(
    "/families/me",
    {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name,
      }),
    },
    payload.accessToken,
  );

  return {
    id: response.id,
    name: response.name,
  };
}

export async function updateMyFamilyMemberProfile(payload: {
  accessToken: string | null;
  memberAccountId: string;
  displayName?: string | null;
  relationshipLabel?: string | null;
  phone?: string | null;
}) {
  const response = await requestAuthedJson<RawFamilyMemberResponse>(
    `/families/me/members/${payload.memberAccountId}/profile`,
    {
      method: "PATCH",
      body: JSON.stringify({
        display_name: payload.displayName,
        relationship_label: payload.relationshipLabel,
        phone: payload.phone,
      }),
    },
    payload.accessToken,
  );

  return {
    id: response.id,
    displayName: response.display_name,
    relationshipLabel: response.relationship_label ?? null,
    phone: response.phone ?? null,
  };
}

export async function resetPasswordByRecoveryCode(payload: {
  email: string;
  recoveryCode: string;
  newPassword: string;
}) {
  await requestJson<void>("/auth/recover-password/code/reset", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      recovery_code: payload.recoveryCode,
      new_password: payload.newPassword,
    }),
  });
}
